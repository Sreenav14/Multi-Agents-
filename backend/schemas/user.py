from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email : EmailStr
    password : str
    name : str
    
    
class UserLogin(BaseModel):
    email:str
    password:str
    
class UserRead(BaseModel):
    id: int
    email : EmailStr
    name : str
    created_at: datetime
    
    
    class config:
        orm_mode = True