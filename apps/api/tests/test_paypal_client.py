from unittest.mock import AsyncMock

import pytest

from app.services.paypal_client import PayPalClient


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class FakePayPalClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url, headers=None, json=None):
        return FakeResponse(
            201,
            {
                "batch_header": {
                    "payout_batch_id": "BATCH-123",
                    "batch_status": "PENDING",
                    "sender_batch_header": {"sender_batch_id": "SENDER-123"},
                },
                "items": [],
            },
        )

    async def get(self, url, headers=None):
        return FakeResponse(
            200,
            {
                "batch_header": {
                    "payout_batch_id": "BATCH-123",
                    "batch_status": "SUCCESS",
                    "sender_batch_header": {"sender_batch_id": "SENDER-123"},
                },
                "items": [
                    {
                        "payout_item_id": "ITEM-123",
                        "transaction_id": "TXN-123",
                        "transaction_status": "SUCCESS",
                        "payout_item": {
                            "amount": {"value": "10.50", "currency": "USD"},
                            "receiver": "recipient@example.com",
                        },
                    }
                ],
            },
        )


@pytest.mark.asyncio
async def test_paypal_client_is_not_configured_without_credentials():
    client = PayPalClient("", "", "sandbox")

    assert client.is_configured() is False


@pytest.mark.asyncio
async def test_create_payout_uses_paypal_rest_api(monkeypatch):
    client = PayPalClient("client-id", "client-secret", "sandbox")

    async def fake_token():
        return "access-token"

    monkeypatch.setattr(client, "_get_access_token", fake_token)
    monkeypatch.setattr("app.services.paypal_client.httpx.AsyncClient", FakePayPalClient)
    monkeypatch.setattr("app.services.paypal_client.asyncio.sleep", AsyncMock())

    result = await client.create_payout(
        recipient_email="recipient@example.com",
        amount=10.5,
        currency="USD",
        note="Test payout",
    )

    assert result["batch_id"] == "BATCH-123"
    assert result["sender_batch_id"] == "SENDER-123"
    assert result["payout_item_id"] == "ITEM-123"
    assert result["transaction_id"] == "TXN-123"
    assert result["status"] == "SUCCESS"
    assert result["amount"] == 10.5
    assert result["currency"] == "USD"
    assert result["recipient_email"] == "recipient@example.com"


@pytest.mark.asyncio
async def test_get_payout_returns_transaction_details(monkeypatch):
    client = PayPalClient("client-id", "client-secret", "sandbox")

    async def fake_token():
        return "access-token"

    monkeypatch.setattr(client, "_get_access_token", fake_token)
    monkeypatch.setattr("app.services.paypal_client.httpx.AsyncClient", FakePayPalClient)

    result = await client.get_payout("BATCH-123", "ITEM-123")

    assert result["batch_id"] == "BATCH-123"
    assert result["payout_item_id"] == "ITEM-123"
    assert result["transaction_id"] == "TXN-123"
    assert result["status"] == "SUCCESS"
    assert result["amount"] == 10.5
    assert result["currency"] == "USD"
    assert result["recipient_email"] == "recipient@example.com"
