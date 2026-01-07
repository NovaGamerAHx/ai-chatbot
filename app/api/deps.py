from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db import repository

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    
    token = authorization.replace("Bearer ", "").strip()
    if token.startswith('"') and token.endswith('"'):
        token = token[1:-1]
    
    if not token.startswith("dummy_token_"):
        raise HTTPException(status_code=401, detail="Invalid token format")
        
    try:
        user_id = int(token.split("_")[-1])
        user = db.query(repository.User).filter(repository.User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
        
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")
