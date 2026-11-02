"""
Afferent Commerce - Data Seeding Script
Pobla el sistema con ordenes realistas para la demo del hackathon.
"""

import requests
import random
import time
import os
from datetime import datetime

API_URL = os.getenv("API_URL", "http://localhost:8000")

PRODUCTS = [
    {"object_label": "Precision Turbine Blade #TB-409", "unit_price": 4850.00},
    {"object_label": "Microfluidic Sensor Array #MS-88", "unit_price": 1250.00},
    {"object_label": "Autonomous Actuator Housing #AH-12", "unit_price": 3200.00},
    {"object_label": "High-Precision Gear Set #GP-56", "unit_price": 890.00},
    {"object_label": "Thermal Heat Sink Module #TH-23", "unit_price": 640.00},
    {"object_label": "Ceramic PCB Substrate #CS-91", "unit_price": 1580.00},
    {"object_label": "Optical Calibration Lens #OL-77", "unit_price": 2750.00},
    {"object_label": "Industrial Bearing Assembly #IB-44", "unit_price": 420.00},
    {"object_label": "MEMS Pressure Sensor #MP-12", "unit_price": 965.00},
    {"object_label": "Aerospace Mounting Bracket #AM-68", "unit_price": 1120.00},
]

AUDITORS = [
    "compliance.lead@enterprise.com",
    "quality.auditor@enterprise.com",
    "finops.reviewer@enterprise.com",
    "risk.officer@enterprise.com",
    "procurement.audit@enterprise.com",
]

def generate_telemetry(quality_bias: str = "good"):
    base = {
        "neuromorphic_reflex": {"response_time_ms": random.randint(18, 65)},
        "tactile_reasoning_cot": {"steps": ["perception", "inference", "validation", "anomaly_check"]},
        "benchmark_telemetry": {"temperature_c": round(random.uniform(21, 38), 2)},
        "acoustic_friction_profile": {"friction_coeff": round(random.uniform(0.12, 0.48), 3)},
        "multi_digit_topology": {"contact_points": random.randint(3, 5)},
    }
    if quality_bias == "bad":
        base["velocity_anomaly"] = random.choice([True, False])
        base["device_mismatch"] = random.choice([True, False])
    return base

def seed():
    print("=" * 60)
    print("AFFERENT COMMERCE - DATA SEEDING")
    print("=" * 60)
    print("Target API: %s" % API_URL)
    print("Creando 20 ordenes de liquidacion realistas...\n")

    success = 0
    blocked = 0
    failed = 0

    for idx in range(20):
        product = random.choice(PRODUCTS)
        quality_bias = "good" if random.random() > 0.15 else "bad"
        telemetry = generate_telemetry(quality_bias)
        auditor = random.choice(AUDITORS)

        payload = {
            "object_label": product["object_label"],
            "telemetry": telemetry,
            "recipient_email": auditor,
            "amount": round(product["unit_price"] * random.uniform(0.8, 1.2), 2),
            "platform_fee_percent": 5.0,
        }

        try:
            resp = requests.post(
                "%s/api/v1/settle-and-dispatch" % API_URL,
                json=payload,
                headers={"X-Idempotency-Key": "seed-%s-%d" % (datetime.now().timestamp(), idx)},
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                print("[%02d] OK %s | $%s | %s | Q:%s" % (
                    idx+1,
                    product["object_label"][:38].ljust(38),
                    "%.2f" % payload["amount"],
                    data["status"].ljust(10),
                    data["quality_score"],
                ))
                success += 1
            elif resp.status_code == 402:
                print("[%02d] BLOCKED %s | $%s | Bloqueado | Calidad/Riesgo" % (
                    idx+1,
                    product["object_label"][:38].ljust(38),
                    "%.2f" % payload["amount"],
                ))
                blocked += 1
            else:
                print("[%02d] ERROR %s | status %d" % (
                    idx+1,
                    product["object_label"][:38].ljust(38),
                    resp.status_code,
                ))
                failed += 1
            time.sleep(0.4)
        except Exception as e:
            print("[%02d] Connection error: %s" % (idx+1, str(e)))
            failed += 1

    print("\n" + "=" * 60)
    print("SEEDING COMPLETADO | Exitos: %d | Bloqueados: %d | Fallos: %d" % (success, blocked, failed))
    print("=" * 60)
    print("\nAbre http://localhost:5173 para ver el Dashboard con datos poblados.")

if __name__ == "__main__":
    time.sleep(3)
    seed()
