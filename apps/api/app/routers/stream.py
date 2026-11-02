import asyncio
import json
import math
import random
from typing import Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.physics_engine import resolve_material, compute_deformation_field, compute_stress_distribution, neuromorphic_reflex, multi_digit_topology, acoustic_friction_profile

router = APIRouter(tags=["stream"])

GRID = 32
PHASE_BOUNDARIES_MS = [0, 50, 150, 300]


def _phase_for(t_ms: float) -> str:
    if t_ms < 50:
        return "APPROACH_VISUAL_PRIOR"
    if t_ms < 150:
        return "MICRO_CONTACT_PROBE"
    if t_ms < 300:
        return "FORCE_BUDGET_ADJUSTMENT"
    return "STABLE_GRASP"


def _frame(t_ms: float, u_th: float, f_max: float, material: Dict[str, Any], active_digits: list) -> Dict[str, Any]:
    phase = _phase_for(t_ms)
    if phase == "APPROACH_VISUAL_PRIOR":
        uncertainty = round(random.uniform(0.35, 0.55), 3)
    elif phase == "MICRO_CONTACT_PROBE":
        uncertainty = round(random.uniform(0.18, 0.32), 3)
    elif phase == "FORCE_BUDGET_ADJUSTMENT":
        uncertainty = round(random.uniform(0.08, 0.16), 3)
    else:
        uncertainty = round(random.uniform(0.03, 0.09), 3)

    gating = "TACTILE_EXPLORATION_REQUIRED" if uncertainty > u_th else "AUTHORIZED_SAFE_GRASP"

    if phase == "APPROACH_VISUAL_PRIOR":
        force = 0.0
    elif phase == "MICRO_CONTACT_PROBE":
        force = 0.2
    elif phase == "FORCE_BUDGET_ADJUSTMENT":
        force = min(f_max * 0.6, 1.1)
    else:
        force = min(f_max * 0.85, 1.6)

    shear_limit = material["shear_limit_n"]
    if force > f_max or force > shear_limit:
        gating = "GRASP_DENIED"
        phase = "EMERGENCY_ABORT"

    stress = compute_stress_distribution(material, force, GRID)
    deform = compute_deformation_field(material, force, GRID)

    return {
        "t_ms": round(t_ms, 1),
        "phase": phase,
        "uncertainty_score": uncertainty,
        "u_threshold": u_th,
        "gating_decision": gating,
        "applied_force_n": round(force, 3),
        "f_max_n": f_max,
        "shear_limit_n": shear_limit,
        "material_class": material["material_class"],
        "stress_distribution_kpa": stress,
        "deformation_field_mm": deform,
        "grid_resolution": [GRID, GRID],
        "neuromorphic_reflex": neuromorphic_reflex(material, force, uncertainty, t_ms),
        "multi_digit_topology": multi_digit_topology(active_digits, force, t_ms),
        "acoustic_friction_profile": acoustic_friction_profile(material, force, t_ms),
    }


@router.websocket("/ws/v1/tactile-stream")
async def tactile_stream(websocket: WebSocket):
    await websocket.accept()
    u_th = 0.25
    f_max = 1.8
    material = resolve_material("Thin-Walled Glassware (Wine Stemware)")
    active_digits = ["thumb", "index", "middle"]

    async def control_listener():
        nonlocal u_th, f_max, material, active_digits
        while True:
            try:
                msg = await websocket.receive_text()
                data = json.loads(msg)
                if "u_threshold" in data:
                    u_th = float(data["u_threshold"])
                if "f_max" in data:
                    f_max = float(data["f_max"])
                if "object_label" in data:
                    material = resolve_material(str(data["object_label"]))
                if "active_digits" in data:
                    active_digits = list(data["active_digits"])
            except WebSocketDisconnect:
                break
            except Exception:
                await asyncio.sleep(0.01)

    listener = asyncio.create_task(control_listener())

    try:
        t = 0.0
        dt = 20.0
        while True:
            frame = _frame(t, u_th, f_max, material, active_digits)
            try:
                await websocket.send_text(json.dumps(frame))
            except (WebSocketDisconnect, RuntimeError, Exception):
                break
            if frame["phase"] == "EMERGENCY_ABORT":
                await asyncio.sleep(0.5)
                break
            t += dt
            if t > 600:
                t = 0.0
            await asyncio.sleep(dt / 1000.0)
    except WebSocketDisconnect:
        pass
    finally:
        listener.cancel()
        try:
            await listener
        except (asyncio.CancelledError, Exception):
            pass
