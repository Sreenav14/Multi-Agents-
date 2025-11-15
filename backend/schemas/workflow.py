from pydantic import BaseModel
from datetime import datetime


class WorkflowCreate(BaseModel):
    title:str
    data :dict
    
class WorkflowRead(BaseModel):
    id:int
    title: str
    data : dict
    created_at : datetime
    
    class config:
        orm_mode = True