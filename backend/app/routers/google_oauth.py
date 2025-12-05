from logging import warning
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.google_oauth import generate_google_oauth_url, exchange_code_for_tokens
from app.core.config import settings
from app.db import models

router = APIRouter(prefix = "/oauth/google",tags=["oauth"])

@router.get("/login")
def google_login():
    """
    Start Google OAuth2 flow by returning a URL for the frontend to redirect the user to.
    In frontend, call this, then window.location.href = url.
    """
    state = "gmail_tool_state"
    url = generate_google_oauth_url(state)
    return {"auth_url":url}

@router.get("/callback")
def google_callback(
    request: Request,
    db:Session = Depends(get_db),
):
    """ 
    The redirect URI that Google calls with ?code=...&state=...
    Exchange the code for tokens and store them in the DB.
    """
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    state = request.query_params.get("state", "")
    
    
    if error:
        frontend_url = f"{settings.Frontend_URL}/studio?error={error}"
        return RedirectResponse(url=frontend_url)
    if not code:
        frontend_url = f"{settings.Frontend_URL}/studio?error=missing_code"
        return RedirectResponse(url=frontend_url)
    
    try:
            # Parse state to get tool ID if it's in the format "gmail_tool_{id}"
            tool_id = None
            if state.startswith("gmail_tool_"):
                try:
                    tool_id = int(state.replace("gmail_tool_", ""))
                except ValueError:
                    pass
            
            # Exchange code for tokens using backend's configured credentials
            token_data = exchange_code_for_tokens(code)
            
            # If we have a tool ID, update the UserToolConnection
            if tool_id:
                tool = db.query(models.UserToolConnection).filter(
                    models.UserToolConnection.id == tool_id
                ).first()
                
                if tool:
                    # Store tokens in config
                    tool.config_json = {
                        "gmail_credentials": token_data,
                    }
                    
                    # Verify by fetching a test email
                    try:
                        from app.services.google_oauth import build_gmail_client_from_tokens
                        gmail = build_gmail_client_from_tokens(token_data)
                        # Fetch profile to verify connection works
                        profile = gmail.users().getProfile(userId="me").execute()
                        # Try to fetch one recent email to verify email access
                        messages = gmail.users().messages().list(
                            userId="me", 
                            labelIds=["INBOX"], 
                            maxResults=1
                        ).execute()
                        
                        tool.status = "connected"
                        db.commit()
                        
                        # redirect to frontend with success
                        frontend_url = f"{settings.Frontend_URL}/studio?success=gmail_connected"
                        return RedirectResponse(url=frontend_url)
                    except Exception as e:
                        # OAuth succeeded but email fetch failed
                        print(f"[WARNING] OAuth succeeded but email fetch failed: {e}")
                        tool.status = "connected"  # Still mark as connected, OAuth worked
                        db.commit()
                        frontend_url = f"{settings.Frontend_URL}/studio?success=gmail_connected&warning=email_verification_failed"
                        return RedirectResponse(url=frontend_url)
                
            # if no tool ID or tool not found, still redirect but with warning
            frontend_url = f"{settings.Frontend_URL}/studio?warning=no_tool_found"
            return RedirectResponse(url=frontend_url)
    except Exception as e:
        # Log error and redirect with error message
        frontend_url = f"{settings.Frontend_URL}/studio?error={str(e)}"
        return RedirectResponse(url=frontend_url)
    
    return JSONResponse({"tokens": token_data})
    