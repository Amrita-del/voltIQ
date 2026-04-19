import os
import joblib
import pandas as pd
from engine.reconcile import reconcile

TARGETS = [
    "ac_kwh", "geyser_kwh", "fridge_kwh", 
    "lighting_fans_kwh", "wm_kwh", "ev_kwh", "other_kwh"
]

model = None

def load_model():
    global model
    if model is None:
        model_path = os.path.join(os.path.dirname(__file__), "models", "volt_iq_consumption.pkl")
        if os.path.exists(model_path):
            model = joblib.load(model_path)
    return model

def predict_device_consumption(features_dict, actual_bill_kwh):
    m = load_model()
    if not m:
        return {}
        
    # features_dict must be fully filled via features.builder
    df = pd.DataFrame([features_dict])
    preds = m.predict(df)[0]
    
    raw_predictions = {tgt: float(val) for tgt, val in zip(TARGETS, preds)}
    
    # Reconciliation: Force sum to equal actual_bill_kwh
    reconciled_predictions = reconcile(raw_predictions, actual_bill_kwh)
    
    return reconciled_predictions
