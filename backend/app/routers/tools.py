from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app import schemas
from app.db import models
from app.schemas.tools import (
    UserToolConnectionCreate,
    UserToolConnectionRead,
)

router = APIRouter(prefix="/tools", tags=["tools"])

@router.get("/", response_model=list[UserToolConnectionRead])
def list_user_tools(db: Session = Depends(get_db)):
    """
    List all connected tools (UserToolConnection rows)
    for now this is global (no user_id); later you can filter per user.
    """
    tools = db.query(models.UserToolConnection).order_by(models.UserToolConnection.created_at.desc()).all()
    return tools

@router.post("/", response_model=UserToolConnectionRead, status_code=status.HTTP_201_CREATED,)
def create_user_tool(payload: UserToolConnectionCreate, db: Session = Depends(get_db)):
    """
    Create a new user tool connection from the library template 
    example payload:
    {
        "name": "Tavily (prod)",
        "template_key": "tavily",
        "config_json": {
            "api_key": "ssxsx...",
            "search_depth": "advanced"
        }
    }
    """
    # Ensure config_json is not None (database requires NOT NULL)
    config_json = payload.config_json if payload.config_json is not None else {}
    
    try:
        tool = models.UserToolConnection(
            name = payload.name,
            template_key = payload.template_key,
            config_json = config_json,
            status = "connected",
        )
        
        db.add(tool)
        db.commit()
        db.refresh(tool)
        
        return tool
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create tool connection: {str(e)}"
        )
    
    
@router.delete("/{tool_id}", status_code = status.HTTP_204_NO_CONTENT)
def delete_user_tool(tool_id: int, db:Session = Depends(get_db)):
    """
    Delete a user tool connection by ID
    """
    tool = db.query(models.UserToolConnection).get(tool_id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tool connection with ID {tool_id} not found"
        )
    db.delete(tool)
    db.commit()
    db.refresh(tool)
    return tool

@router.delete("/",status_code=status.HTTP_204_NO_CONTENT)
def delete_all_tools(db:Session = Depends(get_db)):
    """ delete all user tool connections"""
    db.query(models.UserToolConnection).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)