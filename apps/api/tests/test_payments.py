from app.routers.payments import compute_fraud_flags, compute_split_payment


def test_fraud_flags_are_low_for_safe_transaction():
    flags = compute_fraud_flags(90, 100.0, {})

    assert flags.risk_level == "low"
    assert flags.risk_score == 0
    assert flags.flags == []
    assert flags.blocked is False


def test_fraud_flags_are_medium_for_elevated_risk():
    flags = compute_fraud_flags(50, 6000.0, {"velocity_anomaly": True})

    assert flags.risk_level == "medium"
    assert flags.risk_score == 45
    assert "HIGH_AMOUNT_TRANSACTION" in flags.flags
    assert "VELOCITY_ANOMALY" in flags.flags
    assert flags.blocked is False


def test_fraud_flags_are_high_and_blocked_for_critical_risk():
    flags = compute_fraud_flags(
        30,
        6000.0,
        {"velocity_anomaly": True, "device_mismatch": True},
    )

    assert flags.risk_level == "high"
    assert flags.risk_score == 100
    assert flags.blocked is True


def test_split_payment_uses_platform_fee_percent():
    split = compute_split_payment(100.0, 5.0)

    assert split["total_amount"] == 100.0
    assert split["platform_fee"] == 5.0
    assert split["merchant_settlement"] == 95.0
    assert split["platform_fee_percent"] == 5.0
    assert split["currency"] == "USD"
