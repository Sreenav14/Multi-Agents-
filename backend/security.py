import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_me_please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24

pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")

def hash_password(password:str)->str:
    return pwd_context.hash(password)

def verify_password(password:str, password_hash: str) -> bool:
    return pwd_context.verify(password,password_hash)

def create_access_token(user_id:int, expires_delta:Optional[timedelta] = None)->str:
    if expires_delta is None:
        expires_delta = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
        
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub":str(user_id),"exp": expire}
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decoded_access_token(token:str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except jwt.PyJWTError:
        return None
        
