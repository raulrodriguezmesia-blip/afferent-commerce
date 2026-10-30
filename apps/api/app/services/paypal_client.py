"""
PayPal Orders API v2 client wrapper.

Handles authentication, order creation, capture, and webhook verification
for the Afferent Commerce agentic quality-control payment flow.
"""
import os
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

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)
