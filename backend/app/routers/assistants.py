from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Assistant, Run, Message, Chat
from app.schemas import AssistantCreate, AssistantRead, AssistantGraphUpdate
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
                    "You are a research agent. Your job is to gather and provide detailed information based on the plan from the planner. "
                    "IMPORTANT: You MUST provide substantial research content. Do not leave your response empty. "
                    "Your research should include: "
                    "- Relevant facts and data "
                    "- Current trends or patterns "
                    "- Specific examples and details "
                    "- Supporting information that adds value beyond the plan. "
                    "Make your research comprehensive and useful for the writer to create a final answer."
                ),
            },
            {
                "id" : "writer",
                "type" : "agent",
                "role" : "Writer",
                "system_prompt":(
                    "You are a writing agent. Your job is to synthesize the plan from the planner and research from the researcher into a clear, well-formatted final answer for the user. "
                    "IMPORTANT: You MUST provide a complete, formatted response. Do not leave it empty or incomplete. "
                    "Format your response with: "
                    "- Clear paragraphs for different sections "
                    "- Bullet points for lists "
                    "- Headers or bold text for important sections "
                    "- Professional, readable structure. "
                    "Make sure your response is comprehensive and addresses the user's original question."
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

@router.delete("/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assistant(
    assistant_id: int,
    db: Session = Depends(get_db),
):
    """
    DELETE /assistants/{assistant_id}
    Deletes the assistant with the given id.
    Cascade delete handles all related runs, chats, and messages automatically.
    """
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    # Cascade delete handles runs, chats, and messages automatically
    db.delete(assistant)
    db.commit()
    
    return None
    
@router.put("/{assistant_id}/graph", response_model=AssistantRead)
def update_assistant_graph(
    assistant_id:int,
    payload : AssistantGraphUpdate,
    db: Session = Depends(get_db),):
    """
    update only the assistant graph json
    frontend will send the entire graph structure indicating any tool_ids set on each agent node
    
    example payload:
    {
        "graph_json":{
            "nodes":[
                {
                    "id":"planner",
                    "role":"planner",
                    "system_prompt":"your workflow plan",
                    "tool_ids":[1,2,3]
                }
            ],
            "edges":[...]
        }
    }
    """
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    assistant.graph_json = payload.graph_json
    assistant.updated_at = datetime.now()
    
    db.add(assistant)
    db.commit()
    db.refresh(assistant)
    return assistant
    