from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from typing import Dict, Any
from app.db.session import get_db
from app.db.models import Assistant, Run, Message
from app.schemas import RunCreate
from app.agents.runtime import run_assistant_graph

router = APIRouter(prefix="/assistants", tags=["runs"])


@router.post("/{assistant_id}/runs")
def create_run_for_assistant(
    assistant_id: int,
    payload: RunCreate,
    db: Session = Depends(get_db),
):
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    run = Run(
        assistant_id=assistant.id,
        status="running",
        input_text=payload.input_text,
        created_at=datetime.utcnow(),
        completed_at=None,
        error_message=None,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        messages = run_assistant_graph(db=db, assistant=assistant, run=run)
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

    # Return run and messages to match frontend expectation
    from app.schemas import RunRead, MessageRead
    run_read = RunRead.model_validate(run)
    message_reads = [MessageRead.model_validate(m) for m in messages]
    
    return {
        "run": run_read.model_dump(),
        "messages": [m.model_dump() for m in message_reads],
    }
