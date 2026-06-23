import requests
import time
import random

BASE_URL = "http://localhost:8000/api/v1"

def create_flow(src_ip, dst_ip, src_port, dst_port, protocol, byte_count, packet_count, duration):
    data = {
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": src_port,
        "dst_port": dst_port,
        "protocol": protocol,
        "byte_count": byte_count,
        "packet_count": packet_count,
        "duration": duration
    }
    try:
        requests.post(f"{BASE_URL}/flows/", json=data)
    except requests.exceptions.ConnectionError:
        print("Error: Backend is not running.")

def simulate_nmap_scan():
    print("Simulating Eager Network Scanning (Nmap SYN)...")
    attacker = f"192.168.1.{random.randint(100, 200)}"
    target = "10.0.5.50"
    
    # Generate exact signature matched by ML: 40-64 bytes, 1 packet, small duration
    for port in range(20, 25):
        create_flow(attacker, target, random.randint(10000, 60000), port, "TCP", 45, 1, 0.01)
        time.sleep(0.05)
    print("-> Nmap scan traffic sent.")

def simulate_apt_lateral_movement():
    print("Simulating APT Lateral Movement...")
    compromised_host = "10.0.5.22"
    critical_server = "10.0.8.10"
    
    # ML matches: Heavy internal traffic, high bytes/packets, long duration, port 22/3389
    for _ in range(2):
        create_flow(compromised_host, critical_server, random.randint(40000, 50000), 22, "TCP", 25000, 1500, 45.0)
        time.sleep(0.5)
    print("-> APT Lateral Movement traffic sent.")

def simulate_ddos_precursor():
    print("Simulating DDoS Precursor (Reflector Scanning)...")
    target = "10.0.2.100"
    
    # ML matches: UDP, Port 53, ~4000 bytes, ~20 packets
    for _ in range(5):
        spoofed_ip = f"{random.randint(1, 200)}.{random.randint(1, 255)}.0.5"
        create_flow(spoofed_ip, target, random.randint(10000, 60000), 53, "UDP", 4500, 25, 0.5)
        time.sleep(0.1)
    print("-> DDoS Precursor traffic sent.")

if __name__ == "__main__":
    print("Starting AI-NIDS Machine Learning Attack Simulation...")
    print("Ensure the Django server is running and ML model is trained.\n")
    
    print("Generating normal baseline traffic...")
    for _ in range(5):
        create_flow("10.0.5.10", "8.8.8.8", random.randint(50000, 60000), 443, "TCP", 800, 5, 0.5)
        time.sleep(0.2)
        
    # Simulate Attacks
    simulate_nmap_scan()
    time.sleep(1)
    simulate_apt_lateral_movement()
    time.sleep(1)
    simulate_ddos_precursor()
    
    print("\nSimulation Complete! Check your Dashboard HUD for ML detections.")
