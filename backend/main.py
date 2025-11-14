from fastapi import FastAPI, Depends, HTTPException,status
from sqlalchemy.orm import Session

from db import Base, engine, get_db
from model.user import User
from model.workflow import Workflow
from schemas.user import UserCreate, UserRead, UserLogin
from security import hash_password,verify_password, create_access_token

Base.metadata.create.all(bind=engine)

app = FastAPI(title = "Agent MVP Backend")

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
        
