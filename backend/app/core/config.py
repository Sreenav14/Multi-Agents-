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
    
settings = settings()



