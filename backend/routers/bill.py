from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Bill, Report
from ai.analyzer import analyze_bill_with_gemini
import shutil
import os
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

@router.post("/parse")
async def parse_bill(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    data = analyze_bill_with_gemini(file_path)
    return {"data": data, "file_path": file_path}

class SaveBillReq(BaseModel):
    user_id: int
    file_path: str
    data: Dict[str, Any]

@router.post("/save")
async def save_bill(req: SaveBillReq, db: Session = Depends(get_db)):
    data = req.data
    
    units = float(data.get("units_kwh", 0))
    amount = float(data.get("amount_rs", 0))
    
    # Removed fallback loop so actual AI results populate the dashboard.

    
    bill = Bill(user_id=req.user_id, month=data.get("month", "April"), year=data.get("year", 2026), 
                units_kwh=data.get("units_kwh", 0), amount_rs=data.get("amount_rs", 0), 
                file_path=req.file_path, parse_method="gemini")
    db.add(bill)
    db.commit()
    db.refresh(bill)
    
    report = Report(user_id=req.user_id, bill_id=bill.id,
                    device_breakdown=data.get("device_breakdown", []),
                    slab_alert=data.get("slab_alert", {}),
                    vampire_load=data.get("vampire_load", {}),
                    carbon=data.get("carbon", {}),
                    budget_analysis=data.get("budget_analysis", {}),
                    device_health=data.get("device_health", {}),
                    ai_narrative=data.get("ai_narrative", ""))
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return {"message": "Success", "report_id": report.id, "bill_id": bill.id}
