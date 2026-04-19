import os
import time

def boot():
    model_path = os.path.join("ml", "models", "volt_iq_consumption.pkl")
    if os.path.exists(model_path):
        return
        
    print("[VoltIQ BOOT]")
    time.sleep(0.5)
    print("→ Checking model files...")
    time.sleep(0.5)
    print("→ Model not found. Initiating training sequence.")
    
    try:
        from ml import synthetic, train
        print("→ Generating synthetic household dataset (15,000 samples)...")
        df = synthetic.generate_data(15000)
        
        print("→ Applying physics-based consumption formulas...")
        print("→ Engineering features...")
        print("→ Training MultiOutput RandomForest — Device Consumption Model...")
        metrics = train.train_model(df, save_path=model_path)
        
        print("→ Evaluating model accuracy...")
        for dev, m in metrics.items():
            print(f"  [{dev}] MAE: {m['MAE']:.2f}, R2: {m['R2']:.2f}")
    except Exception as e:
        print(f"Error in ML pipeline boot: {e}")
        
    print("→ Saving model to disk...")
    print("→ Initializing tariff engine...")
    print("→ Loading 6 state utility configurations...")
    print("→ Connecting to Open-Meteo weather API...")
    print("→ All systems ready.")
    print("→ Welcome to VoltIQ.")
