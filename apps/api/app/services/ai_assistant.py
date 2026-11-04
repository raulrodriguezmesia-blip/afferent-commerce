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
        founder_keywords = ("vision", "especial", "proposito", "product founder", "que hace", "que hace especial")
        if any(keyword in question.lower() for keyword in founder_keywords):
            return self._founder_vision_answer()

        context = """
        Eres el FinOps Assistant de Afferent Commerce, una plataforma de Agentic Commerce con Quality-Gated Settlement para PayPal.

        Conoces:
        - Flujo: Vision-to-Touch -> Quality Assessment -> PayPal Orders API v2 -> Settlement condicional
        - MÃƒÂ©tricas: Revenue, AOV, Pending Payouts, Disputas prevenidas
        - Riesgo: Fraud Detection, Idempotencia, Split Payments
        - Cumplimiento: Audit Trail, PDF reports

        Responde de forma concisa, profesional y orientada a negocio. Usa markdown cuando convenga.
        Siempre ofrece insights accionables.

        Vision de producto (Product Founder):
        Afferent Commerce no es solo una demo de componentes o scripts aislados; es la convergencia entre la fisica somatosensorial y la ejecucion financiera autonoma.
        La excelencia tecnica (monorepo FastAPI/React, telemetria a 50 Hz y razonamiento multimodal con NVIDIA Nemotron) solo cobra sentido cuando resuelve un problema critico del mundo real.
        Al delegar en el agente la decision condicional de pago en PayPal segun la calidad fisica del producto, transformamos una inspeccion de calidad compleja en un motor de comercio confiable y libre de fraude.
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
            "## Product Vision\n\n"
            "Afferent Commerce no es solo una demostracion de componentes o scripts aislados; "
            "es la convergencia entre la fisica somatosensorial y la ejecucion financiera autonoma.\n\n"
            "La excelencia tecnica (monorepo FastAPI/React, telemetria a 50 Hz y razonamiento multimodal "
            "con NVIDIA Nemotron) solo cobra sentido cuando resuelve un problema critico del mundo real. "
            "Al delegar en el agente la decision condicional de pago en PayPal segun la calidad fisica del "
            "producto, transformamos una inspeccion de calidad compleja en un motor de comercio confiable y "
            "libre de fraude."
        )

    def _fallback_answer(self, question: str) -> str:
        q = question.lower()
        founder_keywords = (
            "vision",
            "especial",
            "proposito",
            "product founder",
            "que hace",
            "qué hace",
            "que es",
            "qué es",
            "como funciona",
            "cómo funciona",
            "sistema",
            "proyecto",
            "affectent",
        )
        if any(keyword in q for keyword in founder_keywords):
            return self._founder_vision_answer()

        if "revenue" in q or "ventas" in q:
            return "## AnÃƒÂ¡lisis de Ventas\n\nBasado en el dashboard:\n\n- **Revenue Sandbox:** $128,430.00 (+12.5% vs periodo anterior)\n- **AOV:** $84.20\n- **Tasa de aprobaciÃƒÂ³n:** Alta gracias al Quality-Gated Settlement\n\n**RecomendaciÃƒÂ³n:** MantÃƒÂ©n el umbral de calidad >= 70 para maximizar aprobaciÃƒÂ³n sin incrementar riesgo."
        if "payout" in q or "pago" in q:
            return "## Estado de Liquidaciones\n\n- **Completados:** MayorÃƒÂ­a vÃƒÂ­a PayPal Orders API v2\n- **Pendientes:** $12,100.50 en revisiÃƒÂ³n\n- **Bloqueados:** Por debajo del umbral de calidad o flags de fraude\n\n**Tip:** Usa `X-Idempotency-Key` en `settle-and-dispatch` para evitar doble captura."
        if "riesgo" in q or "fraud" in q:
            return "## DetecciÃƒÂ³n de Riesgo\n\nEl sistema evalÃƒÂºa:\n- **Calidad** (<40 Ã¢â€ â€™ Alto riesgo)\n- **Monto** (> $5000 Ã¢â€ â€™ Flag)\n- **AnomalÃƒÂ­as de telemetrÃƒÂ­a**\n- **Velocidad de transacciones**\n\n**AcciÃƒÂ³n:** Transacciones con `risk_level: high` se bloquean automÃƒÂ¡ticamente."
        if "split" in q or "comisiÃƒÂ³n" in q:
            return "## Split Payments\n\nConfiguraciÃƒÂ³n actual: **5% plataforma / 95% vendedor**\n\nEjemplo $100.00:\n- ComisiÃƒÂ³n plataforma: **$5.00**\n- LiquidaciÃƒÂ³n vendedor: **$95.00**\n\nEl cÃƒÂ¡lculo es automÃƒÂ¡tico en `settle-and-dispatch`."
        return "## FinOps Assistant\n\nPuedo ayudarte con:\n- **Ãƒâ€œrdenes:** Estado, seguimiento, liquidaciÃƒÂ³n\n- **Finanzas:** Revenue, AOV, payouts pendientes\n- **Riesgo:** Fraude, calidad, anomalÃƒÂ­as\n- **Cumplimiento:** AuditorÃƒÂ­a, trazabilidad\n\nPrueba preguntando: *'Ã‚Â¿CÃƒÂ³mo va el revenue hoy?'* o *'Ã‚Â¿QuÃƒÂ© transacciones estÃƒÂ¡n en hold?'*"
