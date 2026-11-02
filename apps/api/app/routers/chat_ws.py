from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
from app.services.ai_assistant import FinOpsAssistant

router = APIRouter()
assistant = FinOpsAssistant()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))


manager = ConnectionManager()


@router.websocket("/ws/finops-assistant")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await manager.send_personal_message(
        {
            "role": "assistant",
            "content": "¡Hola! Soy tu **FinOps Assistant** impulsado por NVIDIA Nemotron. Puedo analizar tus órdenes, métricas de ventas, riesgos de pago y recomendaciones financieras. ¿En qué puedo ayudarte?",
            "type": "message",
        },
        websocket,
    )

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_msg = payload.get("message", "")

            await manager.send_personal_message(
                {"role": "assistant", "content": "typing...", "type": "typing"},
                websocket,
            )

            await asyncio.sleep(0.8)

            response = await assistant.answer(user_msg)

            await manager.send_personal_message(
                {"role": "assistant", "content": response, "type": "message"},
                websocket,
            )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
