import os
import joblib
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

BASE_FEATURES = [
    "household_size", "home_type_enc", "has_ac", "has_geyser", "has_wm", "has_ev",
    "ac_star_rating", "ac_age_years", "ac_wattage", "total_units_kwh", "billing_month",
    "units_per_person", "avg_monthly_temp", "cooling_degree_days", "season_encoded", "is_peak_summer"
]

TARGETS = [
    "ac_kwh", "geyser_kwh", "fridge_kwh", 
    "lighting_fans_kwh", "wm_kwh", "ev_kwh", "other_kwh"
]

def train_model(df, save_path):
    X = df[BASE_FEATURES]
    y = df[TARGETS]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Type: MultiOutputRegressor(RandomForestRegressor(...)
    base_rf = RandomForestRegressor(n_estimators=200, max_depth=10, min_samples_leaf=5, random_state=42, n_jobs=-1)
    model = MultiOutputRegressor(base_rf)
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    metrics = {}
    for i, target in enumerate(TARGETS):
        mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        r2 = r2_score(y_test.iloc[:, i], y_pred[:, i])
        metrics[target] = {"MAE": mae, "R2": r2}
        
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    joblib.dump(model, save_path)
    
    return metrics
