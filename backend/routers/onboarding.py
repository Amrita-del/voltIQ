from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, UserProfile
import jwt
import os
from typing import Dict, Any

router = APIRouter()
SECRET = os.getenv("JWT_SECRET", "secret")

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization: raise HTTPException(401, "No auth header")
    try:
        parts = authorization.split()
        token = parts[1] if len(parts) > 1 else parts[0]
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception as e:
        raise HTTPException(401, str(e))

class ProfileReq(BaseModel):
    city: str
    home_type: str
    household_size: int
    budget_rs: float
    utility: str
    appliances: Dict[str, Any]

@router.post("/complete")
def complete_onb(req: ProfileReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user: raise HTTPException(401, "Not found")
    
    prof = user.profile
    if not prof:
        prof = UserProfile(user_id=user.id)
        db.add(prof)
    
    prof.city = req.city
    prof.home_type = req.home_type
    prof.household_size = req.household_size
    prof.budget_rs = req.budget_rs
    prof.utility = req.utility
    prof.appliances = req.appliances
    
    db.commit()
    return {"status": "ok"}
