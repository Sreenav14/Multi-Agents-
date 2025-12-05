from typing import List
from sqlalchemy.orm import Session

from app.db.models import MCPServer, MCPTool
from app.mcp.client import list_mcp_tools, MCPClientError

def refresh_mcp_server_tools(db: Session, server_id: int) -> List[MCPTool]:
    """ 
    Sync tools from a give mcp server into the mcptool table.
    
    what this function does:
    
    1. fetch the mcpserver row from the DB using server_id
    2. call list_mcp_tools(server) to ask the external mcp server
        via http what tools it currently exposes.
    3. Remove all existing mcptools rows for this server
        - this avoids keeping stale/deleted tools.
    4. Insert fresh mcptools rows for each tool returned by the mcp server.
    5. commit the transaction and return the list of newly created mcptool objects.
    
    why we do it this way:
    - keeps DB operations seperate from HTTP client logic.
    - Ensures the database is always in sync with the external mcp server.
    - Makes it easy to trigger a "refresh tools" from a FastAPI route or from an admin UI in studio.
    
    
    PARAMETERS:
    db:Session
        An active sqlalchemy session.
    server_id:int
        The primary key of the mcpserver row you want to sync
    """
    
    #  Load the MCPServer row from the DB
    server = db.query(MCPServer).filter(MCPServer.id==server_id).first()
    if not server:
        raise ValueError(f"No MCPServer found with id {server_id}")
    
    # Ask the MCP server for the list of tools
    try:
        tool_specs = list_mcp_tools(server)
    except MCPClientError as e:
        raise ValueError(str(e))
    
    # 3. delete existing tools for this server to avoid staleness.
    db.query(MCPTool).filter(MCPTool.server_id==server_id).delete()
    
    # 4. Insert new tools based on the MCP server's response.
    created_tools = []
    
    for spec in tool_specs:
        # each spec is a dict with:
        #  {"name":"...","description":"...","schema":{...}}
        
        name = spec.get("name")
        if not name:
            # If the MCP Server return an invalid tool without a name, skip it
            continue
        
        description = spec.get("description")
        # some server use schema or parameters but we support both
        schema_json = spec.get("schema")or spec.get("parameters") or {}
        
        tool = MCPTool(
            server_id = server_id,
            name = name,
            description = description,
            schema_json = schema_json,
            enabled = True,
        )
        db.add(tool)
        created_tools.append(tool)
        
    # 5. commit changes
    db.commit()
    
    
    # 6. refresh each tool to ensure IDs and timestamps are populated
    for t in created_tools:
        db.refresh(t)
        
    return created_tools
        
    