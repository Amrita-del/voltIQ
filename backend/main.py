import os
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine
from database.models import Base
from routers import auth, onboarding, bill, chat, report, barcode, carbon, budget, admin
import startup

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup.boot()
    yield

app = FastAPI(title="VoltIQ API", description="Production-grade residential electricity analytics platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
app.include_router(bill.router, prefix="/bill", tags=["Bill Upload"])
app.include_router(report.router, prefix="/report", tags=["Report Generation"])
app.include_router(chat.router, prefix="/chat", tags=["Chat Buddy"])
app.include_router(barcode.router, prefix="/barcode", tags=["Barcode Scanner"])
app.include_router(carbon.router, prefix="/carbon", tags=["Carbon Tracker"])
app.include_router(budget.router, prefix="/budget", tags=["Budget Optimizer"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])

if __name__ == "__main__":
    import uvicorn
    # Starts the FastAPI server automatically when running 'python main.py'
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
