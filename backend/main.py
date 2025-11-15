from fastapi import FastAPI, Depends, HTTPException,status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from schemas.workflow import WorkflowCreate, WorkflowRead
from typing import List



from db import Base, engine, get_db
from model.user import User
from model.workflow import Workflow
from schemas.user import UserCreate, UserRead, UserLogin
from security import hash_password,verify_password, create_access_token, decoded_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Agent MVP Backend")

def get_current_user(
    db: Session = Depends(get_db),
    token: str =Depends(oauth2_schema),
) -> User :
    """ 
    1. Take the bearer token from the authorization header.
    2. decode it to getuser_id.
    3. Load that user from the database.
    4. If anything fails, raise 401.

    """
    user_id = decoded_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            details="Invalid or expired token",
        )
    user = db.query(User).filter(user.id == user_id ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user not found",
        )


@app.get("/")
def read_root():
    return {"message":"Backend is running"}

@app.post("/auth/register", response_model=UserRead)
def register_user(user_in:UserCreate, db:Session = Depends(get_db)):
    existing = db.query(User).filter(User.email ==user_in.email).first()
    if existing :
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            details = "Email ALready registered"
        )
        
    user = User(
        email = user_in.email,
        name = user_in.name,
        password_hash = hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
@app.post("/auth/login")
def login(user_in: UserLogin, db: Session= Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid email or password"
        )
    access_token = create_access_token(user,id)
    return {
        "access_token":access_token,
        "token_type":"bearer",  
    }
        
@app.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    """ 
    this is protected :
    it requires a valid authorization : bearer <token>
    fastapi call get_current  injected.
    if ok, you get current_user injected
    """
    return current_user

@app.post("/workflow",response_model=WorkflowRead)
def create_workflow(
    workflow_in : WorkflowCreate,
    db : Session = Depends(get_db),
    current_user : User = Depends(get_current_user),
):
    """ 
    Create a new workflow for the logged-in user
    require valid jwt
    uses current_user.id as user_id foreign key
    """
    workflow = Workflow(
        user_id = current_user.id,
        title = workflow_in.title,
        json = workflow_in.data,
    )
    
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    return workflow

@app.get("/workflow", response_model = List(WorkflowRead))
def list_workflows(
    db:Session = Depends(get_db),
    current_user:User = Depends(get_current_user),
):
    """"
    List all workflows that belongs to the logged-in user.
    """
    workflows = db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
    return workflows