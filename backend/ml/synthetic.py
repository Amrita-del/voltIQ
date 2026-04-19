import pandas as pd
import numpy as np

def generate_data(num_samples=15000):
    np.random.seed(42)
    
    household_size = np.random.randint(1, 7, size=num_samples)
    home_type_enc = np.random.choice([1, 2, 3, 4], size=num_samples)
    has_ac = np.random.choice([0, 1], p=[0.4, 0.6], size=num_samples)
    has_geyser = np.random.choice([0, 1], p=[0.3, 0.7], size=num_samples)
    has_wm = np.random.choice([0, 1], p=[0.2, 0.8], size=num_samples)
    has_ev = np.random.choice([0, 1], p=[0.9, 0.1], size=num_samples)
    
    ac_star_rating = np.where(has_ac == 1, np.random.randint(1, 6, size=num_samples), 0)
    ac_age_years = np.where(has_ac == 1, np.random.randint(1, 10, size=num_samples), 0)
    ac_wattage = np.where(has_ac == 1, 1500 - (ac_star_rating * 100), 0)
    
    billing_month = np.random.randint(1, 13, size=num_samples)
    
    is_peak_summer = np.isin(billing_month, [4, 5, 6]).astype(int)
    avg_monthly_temp = 25 + (is_peak_summer * 10) + np.random.normal(0, 2, size=num_samples)
    cooling_degree_days = np.clip(avg_monthly_temp - 24, 0, None) * 30
    
    season_encoded = np.where(is_peak_summer == 1, 1, np.where(np.isin(billing_month, [11, 12, 1, 2]), 2, 0))
    
    ac_hours_daily = np.clip(cooling_degree_days / 40, 0, 12) * has_ac
    age_factor_ac = 1 + np.minimum(ac_age_years * 0.02, 0.4)
    ac_kwh = (ac_wattage * ac_hours_daily * 30 / 1000) * age_factor_ac * np.random.uniform(0.9, 1.1, size=num_samples)
    
    cold_factor = np.where(season_encoded == 2, 1.5, 0.5)
    geyser_kwh = (2.3 * cold_factor * 30 * household_size * 0.3) * has_geyser * np.random.uniform(0.9, 1.1, size=num_samples)
    
    fridge_kwh = (30 + is_peak_summer * 15) * np.random.uniform(0.9, 1.1, size=num_samples)
    lighting_fans_kwh = (15 + (household_size * 10) + (is_peak_summer * 20)) * np.random.uniform(0.9, 1.1, size=num_samples)
    wm_kwh = (household_size * 5) * has_wm * np.random.uniform(0.9, 1.1, size=num_samples)
    ev_kwh = (150) * has_ev * np.random.uniform(0.8, 1.2, size=num_samples)
    other_kwh = (20 + household_size * 5) * np.random.uniform(0.8, 1.2, size=num_samples)
    
    total_units_kwh = ac_kwh + geyser_kwh + fridge_kwh + lighting_fans_kwh + wm_kwh + ev_kwh + other_kwh
    units_per_person = total_units_kwh / household_size
    
    df = pd.DataFrame({
        "household_size": household_size, "home_type_enc": home_type_enc,
        "has_ac": has_ac, "has_geyser": has_geyser, "has_wm": has_wm, "has_ev": has_ev,
        "ac_star_rating": ac_star_rating, "ac_age_years": ac_age_years, "ac_wattage": ac_wattage,
        "total_units_kwh": total_units_kwh, "billing_month": billing_month,
        "units_per_person": units_per_person, "avg_monthly_temp": avg_monthly_temp,
        "cooling_degree_days": cooling_degree_days, "season_encoded": season_encoded,
        "is_peak_summer": is_peak_summer,
        "ac_kwh": ac_kwh, "geyser_kwh": geyser_kwh, "fridge_kwh": fridge_kwh,
        "lighting_fans_kwh": lighting_fans_kwh, "wm_kwh": wm_kwh, "ev_kwh": ev_kwh, "other_kwh": other_kwh
    })
    return df
