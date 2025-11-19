from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Assistant, Chat, Run, Message

router = APIRouter(prefix="/assistants", tags=["chats"])

@router.get("/{assistant_id}/chats")
def list_chats(
    assistant_id: int,
    db: Session = Depends(get_db),
):
    chats = db.query(Chat).filter(Chat.assistant_id == assistant_id).all()
    return chats

@router.get("/{assistant_id}/chats/{chat_id}")
def get_chat(assistant_id: int, chat_id: int, db: Session = Depends(get_db),):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.assistant_id == assistant_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    runs = db.query(Run).filter(Run.chat_id == chat_id).all()
    
    all_messages = []
    for run in runs:
        messages = db.query(Message).filter(Message.run_id == run.id).order_by(Message.created_at).all()
        all_messages.extend(messages)
        
    return {
        "chat": chat,
        "runs": runs,
        "messages": all_messages,
    }