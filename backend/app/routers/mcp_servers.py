from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.mcp_tools import refresh_mcp_server_tools
from app.db.models import MCPServer, MCPTool
from app import schemas
from app.db import models
from app.schemas.tools import (
    MCPServerCreate,MCPServerRead
)

router = APIRouter(prefix="/mcp_servers",tags=["mcp"]) 

@router.get("/", response_model=list[MCPServerRead])
def list_mcp_servers(db:Session = Depends(get_db)):
    """
    List all configured MCP Servers.
    """
    servers = db.query(models.MCPServer).order_by(models.MCPServer.created_at.desc()).all()
    return servers                  

@router.post("/", response_model=MCPServerRead, status_code=status.HTTP_201_CREATED)
def create_mcp_server(payload:MCPServerCreate, db:Session=Depends(get_db)):
    """
    create a new MCP Server from the library template
    example payload:
    {
        "name": "Filesystem MCP",
        "description": "Local file tools",
        "server_type": "http",
        "endpoint": "https://localhost:8000/mcp",
        "config_json": {
            "auth_header": "Bearer <your-token>"
            "timeout_seconds": 30
            }}
    """
    server = models.MCPServer(
        name = payload.name,
        description = payload.description,
        server_type = payload.server_type,
        endpoint = payload.endpoint,
        config_json = payload.config_json,
    )
    db.add(server)
    db.commit()
    db.refresh(server)
    return server
    
    
@router.post("/{server_id}/refresh_tools", response_model=List[Dict[str,Any]] )
def refresh_server_tools(
    server_id:int,
    db:Session=Depends(get_db)
):
    """ 
    Refresh tools for a given MCP server.
    
    what it does:
    1. calls `refresh_mcp_server_tools(db,server_id)`:
    - uses MCP HTTP Client to ask {endpoint}/tools.
    - wipes existing mcptool rows for that server.
    - inserts fresh ones.
    
    2. returns a simple JSON list describing  the tools, eg:
        [
            {
                "id":3,
                "name":"search_files",
                "description":{...},
                "schema_json":{...},
                "enabled":true,
                "server_id":1
            },
            ...
        ]
    """
    
    # step 1: trigger the refresh
    try:
        tools: List[MCPTool] = refresh_mcp_server_tools(db,server_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # step 2 convert orm objects into plain dicts for response
    return[
        {
            "id":t.id,
            "name":t.name,
            "description":t.description,
            "schema_json":t.schema_json,
            "enabled":t.enabled,
            "server_id":t.server_id,
        }
        for t in tools
    ]


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mcp_server(server_id: int, db: Session = Depends(get_db)):
    """
    Delete an MCP server and all its associated tools.
    """
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    
    # Delete associated tools first
    db.query(MCPTool).filter(MCPTool.server_id == server_id).delete()
    
    # Delete the server
    db.delete(server)
    db.commit()
    return None
