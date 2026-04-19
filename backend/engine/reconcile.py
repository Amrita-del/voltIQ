
def reconcile(predictions, actual_kwh):
    predicted_total = sum(predictions.values())
    if predicted_total == 0:
        return predictions
    scale = actual_kwh / predicted_total
    corrected = {dev: kwh * scale for dev, kwh in predictions.items()}
    return corrected
