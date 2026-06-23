import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib

# Realistic Network Flow Dataset Generation
# Features: src_port, dst_port, protocol_type (numeric), byte_count, packet_count, duration, flags
def generate_dataset(n_samples=5000):
    np.random.seed(42)
    data = []
    
    # Define attack signatures
    for _ in range(n_samples):
        attack_type = np.random.choice(["Normal", "SYN Port Scan", "APT Lateral Movement", "DDoS Precursor"], p=[0.7, 0.15, 0.05, 0.1])
        
        if attack_type == "Normal":
            # Typical web/DNS traffic
            dst_port = np.random.choice([80, 443, 53])
            src_port = np.random.randint(1024, 65535)
            protocol = 1 if dst_port == 53 else 0 # 1=UDP, 0=TCP
            bytes_c = np.random.randint(40, 2000)
            packets = np.random.randint(1, 15)
            duration = np.random.uniform(0.01, 2.0)
            
        elif attack_type == "SYN Port Scan":
            # Nmap scan pattern (many rapid small packets to various ports)
            dst_port = np.random.randint(20, 1024)
            src_port = np.random.randint(1024, 65535)
            protocol = 0
            bytes_c = np.random.randint(40, 64)
            packets = 1
            duration = np.random.uniform(0.0, 0.05)
            
        elif attack_type == "APT Lateral Movement":
            # Heavy internal SSH/RDP traffic
            dst_port = np.random.choice([22, 3389])
            src_port = np.random.randint(1024, 65535)
            protocol = 0
            bytes_c = np.random.randint(10000, 500000)
            packets = np.random.randint(100, 5000)
            duration = np.random.uniform(10.0, 120.0)
            
        else: # DDoS Precursor
            # High volume UDP DNS amplification
            dst_port = 53
            src_port = np.random.randint(1024, 65535)
            protocol = 1
            bytes_c = np.random.randint(3000, 8000)
            packets = np.random.randint(10, 50)
            duration = np.random.uniform(0.1, 1.0)
            
        data.append([src_port, dst_port, protocol, bytes_c, packets, duration, attack_type])
        
    df = pd.DataFrame(data, columns=['src_port', 'dst_port', 'protocol', 'byte_count', 'packet_count', 'duration', 'label'])
    return df

def train_and_save():
    print("[*] Generating highly realistic synthetic intrusion dataset...")
    df = generate_dataset(10000)
    
    X = df.drop('label', axis=1)
    y = df['label']
    
    print("[*] Splitting dataset and scaling features...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    print("[*] Training Military-Grade Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X_train_scaled, y_train)
    
    accuracy = clf.score(scaler.transform(X_test), y_test)
    print(f"[+] Training Complete. Model Accuracy: {accuracy * 100:.2f}%")
    
    # Save artifacts
    os.makedirs('detection/ml_artifacts', exist_ok=True)
    joblib.dump(scaler, 'detection/ml_artifacts/scaler.pkl')
    joblib.dump(clf, 'detection/ml_artifacts/rf_model.pkl')
    print("[+] Model and Scaler saved to detection/ml_artifacts/")

if __name__ == "__main__":
    train_and_save()
