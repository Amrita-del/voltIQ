
import json
import os

def calculate_bill(units, provider):
    try:
        path = os.path.join(os.path.dirname(__file__), "tariffs", f"{provider}.json")
        with open(path, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"total": units * 8.0}
    
    cost = 0
    remaining = units
    for slab in data["slabs"]:
        allowed = slab["limit"]
        rate = slab["rate"]
        if remaining > allowed:
            cost += allowed * rate
            remaining -= allowed
        else:
            cost += remaining * rate
            break
            
    return {"total": cost + data.get("fixed_charge", 0)}

def marginal_cost_attribution(reconciled_kwh, provider):
    total_units = sum(reconciled_kwh.values())
    total_cost = calculate_bill(total_units, provider)["total"]
    
    if total_units == 0:
        return {dev: 0.0 for dev in reconciled_kwh}
        
    return {dev: (kwh / total_units) * total_cost for dev, kwh in reconciled_kwh.items()}
