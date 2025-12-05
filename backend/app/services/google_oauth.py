import os
import urllib.parse
from typing import Dict, Any

from fastapi import HTTPException
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from app.core.config import settings

def get_google_oauth_flow() -> Flow:
    """
    Create an OAuth2 Flow object 
    """
    # You can load from a client_secret_file.json, but we are using env vars.
    
    return Flow.from_client_config({
        "web":{
            "client_id": settings.google_client_id,
            "project_id": "multi-agents",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": settings.google_client_secret,
            "redirect_uris": [settings.google_redirect_uri],
            
        }
    },
    scopes = settings.google_oauth_scopes,
    )
    
def generate_google_oauth_url(state: str) -> str:
    """ 
    Build the URL where the user should be redirected to login with Google
    Uses default credentials from environment variables.
    `state` can be anything you want to keep track of (user id, CSRF token, etc )
    """
    
    flow = get_google_oauth_flow()
    flow.redirect_uri = settings.google_redirect_uri
    
    auth_url, _ = flow.authorization_url(
        access_type = "offline",
        include_granted_scopes = "true",
        prompt = "consent",
        state = state,
    )
    return auth_url


def generate_google_oauth_url_with_credentials(
    state: str, 
    client_id: str, 
    client_secret: str
) -> str:
    """
    Build the URL where the user should be redirected to login with Google
    Uses custom client_id and client_secret provided by the user.
    """
    flow = Flow.from_client_config({
        "web": {
            "client_id": client_id,
            "project_id": "multi-agents",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": [settings.google_redirect_uri],
        }
    }, scopes=settings.google_oauth_scopes)
    
    flow.redirect_uri = settings.google_redirect_uri
    
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return auth_url


def exchange_code_for_tokens(
    code: str, 
    client_id: str = None, 
    client_secret: str = None
) -> Dict[str, Any]:
    """ 
    Exchange the authorization code from Google for access & refresh tokens.
    Uses custom credentials if provided, otherwise uses env vars.
    """
    if client_id and client_secret:
        # Use custom credentials
        flow = Flow.from_client_config({
            "web": {
                "client_id": client_id,
                "project_id": "multi-agents",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": client_secret,
                "redirect_uris": [settings.google_redirect_uri],
            }
        }, scopes=settings.google_oauth_scopes)
    else:
        # Use default credentials from env
        flow = get_google_oauth_flow()
    
    flow.redirect_uri = settings.google_redirect_uri
    
    try:
        flow.fetch_token(code=code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch token: {e}")
    
    credentials: Credentials = flow.credentials
    
    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes) if credentials.scopes else [],
        "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
    }
    
def refresh_gmail_tokens(
    token_data: Dict[str, Any],
    oauth_client_id: str = None,
    oauth_client_secret: str = None
) -> Dict[str, Any]:
    """
    Refresh expired Gmail access token using refresh token.
    Returns updated token data with new access_token.
    Uses custom OAuth credentials if provided, otherwise from token_data or env.
    """
    from datetime import datetime
    
    # Use provided OAuth credentials, or from token_data, or from env
    client_id = oauth_client_id or token_data.get("client_id") or settings.google_client_id
    client_secret = oauth_client_secret or token_data.get("client_secret") or settings.google_client_secret
    
    creds = Credentials(
        token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=client_id,
        client_secret=client_secret,
        scopes=token_data.get("scopes", list(settings.google_oauth_scopes)),
    )
    
    # Refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(None)
        
        # Return updated token data
        return {
            "access_token": creds.token,
            "refresh_token": creds.refresh_token or token_data.get("refresh_token"),
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes) if creds.scopes else [],
            "expiry": creds.expiry.isoformat() if creds.expiry else None,
        }
    
    return token_data


def verify_gmail_credentials(
    token_data: Dict[str, Any],
    oauth_client_id: str = None,
    oauth_client_secret: str = None
) -> bool:
    """
    Verify if Gmail credentials are valid by attempting to make a test API call.
    Returns True if credentials are valid, False otherwise.
    Uses custom OAuth credentials if provided, otherwise from token_data or env.
    """
    try:
        gmail = build_gmail_client_from_tokens(
            token_data,
            oauth_client_id=oauth_client_id,
            oauth_client_secret=oauth_client_secret
        )
        # Make a simple API call to verify credentials
        gmail.users().getProfile(userId="me").execute()
        return True
    except Exception as e:
        print(f"[DEBUG] Gmail credentials verification failed: {e}")
        return False


def build_gmail_client_from_tokens(
    token_data: Dict[str, Any],
    oauth_client_id: str = None,
    oauth_client_secret: str = None
):
    """ 
    Given stored token data from DB, return a Gmail API client.
    Automatically refreshes token if expired.
    Uses custom OAuth credentials if provided, otherwise from token_data or env.
    """
    from datetime import datetime, timezone
    
    # Use provided OAuth credentials, or from token_data, or from env
    client_id = oauth_client_id or token_data.get("client_id") or settings.google_client_id
    client_secret = oauth_client_secret or token_data.get("client_secret") or settings.google_client_secret
    
    # Check if token is expired
    expiry_str = token_data.get("expiry")
    if expiry_str:
        try:
            # Parse expiry date
            if expiry_str.endswith('Z'):
                expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
            else:
                expiry = datetime.fromisoformat(expiry_str)
            
            # Get current time in same timezone
            now = datetime.now(expiry.tzinfo if expiry.tzinfo else timezone.utc)
            if now >= expiry:
                # Token expired, try to refresh
                token_data = refresh_gmail_tokens(
                    token_data,
                    oauth_client_id=client_id,
                    oauth_client_secret=client_secret
                )
        except Exception as e:
            print(f"[WARNING] Could not parse expiry date: {e}")
    
    creds = Credentials(
        token = token_data["access_token"],
        refresh_token = token_data.get("refresh_token"),
        token_uri = token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id = client_id,
        client_secret = client_secret,
        scopes = token_data.get("scopes", list(settings.google_oauth_scopes)),
    )
    
    from googleapiclient.discovery import build 
    
    gmail = build("gmail", "v1", credentials = creds)
    return gmail
    