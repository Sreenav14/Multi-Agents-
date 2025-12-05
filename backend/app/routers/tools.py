from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app import schemas
from app.db import models
from app.schemas.tools import (
    UserToolConnectionCreate,
    UserToolConnectionRead,
    GmailConnectResponse,
    GmailConnectRequest,
)
from app.services.google_oauth import generate_google_oauth_url, verify_gmail_credentials, refresh_gmail_tokens

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
    return tool

@router.delete("/",status_code=status.HTTP_204_NO_CONTENT)
def delete_all_tools(db:Session = Depends(get_db)):
    """ delete all user tool connections"""
    db.query(models.UserToolConnection).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/gmail/connect", response_model=GmailConnectResponse)
def connect_gmail_tool(
    payload: GmailConnectRequest,
    db: Session = Depends(get_db)
):
    """
    Start the Gmail OAuth flow by creating a UserToolConnection and returning OAuth URL.
    Uses the backend's configured Google OAuth credentials.
    The Connection will be in pending status until OAuth completes.
    """
    tool = models.UserToolConnection(
        name = payload.name,
        template_key = "gmail",
        config_json = {},
        status = "pending",
    )
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    
    # Generate OAuth URL using backend's configured credentials
    state = f"gmail_tool_{tool.id}"
    auth_url = generate_google_oauth_url(state)
    
    return GmailConnectResponse(
        id = tool.id,
        name = tool.name,
        template_key = tool.template_key,
        config_json = tool.config_json,
        status = tool.status,
        created_at = tool.created_at,
        updated_at = tool.updated_at,
        auth_url = auth_url,
    )


@router.post("/gmail/verify/{tool_id}", response_model=GmailConnectResponse)
def verify_gmail_tool(tool_id: int, db: Session = Depends(get_db)):
    """
    Verify Gmail tool authorization when assigning to an agent.
    If credentials are invalid or expired, return OAuth URL for re-authorization.
    """
    tool = db.query(models.UserToolConnection).filter(
        models.UserToolConnection.id == tool_id,
        models.UserToolConnection.template_key == "gmail"
    ).first()
    
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gmail tool with ID {tool_id} not found"
        )
    
    # Check if tool has credentials
    config = tool.config_json or {}
    gmail_creds = config.get("gmail_credentials")
    
    # If already connected with credentials, trust it (don't re-verify every time)
    if tool.status == "connected" and gmail_creds:
        return GmailConnectResponse(
            id=tool.id,
            name=tool.name,
            template_key=tool.template_key,
            config_json=tool.config_json,
            status=tool.status,
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            auth_url=None,  # Already connected, no auth needed
        )
    
    if not gmail_creds:
        # No credentials, need to authorize
        state = f"gmail_tool_{tool.id}"
        auth_url = generate_google_oauth_url(state)
        return GmailConnectResponse(
            id=tool.id,
            name=tool.name,
            template_key=tool.template_key,
            config_json=tool.config_json,
            status="pending",
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            auth_url=auth_url,
        )
    
    # Has credentials but status isn't "connected" - verify them
    # Get OAuth credentials from tool config for token refresh
    oauth_client_id = config.get("oauth_client_id")
    oauth_client_secret = config.get("oauth_client_secret")
    
    # Try to refresh token if expired
    try:
        refreshed_creds = refresh_gmail_tokens(
            gmail_creds,
            oauth_client_id=oauth_client_id,
            oauth_client_secret=oauth_client_secret
        )
        
        # Verify credentials work
        if verify_gmail_credentials(
            refreshed_creds,
            oauth_client_id=oauth_client_id,
            oauth_client_secret=oauth_client_secret
        ):
            # Credentials are valid, update
            config["gmail_credentials"] = refreshed_creds
            tool.config_json = config
            tool.status = "connected"
            db.commit()
            db.refresh(tool)
            
            return GmailConnectResponse(
                id=tool.id,
                name=tool.name,
                template_key=tool.template_key,
                config_json=tool.config_json,
                status=tool.status,
                created_at=tool.created_at,
                updated_at=tool.updated_at,
                auth_url=None,  # No auth needed, credentials are valid
            )
        else:
            # Credentials invalid, need re-authorization
            tool.status = "pending"
            state = f"gmail_tool_{tool.id}"
            auth_url = generate_google_oauth_url(state)
            db.commit()
            db.refresh(tool)
            
            return GmailConnectResponse(
                id=tool.id,
                name=tool.name,
                template_key=tool.template_key,
                config_json=tool.config_json,
                status="pending",
                created_at=tool.created_at,
                updated_at=tool.updated_at,
                auth_url=auth_url,
            )
    except Exception as e:
        # Error refreshing/verifying, need re-authorization
        tool.status = "pending"
        state = f"gmail_tool_{tool.id}"
        auth_url = generate_google_oauth_url(state)
        db.commit()
        db.refresh(tool)
        
        return GmailConnectResponse(
            id=tool.id,
            name=tool.name,
            template_key=tool.template_key,
            config_json=tool.config_json,
            status="pending",
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            auth_url=auth_url,
        )
    