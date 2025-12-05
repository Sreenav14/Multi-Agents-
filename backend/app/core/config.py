import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(os.path.dirname(BASE_DIR),".env")
load_dotenv(ENV_PATH, encoding='utf-8')

class settings:
    """
    central configuration object for the application.
    - database url
    - frontend url
    - groq api key
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:sreenav@localhost:5432/agent")

    Frontend_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    Groq_API_KEY: str | None = os.getenv("GROQ_API_KEY", None)
    LLM_Model: str = "llama-3.1-8b-instant"  # Updated from deprecated llama-3.1-70b-versatile (can also use: mixtral-8x7b-32768, gemma-7b-it)
    
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI")
    google_oauth_scopes: list[str] = [
        "https://www.googleapis.com/auth/gmail.readonly",  # Read emails
        "https://www.googleapis.com/auth/gmail.compose",   # Create drafts
    ]
    
    
    class config:
        env_file = ".env"
    
settings = settings()



