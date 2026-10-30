from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.physics_engine import resolve_material, tribological_report
from app.services.quality_agent import assess_quality
import uuid

router = APIRouter(prefix="/api/v1", tags=["PayPal Payments & Agentic Commerce"])

# In-memory order store (replace with DB in production)
_orders: Dict[str, Dict[str, Any]] = {}


class CartItem(BaseModel):
    object_label: str
    quantity: int = 1
    unit_price: float
    image_base64: str = "dummy"

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    shipping_address: Dict[str, Any] = {}
    payment_method: str = "paypal"

class OrderResponse(BaseModel):
    order_id: str
    status: str
    checkout_url: str
    total_amount: float
    currency: str = "USD"
    quality_assessment: Optional[Dict[str, Any]] = None
    force_budget: Optional[Dict[str, Any]] = None

class OrderStatus(BaseModel):
    order_id: str
    status: str
    amount: float
    currency: str
    quality_assessment: Dict[str, Any]
    force_budget: Dict[str, Any]
    payment_released: bool = False

class QualityAssessRequest(BaseModel):
    object_label: str
    telemetry: Dict[str, Any] = {}

class QualityAssessResponse(BaseModel):
    quality_score: int
    passed: bool
    confidence: float
    nemotron_diagnosis: str
    telemetry_summary: Dict[str, Any]
    payment_action: str

@router.post("/orders", response_model=OrderResponse)
async def create_order(payload: CheckoutRequest):
    """Create a payment order with tactile quality assessment."""
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"

    first_item = payload.items[0]
    profile = resolve_material(first_item.object_label)
    phys_report = tribological_report(profile, 1.1)

    force_budget = {
        "unit": "Newtons",
        "max_allowed_normal_force_N": round(profile["elastic_modulus_gpa"] * 0.01, 2),
        "recommended_grasp_force_N": 1.1,
        "minimum_slippage_threshold_N": phys_report["slip_threshold_n"],
        "force_budget_margin_percent": phys_report["safety_margin_percent"],
    }

    total = sum(i.unit_price * i.quantity for i in payload.items)

    _orders[order_id] = {
        "order_id": order_id,
        "status": "CREATED",
        "total_amount": total,
        "currency": "USD",
        "items": [i.dict() for i in payload.items],
        "quality_assessment": phys_report,
        "force_budget": force_budget,
        "payment_released": False,
        "created_at": __import__("datetime").datetime.now().isoformat(),
    }

    return {
        "order_id": order_id,
        "status": "CREATED",
        "checkout_url": f"https://www.sandbox.paypal.com/checkoutnow?token=EC-{order_id}",
        "total_amount": total,
        "currency": "USD",
        "quality_assessment": phys_report,
        "force_budget": force_budget,
    }

@router.get("/orders/{order_id}", response_model=OrderStatus)
async def get_order_status(order_id: str):
    """Get order status and quality assessment."""
    order = _orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "order_id": order["order_id"],
        "status": order["status"],
        "amount": order["total_amount"],
        "currency": order["currency"],
        "quality_assessment": order["quality_assessment"],
        "force_budget": order["force_budget"],
        "payment_released": order["payment_released"],
    }

@router.post("/orders/{order_id}/capture")
async def capture_order(order_id: str):
    """Capture payment for an approved order (agentic release)."""
    order = _orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    qa = order.get("quality_assessment", {})
    quality_score = qa.get("safety_margin_percent", 0)
    if quality_score >= 50:
        order["status"] = "COMPLETED"
        order["payment_released"] = True
        return {"order_id": order_id, "status": "COMPLETED", "payment_released": True, "message": "Payment captured successfully"}
    else:
        order["status"] = "HELD"
        return {"order_id": order_id, "status": "HELD", "payment_released": False, "message": "Payment held: quality below threshold"}

@router.post("/quality-assess", response_model=QualityAssessResponse)
async def quality_assess(payload: QualityAssessRequest):
    """AI quality assessment for tactile inspection."""
    import asyncio
    result = await assess_quality(payload.telemetry, payload.object_label)
    quality_score = result["quality_score"]

    if quality_score >= 70:
        action = "RELEASE_PAYMENT"
    elif quality_score >= 40:
        action = "HOLD_FOR_REVIEW"
    else:
        action = "REJECT_AND_REFUND"

    return {
        "quality_score": quality_score,
        "passed": result["passed"],
        "confidence": result["confidence"],
        "nemotron_diagnosis": result["nemotron_diagnosis"],
        "telemetry_summary": result["telemetry_summary"],
        "payment_action": action,
    }

@router.post("/webhook")
async def paypal_webhook(payload: Dict[str, Any]):
    """Handle PayPal webhook notifications."""
    event_type = payload.get("event_type", "UNKNOWN")
    resource = payload.get("resource", {})

    return {
        "status": "received",
        "event_type": event_type,
        "resource_id": resource.get("id", ""),
        "processed": True,
    }

@router.get("/orders")
async def list_orders():
    """List all orders."""
    return {"orders": list(_orders.values())}
