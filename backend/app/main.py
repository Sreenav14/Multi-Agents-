from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base
from app.db import models
from app.routers import assistants, run, chats, tools, mcp_servers
from app.routers import google_oauth

<<<<<<< HEAD

=======
>>>>>>> origin/main
app = FastAPI(title= "multi-agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(assistants.router)
app.include_router(run.router)
app.include_router(chats.router)
app.include_router(tools.router)
app.include_router(mcp_servers.router)
app.include_router(google_oauth.router)


<<<<<<< HEAD

=======
>>>>>>> origin/main
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    
@app.get("/health")
def health_check():
    return {"status": "ok"}