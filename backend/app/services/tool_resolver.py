from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.models import Assistant, UserToolConnection, MCPServer

def resolve_tools_for_assistant(
    db:Session,
    assistant: Assistant,
) -> Dict[str, List[Dict[str, Any]]]:
    """ 
    Given an Assistant (with graph_json), return a mapping:
    {
        "<agent_id>":[
            {
                "kind":"user_tool" | "mcp_server",
                "id":1,
                "template_key":"tavily",
                "config":{
                    ...}},
                {
                    "kind":"mcp_server",
                    "id":2,
                    "name":"filesystem MCP",
                    "server_type":"stdio",
                    "config":{...}
                }
            } ],
        ...
    }
    """
    
    graph = assistant.graph_json or {}
    nodes = graph.get("nodes",[])
    
    user_tools_by_id: Dict[int, UserToolConnection] = {
        ut.id: ut for ut in db.query(UserToolConnection).all()
    }
    mcp_servers_by_id: Dict[int, MCPServer] = {
        ms.id: ms for ms in db.query(MCPServer).all()
    }
    
    resolved : Dict[str, List[Dict[str, Any]]] = {}
    
    for node in nodes:
        agent_id = node.get("id")
        tool_refs = node.get("tool_refs") or []
        
        resolved_list: List[dict[str, Any]] = []
        
        for ref in tool_refs:
            kind = ref.get("kind")
            ref_id = ref.get("id")
            
            if kind == "user_tool":
                ut = user_tools_by_id.get(ref_id)
                if not ut:
                    print(f"[WARNING] User tool with id {ref_id} not found in database")
                    continue
                print(f"[DEBUG] Resolved user_tool: id={ut.id}, template_key={ut.template_key}, status={ut.status}")
                resolved_list.append({
                    "kind":"user_tool",
                    "id":ut.id,
                    "template_key":ut.template_key,
                    "config":ut.config_json or {},
                    "status": ut.status,
                })
                
            elif kind == "mcp_server":
                ms = mcp_servers_by_id.get(ref_id)
                if not ms:
                    continue
                resolved_list.append({
                    "kind":"user_tool",
                    "id":ms.id,
                    "template_key":"mcp",
                    "config":{
                        "endpoint":ms.endpoint,
                        "config_json":ms.config_json or {},
                    },
                })
                
            else:
                continue
        resolved[agent_id] = resolved_list
    return resolved
