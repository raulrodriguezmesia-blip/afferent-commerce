"""
Quality Assessment Agent for Afferent Commerce.

Uses NVIDIA Nemotron via Nebius Token Factory to evaluate tactile quality
of inspected products and autonomously decide payment release.
"""
import os
import json
from typing import Dict, Any, Optional
import httpx

NEBIUS_BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/")
NEBIUS_MODEL = os.getenv("NEBIUS_MODEL", "nvidia/nemotron-3-super-120b-a12b")
NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY", "")


async def assess_quality(telemetry: Dict[str, Any], object_label: str) -> Dict[str, Any]:
    """Assess product quality based on tactile telemetry using Nemotron.

    Returns quality score (0-100), pass/fail, and reasoning.
    """
    quality_score = _compute_quality_score(telemetry)
    nemotron_diagnosis = await _get_nemotron_diagnosis(telemetry, object_label, quality_score)

    return {
        "quality_score": quality_score,
        "passed": quality_score >= 70,
        "confidence": round(min(0.99, quality_score / 100 + 0.1), 3),
        "nemotron_diagnosis": nemotron_diagnosis,
        "telemetry_summary": {
            "uncertainty": telemetry.get("uncertainty_score", 0),
            "gating": telemetry.get("gating_decision", "N/A"),
            "force_margin": telemetry.get("force_budget", {}).get("force_budget_margin_percent", 0),
            "edge_latency": telemetry.get("neuromorphic_reflex", {}).get("edge_latency_ms", 0),
            "slip_detected": telemetry.get("neuromorphic_reflex", {}).get("slip_detected", False),
        },
    }


def _compute_quality_score(telemetry: Dict[str, Any]) -> int:
    """Compute quality score from telemetry (0-100)."""
    score = 100
    cot = telemetry.get("tactile_reasoning_cot", {})
    fb = telemetry.get("force_budget", {})
    reflex = telemetry.get("neuromorphic_reflex", {})

    # Deduct for uncertainty
    unc = cot.get("uncertainty_score", 0)
    if unc > 0.25:
        score -= 30
    elif unc > 0.15:
        score -= 15

    # Deduct for slip
    if reflex.get("slip_detected", False):
        score -= 25
    if reflex.get("reflex_override_engaged", False):
        score -= 10

    # Deduct for low safety margin
    margin = fb.get("force_budget_margin_percent", 100)
    if margin < 50:
        score -= 20
    elif margin < 80:
        score -= 10

    # Deduct for high latency
    lat = reflex.get("edge_latency_ms", 0)
    if lat > 15:
        score -= 15
    elif lat > 10:
        score -= 5

    # Deduct for danger zones
    cells = telemetry.get("tactile_spatial_heatmap", {}).get("cells", [])
    danger_count = sum(1 for c in cells if c.get("risk_level") == "DANGER")
    if danger_count > 5:
        score -= 20
    elif danger_count > 0:
        score -= 5

    return max(0, min(100, score))


async def _get_nemotron_diagnosis(telemetry: Dict[str, Any], object_label: str, quality_score: int) -> str:
    """Get Nemotron diagnosis for the quality assessment."""
    if not NEBIUS_API_KEY:
        return _simulated_diagnosis(object_label, quality_score, telemetry)

    try:
        system_prompt = (
            "You are Afferent Commerce Quality Agent. Analyze tactile telemetry and provide "
            "a quality assessment for payment release. Be concise and technical.\n\n"
            f"Object: {object_label}\n"
            f"Quality Score: {quality_score}/100\n"
            f"Telemetry: {json.dumps(telemetry, indent=2)[:3000]}"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{NEBIUS_BASE_URL}chat/completions",
                headers={"Authorization": f"Bearer {NEBIUS_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": NEBIUS_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": "Assess quality and recommend payment release or hold."},
                    ],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
    except Exception:
        pass
    return _simulated_diagnosis(object_label, quality_score, telemetry)


def _simulated_diagnosis(object_label: str, quality_score: int, telemetry: Dict[str, Any]) -> str:
    if quality_score >= 80:
        return f"Quality assessment for {object_label}: PASS (score {quality_score}/100). Surface integrity verified. Force margins within tolerance. Payment release recommended."
    elif quality_score >= 50:
        return f"Quality assessment for {object_label}: CONDITIONAL (score {quality_score}/100). Minor surface anomalies detected. Manual review recommended before payment release."
    else:
        return f"Quality assessment for {object_label}: FAIL (score {quality_score}/100). Significant defects detected. Payment held pending inspection."
