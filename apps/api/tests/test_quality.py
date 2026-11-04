import os

import pytest

from app.services.quality_agent import _compute_quality_score, assess_quality


def test_quality_score_is_perfect_for_clean_telemetry():
    assert _compute_quality_score({}) == 100


def test_quality_score_applies_all_major_penalties():
    telemetry = {
        "tactile_reasoning_cot": {"uncertainty_score": 0.30},
        "neuromorphic_reflex": {
            "slip_detected": True,
            "reflex_override_engaged": True,
            "edge_latency_ms": 20,
        },
        "force_budget": {"force_budget_margin_percent": 40},
        "tactile_spatial_heatmap": {
            "cells": [{"risk_level": "DANGER"} for _ in range(6)]
        },
    }

    assert _compute_quality_score(telemetry) == 0


@pytest.mark.asyncio
async def test_assess_quality_releases_payment_for_high_score(monkeypatch):
    monkeypatch.setenv("NEBIUS_API_KEY", "")
    monkeypatch.setattr("app.services.quality_agent.NEBIUS_API_KEY", "")

    result = await assess_quality({}, "widget")

    assert result["quality_score"] == 100
    assert result["payment_action"] == "RELEASED"
    assert result["passed"] is True
    assert "PASS" in result["nemotron_diagnosis"]


@pytest.mark.asyncio
async def test_assess_quality_holds_payment_for_medium_score(monkeypatch):
    monkeypatch.setenv("NEBIUS_API_KEY", "")
    monkeypatch.setattr("app.services.quality_agent.NEBIUS_API_KEY", "")

    telemetry = {
        "force_budget": {"force_budget_margin_percent": 60},
        "neuromorphic_reflex": {"edge_latency_ms": 12},
        "tactile_reasoning_cot": {"uncertainty_score": 0.30},
    }

    result = await assess_quality(telemetry, "widget")

    assert result["quality_score"] == 55
    assert result["payment_action"] == "HELD"
    assert result["passed"] is False


@pytest.mark.asyncio
async def test_assess_quality_rejects_payment_for_low_score(monkeypatch):
    monkeypatch.setenv("NEBIUS_API_KEY", "")
    monkeypatch.setattr("app.services.quality_agent.NEBIUS_API_KEY", "")

    telemetry = {
        "tactile_reasoning_cot": {"uncertainty_score": 0.30},
        "neuromorphic_reflex": {
            "slip_detected": True,
            "reflex_override_engaged": True,
            "edge_latency_ms": 20,
        },
        "force_budget": {"force_budget_margin_percent": 40},
        "tactile_spatial_heatmap": {
            "cells": [{"risk_level": "DANGER"} for _ in range(6)]
        },
    }

    result = await assess_quality(telemetry, "widget")

    assert result["quality_score"] == 0
    assert result["payment_action"] == "REJECTED"
    assert result["passed"] is False
