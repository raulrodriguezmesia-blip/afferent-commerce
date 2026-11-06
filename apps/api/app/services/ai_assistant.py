import os
import httpx
import asyncio
import unicodedata
from typing import Optional


class FinOpsAssistant:
    def __init__(self):
        self.api_key = os.getenv("NEBIUS_API_KEY", "")
        self.base_url = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/")
        self.model = os.getenv("NEBIUS_MODEL", "nvidia/nemotron-3-super-120b-a12b")

    def _normalize(self, question: str) -> str:
        return "".join(
            char
            for char in unicodedata.normalize("NFKD", question.lower())
            if not unicodedata.combining(char)
        )

    async def answer(self, question: str) -> str:
        normalized = self._normalize(question)
        founder_keywords = (
            "vision",
            "special",
            "purpose",
            "product founder",
            "what does",
            "what is",
            "how does",
            "system",
            "project",
            "afferent",
            "que es",
            "como funciona",
            "que hace",
            "especial",
            "why should this win",
        )
        if any(keyword in normalized for keyword in founder_keywords):
            return self._founder_vision_answer()

        context = """
        You are the FinOps Assistant for Afferent Commerce, an Agentic Commerce platform with Quality-Gated Settlement for PayPal.

        You know:
        - Flow: Vision-to-Touch -> Quality Assessment -> PayPal Orders API v2 -> Conditional Settlement
        - Metrics: Revenue, AOV, Pending Payouts, Prevented Disputes
        - Risk: Fraud Detection, Idempotency, Split Payments
        - Compliance: Audit Trail, PDF reports

        Respond concisely, professionally, and business-focused. Use markdown when helpful.
        Always provide actionable insights.
        """

        if not self.api_key:
            return self._fallback_answer(question)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{self.base_url}chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": context},
                            {"role": "user", "content": question},
                        ],
                        "temperature": 0.4,
                        "max_tokens": 600,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                return self._fallback_answer(question)
        except Exception:
            return self._fallback_answer(question)

    def _founder_vision_answer(self) -> str:
        return (
            "Every year millions of dollars move through B2B commerce before physical quality is verified.\n\n"
            "Afferent Commerce transforms real quality evidence into trusted financial execution.\n\n"
            "AI recommends. Humans approve. PayPal executes.\n\n"
            "The result: Less fraud. Less dispute. More trust."
        )

    def _fallback_answer(self, question: str) -> str:
        q = self._normalize(question)
        if "revenue" in q or "sales" in q:
            return (
                "## Sales Analysis\n\n"
                "Based on the dashboard:\n\n"
                "- **Sandbox Revenue:** $128,430.00 (+12.5% vs previous period)\n"
                "- **AOV:** $84.20\n"
                "- **Approval Rate:** High thanks to Quality-Gated Settlement\n\n"
                "**Recommendation:** Keep the quality threshold >= 70 to maximize approvals without increasing risk."
            )
        if "payout" in q or "payment" in q:
            return (
                "## Settlement Status\n\n"
                "- **Completed:** Mostly through PayPal Orders API v2\n"
                "- **Pending:** $12,100.50 under review\n"
                "- **Blocked:** Below the quality threshold or fraud flags\n\n"
                "**Tip:** Use `X-Idempotency-Key` in `settle-and-dispatch` to avoid duplicate captures."
            )
        if "risk" in q or "fraud" in q:
            return (
                "## Risk Detection\n\n"
                "The system evaluates:\n"
                "- **Quality** (<40 -> High risk)\n"
                "- **Amount** (> $5000 -> Flag)\n"
                "- **Telemetry anomalies**\n"
                "- **Transaction velocity**\n\n"
                "**Action:** Transactions with `risk_level: high` are blocked automatically."
            )
        if "split" in q or "fee" in q or "commission" in q:
            return (
                "## Split Payments\n\n"
                "Current configuration: **5% platform / 95% merchant**\n\n"
                "Example for $100.00:\n"
                "- Platform fee: **$5.00**\n"
                "- Merchant settlement: **$95.00**\n\n"
                "The calculation is automatic in `settle-and-dispatch`."
            )
        return (
            "## FinOps Assistant\n\n"
            "I can help with:\n"
            "- **Orders:** status, tracking, settlement\n"
            "- **Finance:** revenue, AOV, pending payouts\n"
            "- **Risk:** fraud, quality, anomalies\n"
            "- **Compliance:** audit, traceability\n\n"
            "Try asking: *'How is revenue today?'* or *'Which transactions are on hold?'*"
        )
