from difflib import restore
from importlib import invalidate_caches
from typing import Any, Dict, List, Optional
import requests
from sqlalchemy import false, true
import json 

from app.db.models import MCPServer


class MCPClientError(Exception):
    """
    Custom exception for MCP-related client errors.
    
    We use a dedicated exception type so the rest of your code can:
    - Catch MCP-sepcific failures (server down, bad response, etc)
    - Distinguish them from normal application bugs...    
    """
    pass

def list_mcp_tools(server: MCPServer) -> List[Dict[str, Any]]:
    """
    Ask a custom MCP server for the list of tools it exposes.
    
    what this function does:
    
    1. Take an mcpserver row from your database, which has:
    - server.endpoint: base URL of the mcp http gateway
    - server.config_json: optional config to pass through
    
    2. Builds the URL: {endpoint}/tools
     example: endpoint = "http://localhost:8000", 
     then the URL is "http://localhost:8000/tools"
     
    3. Sends an http post to that url with JSON body:
        {
            "config": server.config_json or {}
        }
        this allows your mcp server to:
        - Use any config you stored (auth tokens, root directory,etc)
        - Stay stateless: every request carries needed info
    
    4. expects a JSON response like:
        {
            "tools": [
                {
                    "name": "tool_name",
                    "description": ".....",
                    "schema":{....}
                },
                ....
            ]
        }
        
    5. Validates that 'tools' is a list and return it 
    
    What it does not do:
    - it does not write to yor database
    - it does not interact with LLM or TOOL_REGISTRY
    - It is a low-level helper used by higher-level services.  
    
    """
    
    # 1. build the URL
    base_url = server.endpoint.rstrip("/")
    url = f"{base_url}/tools"
    
    # 2. Build the request payload
    payload: Dict[str, Any] = {
        "config": server.config_json or {}
    }
    
    try:
        # 3. call the server
        resp = requests.post(url, json=payload, timeout=15)
    except Exception as e:
        raise MCPClientError(f"Failed to reach MCP server at {url}: {e}")
    
    # 4. check for the http errors
    if resp.status_code != 200:
        raise MCPClientError(
            f"MCP server returned {resp.status_code} for {url}: {resp.text}"
        )
    
    # 5. parse the response
    try:
        data = resp.json()
    except ValueError as e:
        raise MCPClientError(f"Invalid JSON response from mcp server at {url}: {e}")\
            
    #  Extarct and validate toosl
    tools = data.get("tools", [])
    if not isinstance(tools, list):
        raise MCPClientError(f"Invalid 'tools' field in response from {url}: expected list, got {type(tools)}") 
    
    return tools


# call mcp tools
def call_mcp_tool(
    server: MCPServer,
    tool_name: str,
    arguments: Dict[str, Any],
)-> str:
    """ 
    Call a specific tool exposed by an MCP Server over HTTP.
    
    What this function does:
    
    1. Builds the url: {server.endpoint}/call
        example: endpoint = "http://localhost:8000", 
        then the URL is "http://localhost:8000/call"
        
    2. Sends JSON body:
        {
            "tool" : tool_name,
            "arguments" : {...whatever the tool's JSON schema expects...},
            "config" : server.config_json or {}
        }
        
        - 'tool' is the mcp tool name ( eg: "search_files")
        - 'arguments' is a dict that match with the tool's JSON schema
        - 'config' lets your MCP server read any metadata/config stored 
           in mcpserver.config_json(auth tokens, directories, etc).
           
    3. Expects a JSON response from the MCP HTTP gateway:
        {
            "ok" : true,
            "result" : <some string or JSON-serializable data>,
            "meta":{...optional metadata...}
        }
        or on error:
        {
            "ok" : false,
            "error" : "some error message"
        }
        
    4. Returns 'result' as a string to the caller if ok==true
       If 'result' is not a string, it is JSON-serialized to a string.
       
    5. Raises MCPClientError if:
        - HTTP status is not 200
        - Response JSON is invalidate
        - ok == false
        - Required fields are missing   
    
    Why:
    - LLM tool handler can call this function to execute a tool and not worry aboiut response formats.format
    - Keeps MCP wire protocol isolated here, making the rest cleaner.
        
    """
    
    base_url = server.endpoint.rstrip("/")
    url = f"{base_url}/call"
    
    payload: Dict[str, Any] = {
        "tool": tool_name,
        "arguments": arguments,
        "config": server.config_json or {},
    }
    
    try:
        resp = requests.post(url,payload,timeout=30)
    except Exception as e:
        raise MCPClientError(f"Failed to call MCp tool '{tool_name}' at {url}: {e}")
    
    if resp.status_code != 200:
        raise MCPClientError(f"MCP server returned {resp.status_code} for {url}: {resp.text}")
    
    try:
        data = resp.json()
    except ValueError as e:
        raise MCPClientError(f"Invalid JSON response from mcp server at {url}: {e}")
    
    # Except a simple envelope: {"ok": bool, "result":....,"error":....?}
    ok = data.get("ok",False)
    if not ok:
        error_msg = data.get("error") or "Unknown MCP tool error" 
        raise MCPClientError(f"MCP tool '{tool_name}' failed: {error_msg}")
    # if ok==true, return the result
    result = data.get("result")
    
    # Normalize results to a string so we can pass it easily to the LLM
    if isinstance(result,str):
        return result
    else: 
        
        try:
            return json.dumps(results, indent = 2, ensure_ascii = False)
        except Exception as e:
            return str(result)