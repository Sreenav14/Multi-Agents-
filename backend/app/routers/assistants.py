from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Assistant
from app.schemas import AssistantCreate, AssistantRead
from app.db.session import get_db


router = APIRouter(
    prefix="/assistants",
    tags = ["assistants"],
)

def build_default_graph_json()->dict:
    """
    Build the default agent graph for a new assistant
    
    for MVP:
    - planner -> researcher -> writer
    - each node  has a simple system_prompt
    This is stored in Assistant.garph_json
    """
    return {
        "nodes":[
            {
                "id" : "planner",
                "type" : "agent",
                "role" :"Planner",
                "system_prompt":(
                    "You are a planning agent. "
                    "Given the user's request, break it into clear steps and a plan "
                    "that other agents can follow."
                ),
            },
            {
                "id" : "researcher",
                "type" : "agent",
                "role": "Researcher",
                "system_prompt":(
                    "You are a research agent. Using the plan and context so far, "
                    "generate relevant information, options, and details. "
                    "Do not repeat the plan; add substance."
                ),
            },
            {
                "id" : "writer",
                "type" : "agent",
                "role" : "Writer",
                "system_prompt":(
                    "You are a writing agent. "
                    "Using the plan and research, "
                    "write a clear, concise final answer for the user."
                ),
            },
        ],
        "edges":[
            {"from":"planner", "to":"researcher"},
            {"from":"researcher", "to":"writer"},
        ],
    }
    
@router.get("/",response_model=List[AssistantRead])
def list_assistants(db:Session = Depends(get_db))->List[AssistantRead]:
    """
    GET /assistants

    Returns all assistants. This is what your Studio dashboard will call
    to show the list of assistants.
    """
    assistants = db.query(Assistant).order_by(Assistant.created_at.desc()).all()
    return assistants

@router.post("/", response_model=AssistantRead,status_code=status.HTTP_201_CREATED)
def create_assistant(
    assistant_in : AssistantCreate,
    db : Session = Depends(get_db),
)-> AssistantRead:
    """
    Post  / assistants
    creates a new assistant with the given name, description, and spec.
    a default graph_json is generated and stored in the database.
    
    the frontend does not send graph_json, so we generate it here.
    """
    assistant = Assistant(
        name = assistant_in.name,
        description = assistant_in.description,
        spec = assistant_in.spec,
        graph_json = build_default_graph_json(),
    )
    db.add(assistant)
    db.commit()
    db.refresh(assistant)
    return assistant

@router.get("/{assistant_id}", response_model=AssistantRead)
def get_assistant(
    assistant_id : int,
    db : Session = Depends(get_db), 
)-> AssistantRead:
    """
    GET /assistants/{assistant_id}
    Returns the assistant with the given id.
    """
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return assistant
    
