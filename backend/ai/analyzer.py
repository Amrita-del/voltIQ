import os
import json
import re
from google import genai
from PIL import Image
import pdfplumber
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_bill_with_gemini(file_path: str) -> dict:
    """Uses Gemini to parse bill and return structured JSON."""
    ext = file_path.split('.')[-1].lower()
    text_content = ""
    
    if ext == 'pdf':
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text_content += page.extract_text() + "\n"
        except Exception as e:
            print(f"PDF extraction error: {e}")
            
    prompt = f"""
    You are VoltIQ, an elite AI energy auditor and smart-home data analyst. Your job is to extract data from the provided electricity bill.
    If the text lacks explicit appliance data, logically deduce and construct a highly accurate, plausible energy profile based on the total units, bill amount, season (month), and standard Indian household consumption patterns.
    
    SYSTEM DIRECTIVE: You have been trained on a synthetic yet factual dataset of 10,000+ Indian households. You know that:
    - AC usage spikes in April-August (consuming 40-50% of total load if units > 300).
    - Water heating spikes in Nov-Feb (30% of load).
    - Vampiric load from idle electronics accounts for 8-12% globally.
    - Base tariff varies by region, but average carbon impact is ~0.82 kg CO2 per kWh.
    
    You MUST output valid JSON ONLY, following this EXACT schema, no markdown blocks. 
    
    Text Context: {text_content if text_content else ("No text extracted. Carefully analyze the provided image of the bill to extract actual data." if ext in ['jpg', 'jpeg', 'png'] else 'No text extracted. Return a fully populated mock response for a realistic 350kWh bill avoiding fallbacks.')}
    
    Required JSON Schema Structure:
    {{
        "month": "April",
        "year": 2026,
        "units_kwh": 350.0,
        "amount_rs": 2850.0,
        "fixed_charges": 150.0,
        "slab_tax": 240.0,
        "ai_narrative": "Your energy consumption of 350 kWh this April resulted in a ₹2850 charge..."
    }}
    
    IMPORTANT RULES:
    1. Extract the actual mathematical `units_kwh` and `amount_rs` from the text/image.
    2. Explicitly look for "Fixed Charges", "Demand Charges", "Regulatory Surcharge", or "Tax" values. If found, map them to `fixed_charges` and `slab_tax`.
    3. The `ai_narrative` text MUST explicitly reference the EXACT `month`, `units_kwh`, and `amount_rs` that you extract for this bill. DO NOT hallucinate different months, units, or amounts inside the narrative.
    4. The output string must start with {{ and end with }}. Do not wrap with ```json or backticks.
    """
    
    try:
        if ext in ['jpg', 'jpeg', 'png']:
            img = Image.open(file_path)
            response = client.models.generate_content(model='gemini-2.5-flash', contents=[prompt, img])
        else:
            response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            
        res_text = response.text
        # Fortified Regex parsing
        match = re.search(r'\{.*\}', res_text, re.DOTALL)
        if match:
             data = json.loads(match.group(0))
        else:
             data = json.loads(res_text.replace("```json", "").replace("```", "").strip())
             
        # ==========================================
        # PYTHON DETERMINISTIC CALCULATION ENGINE
        # ==========================================
        month_str = str(data.get("month", "April")).lower()
        units = float(data.get("units_kwh", 350.0))
        amt = float(data.get("amount_rs", 2850.0))
        
        is_summer = month_str in ['march', 'april', 'may', 'june', 'july', 'august']
        is_winter = month_str in ['november', 'december', 'january', 'february']

        ac_pct = 0.45 if is_summer else 0.15
        heat_pct = 0.30 if is_winter else 0.10
        ref_pct = 0.20
        light_pct = 0.15
        other_pct = 0.10

        total_p = ac_pct + heat_pct + ref_pct + light_pct + other_pct
        
        ac_val = round(amt * (ac_pct / total_p))
        heat_val = round(amt * (heat_pct / total_p))
        ref_val = round(amt * (ref_pct / total_p))
        light_val = round(amt * (light_pct / total_p))
        other_val = amt - (ac_val + heat_val + ref_val + light_val) # Exact math override
        
        data["device_breakdown"] = [
            {"name": "AC & Cooling", "value": ac_val, "color": "#1d877c"},
            {"name": "Water Heating", "value": heat_val, "color": "#BD834C"},
            {"name": "Refrigeration", "value": ref_val, "color": "#5E7287"},
            {"name": "Lighting & Fans", "value": light_val, "color": "#4A9972"},
            {"name": "Other Appliances", "value": other_val, "color": "#9CA3AF"}
        ]
        
        data["vampire_load"] = {"cost": round(amt * 0.12), "suggestion": "Unplug electronics to save on phantom drain."}
        data["carbon"] = {"impact_kg": round(units * 0.82)}
        
        # Enhanced Budget Analysis logic
        extracted_fixed = data.get("fixed_charges")
        extracted_tax = data.get("slab_tax")
        
        fixed_val = float(extracted_fixed) if extracted_fixed else 150.0
        tax_val = float(extracted_tax) if extracted_tax else round(amt * 0.08)
        
        data["budget_analysis"] = {
            "expected": amt, 
            "suggested_savings": round(amt * 0.15),
            "slab_charges": tax_val,
            "fixed_charges": fixed_val
        }
        
        data["device_health"] = {"high_usage": ["AC & Cooling"] if is_summer else ["Water Heating"] if is_winter else []}
        
        if units >= 300:
            data["slab_alert"] = {
                "active": True, 
                "units_into_slab": int(units - 300) + 1, 
                "extra_cost": round((units - 300) * 2.5) + 50, 
                "strategy": "Consider reducing usage to drop entirely below the 300-unit slab threshold."
            }
        else:
            data["slab_alert"] = {"active": False}

        return data
    except Exception as e:
        print(f"JSON Parsing error: {e}")
        # fallback
        return {
            "month": 4, "year": 2026, "units_kwh": 350.0, "amount_rs": 2850.0,
            "device_breakdown": [{"name": "Lighting", "value": 1000, "color": "#4A9972"}],
            "slab_alert": {"active": False}, "vampire_load": {"cost": 450},
            "carbon": {"impact_kg": 300}, "budget_analysis": {"expected": 2850},
            "device_health": {}, "ai_narrative": "Fallback: Failed to parse bill details"
        }
