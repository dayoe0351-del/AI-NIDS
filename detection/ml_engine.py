import os
import joblib
import numpy as np

# Load model and scaler lazily
_model = None
_scaler = None

def get_ml_pipeline():
    global _model, _scaler
    if _model is None or _scaler is None:
        base_dir = os.path.dirname(__file__)
        model_path = os.path.join(base_dir, 'ml_artifacts', 'rf_model.pkl')
        scaler_path = os.path.join(base_dir, 'ml_artifacts', 'scaler.pkl')
        
        if not os.path.exists(model_path):
            raise Exception("ML Model not trained. Please run train_model.py first.")
            
        _model = joblib.load(model_path)
        _scaler = joblib.load(scaler_path)
        
    return _model, _scaler

def evaluate_flow(flow_data):
    """
    Evaluates raw network flow metrics and returns a prediction and confidence score.
    Expected dict: {'src_port', 'dst_port', 'protocol', 'byte_count', 'packet_count', 'duration'}
    Returns: (attack_type: str, confidence: float, severity: str)
    """
    model, scaler = get_ml_pipeline()
    
    # Extract features matching the trained model order
    # ['src_port', 'dst_port', 'protocol', 'byte_count', 'packet_count', 'duration']
    proto = 1 if str(flow_data.get('protocol', '')).upper() == 'UDP' else 0
    
    features = np.array([[
        int(flow_data.get('src_port', 0)),
        int(flow_data.get('dst_port', 0)),
        proto,
        int(flow_data.get('byte_count', 0)),
        int(flow_data.get('packet_count', 0)),
        float(flow_data.get('duration', 0.1))
    ]])
    
    scaled_features = scaler.transform(features)
    
    prediction = model.predict(scaled_features)[0]
    probabilities = model.predict_proba(scaled_features)[0]
    confidence = float(np.max(probabilities))
    
    # Determine severity
    severity_map = {
        "Normal": "LOW",
        "SYN Port Scan": "MEDIUM",
        "DDoS Precursor": "HIGH",
        "APT Lateral Movement": "CRITICAL"
    }
    
    return prediction, confidence, severity_map.get(prediction, "LOW")
