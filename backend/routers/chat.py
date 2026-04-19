from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
import os

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    report_data: dict = None

@router.post("/")
def chat_with_volt(req: ChatRequest):
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_key_here":
         return {"reply": "Please add your Gemini API key to the .env file to activate Volt."}
    
    try:
        client = genai.Client(api_key=key)
        
        context_str = f"Personalized User Energy Data Context: {req.report_data}" if req.report_data else "No specific user report context provided."
        
        prompt = f"""
        You are VoltIQ, an elite AI data-analyst.
        {context_str}
        
        The user asks: "{req.message}"
        
        Your objective: 
        Provide a hyper-focused, punchy, and highly analytical response. Do NOT use typical boilerplate greetings or filler like "I can help you with that", "I understand", or "Here are some universal strategies". Speak directly, practically, and boldly.
        Keep the response strictly straight to the point (maximum 3 concise bullet points or 2 short paragraphs).
        
        WIDGET COMMANDS:
        If you ever refer to their estimated budget savings, YOU MUST write the exact text `[WIDGET:SAVINGS]` on its own new line.
        If you ever refer to their total cyclic units consumed, YOU MUST write the exact text `[WIDGET:USAGE]` on its own new line.
        
        Use Markdown formatting (like bullet points and **bold text**) to make it highly readable.
        Refine recommendations absolutely exclusively over the user's specific JSON report items, especially `vampire_load`, `device_breakdown`, and `budget_analysis`.
        """
        
        res = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return {"reply": res.text}
    except Exception as e:
        return {"reply": "Sorry, I am facing connectivity issues right now. Try again later."}
