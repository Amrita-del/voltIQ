from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from database.db import get_db
from database.models import User
from sqlalchemy.orm import Session
import os

router = APIRouter()
SECRET = os.getenv("JWT_SECRET", "secret")

class SignupReq(BaseModel):
    name: str
    email: str
    password: str

class SigninReq(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: SignupReq, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email registered")
    
    hashed = generate_password_hash(req.password, method='pbkdf2:sha256')
    u = User(name=req.name, email=req.email, password_hash=hashed)
    db.add(u)
    db.commit()
    db.refresh(u)
    token = jwt.encode({"sub": str(u.id), "exp": datetime.utcnow() + timedelta(days=7)}, SECRET, algorithm="HS256")
    return {"token": token, "has_profile": False, "name": u.name, "email": u.email, "id": u.id}

@router.post("/signin")
def signin(req: SigninReq, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == req.email).first()
    if not u or not check_password_hash(u.password_hash, req.password):
        raise HTTPException(401, "Invalid credentials")
    
    token = jwt.encode({"sub": str(u.id), "exp": datetime.utcnow() + timedelta(days=7)}, SECRET, algorithm="HS256")
    
    profile_data = {}
    if u.profile:
        profile_data = {
            "city": u.profile.city,
            "home_type": u.profile.home_type,
            "household_size": u.profile.household_size,
            "budget_rs": u.profile.budget_rs,
            "utility": u.profile.utility,
            "appliances": u.profile.appliances
        }

    return {
        "token": token, 
        "has_profile": u.profile is not None, 
        "name": u.name, 
        "email": u.email, 
        "id": u.id,
        "profile": profile_data
    }
