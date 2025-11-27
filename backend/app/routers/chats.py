from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.db.models import Chat, Run, Message

router = APIRouter(prefix="/assistants", tags=["chats"])

@router.get("/{assistant_id}/chats")
def list_chats(
    assistant_id: int,
    db: Session = Depends(get_db),
):
    chats = db.query(Chat).filter(Chat.assistant_id == assistant_id).all()
    return chats

@router.get("/{assistant_id}/chats/{chat_id}")
def get_chat(assistant_id: int, chat_id: int, db: Session = Depends(get_db)):
    """Get chat with all runs and messages using eager loading (single query)."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id, 
        Chat.assistant_id == assistant_id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Use eager loading to fetch runs with messages in fewer queries
    runs = db.query(Run).options(
        joinedload(Run.messages)
    ).filter(Run.chat_id == chat_id).order_by(Run.created_at).all()
    
    # Flatten messages from all runs, sorted by creation time
    all_messages = []
    for run in runs:
        all_messages.extend(sorted(run.messages, key=lambda m: m.created_at))
        
    return {
        "chat": chat,
        "runs": runs,
        "messages": all_messages,
    }
    
@router.delete("/{assistant_id}/chats/{chat_id}", status_code=204)
def delete_chat(
    assistant_id: int,
    chat_id: int,
    db: Session = Depends(get_db),
):
    """ 
    Delete a chat and all its related runs and messages.
    Cascade delete handles runs and messages automatically.
    """
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.assistant_id == assistant_id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Cascade delete handles runs and messages automatically
    db.delete(chat)
    db.commit()
    
    return None