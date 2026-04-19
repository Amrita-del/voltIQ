from fastapi import APIRouter, UploadFile, File
import os
import shutil
import json
import re
from google import genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/scan")
async def scan_barcode(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    prompt = """
    Analyze this BEE Star Rating label and extract energy data for VoltIQ.
    Extract the information into this exact JSON schema:
    - 'device_type': Clear name of the appliance (e.g., '1.5 Ton Split AC')
    - 'star_rating': The numerical stars highlighted (1-5)
    - 'annual_kwh': The 'Units Consumed per Year' value as a number.
    - 'annual_cost_rs': Calculate (annual_kwh * 7.5). assume approx 7.5 INR per unit.
    - 'carbon_kg': Calculate (annual_kwh * 0.85). assume approx 0.85kg CO2 per kWh.
    - 'ai_insight': A 2-sentence diagnostic. First sentence: Compare this star-rating to modern standards. Second sentence: Give a specific pro/con based on the annual units.
    Return ONLY valid JSON.
    """
    
    try:
        img = Image.open(file_path)
        response = client.models.generate_content(model='gemini-2.5-flash', contents=[prompt, img])
        res_text = response.text
        
        # Robust JSON extraction
        clean_json = res_text.strip()
        if "```json" in clean_json:
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_json:
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
        # Final cleanup for any leftover characters outside {}
        match = re.search(r'\{.*\}', clean_json, re.DOTALL)
        if match:
            clean_json = match.group(0)
            
        data = json.loads(clean_json)
        return data
    except Exception as e:
        print(f"--- VOLTIQ SCAN ERROR ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        if 'res_text' in locals():
            print(f"Raw AI Response: {res_text or 'No response'}")
        print(f"--------------------------")
        
        return {
            "device_type": "Analysis Failed", "star_rating": 3,
            "annual_kwh": "---", "annual_cost_rs": "---", "carbon_kg": "---",
            "ai_insight": f"Analysis encountered a processing error ({type(e).__name__}). Please ensure the photo is centered and clear."
        }
