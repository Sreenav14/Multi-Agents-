from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base
from app.db import models
from app.routers import assistants

app = FastAPI(title= "multi-agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(assistants.router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    
@app.get("/health")
def health_check():
    return {"status": "ok"}