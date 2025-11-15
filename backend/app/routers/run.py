from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import RunCreate, RunWithMessages
from app.db.models import Assistant, Run, Message
from app.agents.runtime import run_assistant_graph

router = APIRouter(
    tags = ["runs"],
)

@router.post("/assistants/{assistant_id}/runs",
             response_model=RunWithMessages,
             status_code=status.HTTP_201_CREATED,
)
def create_run_for_assistant(
    assistant_id:int,
    run_in:RunCreate,
    db:Session = Depends(get_db),
)-> RunWithMessages:
    """
    POST /assistants/{assistant_id}/runs
    
    MVP behavior:
    - Find the assistant ( 404 if not found)
    - create a new row status="running".
    - call the multi-agent runtime(planne -> researcher -> writer)
    - on sucess:
        * save all the messages 
        * mark run a completed 
        * return run + messages
    - in failure:
        * mark run as failed with an error message
        * return 500
    
    """
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Assistant not found",
        )
        
    run = Run(
        assistant_id = assistant_id,
        status = "running",
        input_text = run_in.input_text,
    )
    db.add(Run)
    db.commit()
    db.refresh(run)
    
    try:
        run_assistant_graph(db=db, assistant=assistant, run=run)
        run.status = "completed"
        db.add(run)
        db.commit()
        db.refresh(run)
        
    except Exception as e:
        db.rollback()
        run.status = "failed"
        run.error_message = str(e)
        db.add(run)
        db.commit()
        db.refresh(run)
        
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Runn failed: {e}"
        )
        
    messages = (
        db.query(Message).filter(Message.run_id == run.id).order_by(Message.created_at.asc()).all()
    )
    run.messages = messages
    return run

@router.get("/runs/{run_id}",response_model=RunWithMessages)
def get_run(
    run_id:int,
    db:Session =Depends(get_db),
)->RunWithMessages:
    """ 
    GET /runs/{run_id}
    Returns the run with message.
    userful for 
    - history pages
    - debugging
    """
    
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Run not found"
        )
        
    messages =(
        db.query(Message).filter(Message.run_id==run.id()).order_by(Message.created_asc()).all()
    )
    run.messages = messages
    return run
