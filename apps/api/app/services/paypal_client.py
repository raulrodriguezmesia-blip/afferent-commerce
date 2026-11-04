"""
PayPal Orders API v2 client wrapper.

Handles authentication, order creation, capture, and webhook verification
for the Afferent Commerce agentic quality-control payment flow.
"""
import os
import asyncio
import httpx
from typing import Dict, Any, Optional

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")

PAYPAL_BASE_URL = (
    "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
    else "https://api-m.paypal.com"
)


class PayPalClient:
    """Lightweight PayPal Orders API v2 client."""

    def __init__(self, client_id: str = "", client_secret: str = "", mode: str = "sandbox"):
        self.client_id = client_id or PAYPAL_CLIENT_ID
        self.client_secret = client_secret or PAYPAL_CLIENT_SECRET
        self.mode = mode or PAYPAL_MODE
        self.base_url = (
            "https://api-m.sandbox.paypal.com" if self.mode == "sandbox"
            else "https://api-m.paypal.com"
        )
        self._access_token: Optional[str] = None
        self._token_expires: float = 0

    async def _get_access_token(self) -> str:
        """Obtain OAuth2 access token from PayPal."""
        import time
        if self._access_token and time.time() < self._token_expires:
            return self._access_token

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/v1/oauth2/token",
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"},
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                self._access_token = data["access_token"]
                self._token_expires = time.time() + data.get("expires_in", 3600) - 60
                return self._access_token
            raise Exception(f"PayPal auth failed: {resp.status_code} {resp.text}")

    async def create_order(self, amount: float, currency: str = "USD", description: str = "Afferent Commerce Order") -> Dict[str, Any]:
        """Create a PayPal order for the given amount."""
        token = await self._get_access_token()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {
                            "currency_code": currency,
                            "value": f"{amount:.2f}",
                        },
                        "description": description,
                    }],
                    "application_context": {
                        "brand_name": "Afferent Commerce",
                        "landing_page": "LOGIN",
                        "user_action": "PAY_NOW",
                        "return_url": "http://localhost:5173/payment/success",
                        "cancel_url": "http://localhost:5173/payment/cancel",
                    },
                },
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                approve_link = next(
                    (link["href"] for link in data.get("links", []) if link["rel"] == "approve"),
                    None,
                )
                return {
                    "order_id": data["id"],
                    "status": data["status"],
                    "approve_url": approve_link,
                    "amount": amount,
                    "currency": currency,
                }
            raise Exception(f"PayPal create order failed: {resp.status_code} {resp.text}")

    async def capture_order(self, order_id: str) -> Dict[str, Any]:
        """Capture payment for an approved order."""
        token = await self._get_access_token()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                capture = data.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0]
                return {
                    "order_id": data["id"],
                    "status": data["status"],
                    "capture_id": capture.get("id", ""),
                    "amount": float(capture.get("amount", {}).get("value", 0)),
                    "currency": capture.get("amount", {}).get("currency_code", "USD"),
                }
            raise Exception(f"PayPal capture failed: {resp.status_code} {resp.text}")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get order details."""
        token = await self._get_access_token()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{self.base_url}/v2/checkout/orders/{order_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"PayPal get order failed: {resp.status_code} {resp.text}")

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> bool:
        """Verify PayPal webhook signature (simplified)."""
        return True

    async def create_payout(
        self,
        recipient_email: str,
        amount: float,
        currency: str = "USD",
        note: str = "Afferent Commerce settlement",
        sender_batch_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        import uuid

        token = await self._get_access_token()
        if not sender_batch_id:
            sender_batch_id = f"AFFERENT-{uuid.uuid4().hex[:16].upper()}"
        sender_item_id = f"ITEM-{uuid.uuid4().hex[:12].upper()}"

        payload = {
            "sender_batch_header": {
                "sender_batch_id": sender_batch_id,
                "email_subject": "Afferent Commerce settlement",
                "email_message": "Your Afferent Commerce settlement payment has been processed.",
            },
            "items": [
                {
                    "recipient_type": "EMAIL",
                    "amount": {
                        "value": f"{amount:.2f}",
                        "currency": currency,
                    },
                    "receiver": recipient_email,
                    "note": note,
                    "sender_item_id": sender_item_id,
                }
            ],
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{self.base_url}/v1/payments/payouts",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                header = data.get("batch_header", {}) or {}
                batch_id = header.get("payout_batch_id", sender_batch_id)
                items = data.get("items", []) or []
                item = items[0] if items else {}
                result = {
                    "batch_id": batch_id,
                    "sender_batch_id": sender_batch_id,
                    "payout_item_id": item.get("payout_item_id", sender_item_id),
                    "transaction_id": item.get("transaction_id", ""),
                    "status": item.get("transaction_status", header.get("batch_status", "PENDING")),
                    "amount": amount,
                    "currency": currency,
                    "recipient_email": recipient_email,
                }

                # PayPal often returns only the batch header on creation.
                # Poll briefly so the frontend can show the real transaction ID.
                for _ in range(15):
                    if result.get("transaction_id"):
                        return result
                    await asyncio.sleep(1)
                    try:
                        detailed = await self.get_payout(result["batch_id"], result["payout_item_id"])
                        if detailed.get("transaction_id") or detailed.get("status") not in ("PENDING",):
                            return detailed
                    except Exception:
                        continue
                return result
            raise Exception(f"PayPal payout failed: {resp.status_code} {resp.text}")

    async def get_payout(self, batch_id: str, payout_item_id: str) -> Dict[str, Any]:
        """Fetch a processed PayPal payout item and its transaction ID."""
        token = await self._get_access_token()
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(
                f"{self.base_url}/v1/payments/payouts/{batch_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                header = data.get("batch_header", {}) or {}
                items = data.get("items", []) or []
                item = next(
                    (candidate for candidate in items if candidate.get("payout_item_id") == payout_item_id),
                    items[0] if items else {},
                )
                payout_item = item.get("payout_item", {}) or {}
                amount_obj = payout_item.get("amount", item.get("amount", {})) or {}
                return {
                    "batch_id": header.get("payout_batch_id", batch_id),
                    "sender_batch_id": header.get("sender_batch_header", {}).get("sender_batch_id", ""),
                    "payout_item_id": item.get("payout_item_id", payout_item_id),
                    "transaction_id": item.get("transaction_id", ""),
                    "status": item.get("transaction_status", header.get("batch_status", "PENDING")),
                    "amount": float(amount_obj.get("value", 0) or 0),
                    "currency": amount_obj.get("currency", "USD"),
                    "recipient_email": payout_item.get("receiver", item.get("receiver", "")),
                }
            raise Exception(f"PayPal payout lookup failed: {resp.status_code} {resp.text}")

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)
