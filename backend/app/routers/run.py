from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from typing import Dict, Any, Optional, List
from app.db.session import get_db
from app.db.models import Assistant, Run, Message, Chat
from app.schemas.schemas import RunCreate, RunWithMessages
from app.agents.runtime import run_assistant_graph
from app.schemas import RunRead, MessageRead
from app.services.tool_resolver import resolve_tools_for_assistant


router = APIRouter(prefix="/assistants", tags=["runs"])


@router.post("/{assistant_id}/runs",response_model=RunWithMessages)
def create_run_for_assistant(
    assistant_id: int,
    payload: RunCreate,
    db: Session = Depends(get_db),
):
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    chat_id = payload.chat_id

    if chat_id:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
    else:
        chat = Chat(assistant_id = assistant.id,
                    title = payload.input_text[:50],)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
    previous_messages = []
    
    if chat_id:
        previous_runs = db.query(Run).filter(Run.chat_id == chat_id).all()
        for run in previous_runs:
            run_messages = db.query(Message).filter(Message.run_id == run.id).order_by(Message.created_at).all()
            previous_messages.extend(run_messages)
            
    run = Run(assistant_id = assistant.id,
              chat_id = chat.id,
              status = "running",
              input_text = payload.input_text,
              created_at = datetime.utcnow(),
              completed_at = None,
              error_message = None,
              )
    db.add(run)
    db.commit()
    db.refresh(run)
    
    tools_by_agent = resolve_tools_for_assistant(db=db, assistant=assistant)
    
    try:
        messages = run_assistant_graph(db=db, assistant=assistant, run=run,previous_messages=previous_messages,tools_by_agent=tools_by_agent)
    except Exception as e:
        run.status = "failed"
        error_msg = str(e)
        # Extract more detailed error message for Groq API errors
        if hasattr(e, 'body') and hasattr(e.body, 'get'):
            try:
                error_body = e.body
                if isinstance(error_body, dict) and 'error' in error_body:
                    error_detail = error_body['error']
                    if isinstance(error_detail, dict) and 'message' in error_detail:
                        error_msg = error_detail['message']
            except:
                pass
        elif hasattr(e, 'message'):
            error_msg = str(e.message)
        run.error_message = error_msg
        run.completed_at = datetime.utcnow()
        db.add(run)
        db.commit()
        db.refresh(run)
        raise HTTPException(status_code=500, detail=error_msg)

    # Make sure run is refreshed (status 'completed')
    db.refresh(run)
    message_reads = [MessageRead.model_validate(m) for m in messages]
    
    # Return flat structure matching RunWithMessages schema
    return RunWithMessages(
        id=run.id,
        assistant_id=run.assistant_id,
        chat_id=run.chat_id,
        status=run.status,
        input_text=run.input_text,
        created_at=run.created_at,
        completed_at=run.completed_at,
        error_message=run.error_message,
        messages=message_reads,
    )
            











