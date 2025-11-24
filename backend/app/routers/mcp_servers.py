from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
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
    