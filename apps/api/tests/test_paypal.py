from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """The API should expose a basic health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_payout_schema_validation():
    """Empty payout requests must be rejected by Pydantic before PayPal is called."""
    response = client.post("/api/v1/paypal/payout", json={})
    assert response.status_code == 422


def test_unknown_payout_lookup():
    """Unknown payout item IDs should return a controlled 404 response."""
    response = client.get("/api/v1/paypal/payouts/UNKNOWN-PAYOUT-ID")
    assert response.status_code == 404
