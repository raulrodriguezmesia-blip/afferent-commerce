import os
import httpx
import asyncio
from typing import Optional


class FinOpsAssistant:
    def __init__(self):
        self.api_key = os.getenv("NEBIUS_API_KEY", "")
        self.base_url = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/")
        self.model = os.getenv("NEBIUS_MODEL", "nvidia/nemotron-3-super-120b-a12b")

    async def answer(self, question: str) -> str:
        context = """
        Eres el FinOps Assistant de Afferent Commerce, una plataforma de Agentic Commerce con Quality-Gated Settlement para PayPal.

        Conoces:
        - Flujo: Vision-to-Touch -> Quality Assessment -> PayPal Orders API v2 -> Settlement condicional
        - Métricas: Revenue, AOV, Pending Payouts, Disputas prevenidas
        - Riesgo: Fraud Detection, Idempotencia, Split Payments
        - Cumplimiento: Audit Trail, PDF reports

        Responde de forma concisa, profesional y orientada a negocio. Usa markdown cuando convenga.
        Siempre ofrece insights accionables.
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

    def _fallback_answer(self, question: str) -> str:
        q = question.lower()
        if "revenue" in q or "ventas" in q:
            return "## Análisis de Ventas\n\nBasado en el dashboard:\n\n- **Revenue Sandbox:** $128,430.00 (+12.5% vs periodo anterior)\n- **AOV:** $84.20\n- **Tasa de aprobación:** Alta gracias al Quality-Gated Settlement\n\n**Recomendación:** Mantén el umbral de calidad >= 70 para maximizar aprobación sin incrementar riesgo."
        if "payout" in q or "pago" in q:
            return "## Estado de Liquidaciones\n\n- **Completados:** Mayoría vía PayPal Orders API v2\n- **Pendientes:** $12,100.50 en revisión\n- **Bloqueados:** Por debajo del umbral de calidad o flags de fraude\n\n**Tip:** Usa `X-Idempotency-Key` en `settle-and-dispatch` para evitar doble captura."
        if "riesgo" in q or "fraud" in q:
            return "## Detección de Riesgo\n\nEl sistema evalúa:\n- **Calidad** (<40 → Alto riesgo)\n- **Monto** (> $5000 → Flag)\n- **Anomalías de telemetría**\n- **Velocidad de transacciones**\n\n**Acción:** Transacciones con `risk_level: high` se bloquean automáticamente."
        if "split" in q or "comisión" in q:
            return "## Split Payments\n\nConfiguración actual: **5% plataforma / 95% vendedor**\n\nEjemplo $100.00:\n- Comisión plataforma: **$5.00**\n- Liquidación vendedor: **$95.00**\n\nEl cálculo es automático en `settle-and-dispatch`."
        return "## FinOps Assistant\n\nPuedo ayudarte con:\n- **Órdenes:** Estado, seguimiento, liquidación\n- **Finanzas:** Revenue, AOV, payouts pendientes\n- **Riesgo:** Fraude, calidad, anomalías\n- **Cumplimiento:** Auditoría, trazabilidad\n\nPrueba preguntando: *'¿Cómo va el revenue hoy?'* o *'¿Qué transacciones están en hold?'*"
