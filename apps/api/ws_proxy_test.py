import asyncio, json, websockets
async def main():
    async with websockets.connect("ws://127.0.0.1:8000/ws/finops-assistant") as ws:
        print("WELCOME:", await ws.recv())
        await ws.send(json.dumps({"message": "¿Qué hace especial a Afferent Commerce?"}))
        print("TYPING:", await ws.recv())
        print("RESPONSE:", await ws.recv())
asyncio.run(main())
