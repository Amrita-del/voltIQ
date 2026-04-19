from google import genai
import os

def generate_report(report_data):
    key = os.getenv("GEMINI_API_KEY")
    if not key or key == "your_key_here":
        return "Gemini API key missing. Summary: You consumed " + str(report_data['total_units']) + " units."
        
    client = genai.Client(api_key=key)
    
    prompt = f"""You are Volt, VoltIQ's energy advisor.
    DO NOT INVENT NUMBERS. Use this data: {report_data}
    Write a brief report:
    1. Summary
    2. Device breakdown
    3. Alert (if any)
    4. Carbon impact
    5. Budget status
    """
    try:
        res = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return res.text
    except:
        return "Failed to connect to AI engine."
