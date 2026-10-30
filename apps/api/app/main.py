from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import payments, stream, chat, infer, health

app = FastAPI(
    title="Afferent Commerce - Somatosensory Commerce API",
    description="Causal Vision-to-Touch Prior | Tactile Spatial Grid + Sim2Real Safety Shield + Closed-Loop WS Streaming + PayPal Agentic Commerce",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(infer.router)
app.include_router(stream.router)
app.include_router(chat.router)
app.include_router(payments.router)

@app.get("/")
async def root():
    return {
        "project": "Afferent Commerce",
        "system_status": "OPERATIONAL",
        "model_stack": ["Meta SAM 3.1", "Meta Muse Spark", "Meta Muse Wonder", "Meta Muse Image", "NVIDIA Nemotron"],
        "description": "Agentic Commerce for Quality Control — Tactile sensing + AI quality assessment + PayPal payment release",
        "tracks": ["Agentic Commerce", "Best Use of PayPal + AI", "Most Impactful", "Most Creative"],
    }

@app.get("/health")
async def health():
    return {"status": "online", "engine": "Afferent-Commerce-v1", "system": "operational"}
