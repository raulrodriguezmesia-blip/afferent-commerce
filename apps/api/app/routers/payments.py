from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.physics_engine import resolve_material, tribological_report
from app.services.quality_agent import assess_quality
from app.services.email_dispatcher import send_audit_report_email
from app.routers.compliance_pdf import _generate_pdf, CompliancePDFReq
from app.core.idempotency import get_idempotent, set_idempotent
from app.core.errors import PaymentSettlementError, paypal_error_detail
import uuid
import datetime

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


class FraudFlags(BaseModel):
    risk_level: str
    risk_score: int
    flags: List[str]
    blocked: bool


class SettleAndDispatchRequest(BaseModel):
    object_label: str
    telemetry: Dict[str, Any] = {}
    recipient_email: str
    amount: float = 25.0
    platform_fee_percent: float = 5.0


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
        "created_at": datetime.datetime.now().isoformat(),
    }

    return {
        "order_id": order_id,
        "status": "CREATED",
        "checkout_url": "https://www.sandbox.paypal.com/checkoutnow?token=EC-%s" % order_id,
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

    qa = order.get("quality_assessment", {}) or {}
    quality_score = qa.get("safety_margin_percent", 0)
    if quality_score >= 50:
        order["status"] = "COMPLETED"
        order["payment_released"] = True
        return {"order_id": order_id, "status": "COMPLETED", "payment_released": True, "message": "Payment captured successfully"}
    else:
        order["status"] = "HELD"
        raise PaymentSettlementError(
            paypal_error_detail(
                {
                    "reason": "QUALITY_THRESHOLD_NOT_MET",
                    "safety_margin_percent": quality_score,
                    "threshold": 50,
                }
            )
        )


@router.post("/quality-assess", response_model=QualityAssessResponse)
async def quality_assess(payload: QualityAssessRequest):
    """AI quality assessment for tactile inspection."""
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
    resource = payload.get("resource", {}) or {}

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


def compute_fraud_flags(quality_score: int, amount: float, telemetry: Dict[str, Any]) -> FraudFlags:
    """Mock fraud detection for hackathon demo."""
    flags: List[str] = []
    risk_score = 0

    if quality_score < 40:
        flags.append("QUALITY_BELOW_THRESHOLD")
        risk_score += 40
    if amount > 5000:
        flags.append("HIGH_AMOUNT_TRANSACTION")
        risk_score += 20
    if telemetry.get("velocity_anomaly", False):
        flags.append("VELOCITY_ANOMALY")
        risk_score += 25
    if telemetry.get("device_mismatch", False):
        flags.append("DEVICE_FINGERPRINT_MISMATCH")
        risk_score += 15

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        risk_level = "high"
        blocked = True
    elif risk_score >= 40:
        risk_level = "medium"
        blocked = False
    else:
        risk_level = "low"
        blocked = False

    return FraudFlags(risk_level=risk_level, risk_score=risk_score, flags=flags, blocked=blocked)


def compute_split_payment(amount: float, platform_fee_percent: float) -> Dict[str, Any]:
    """Split payment between platform and merchant."""
    platform_fee = round(amount * (platform_fee_percent / 100), 2)
    merchant_amount = round(amount - platform_fee, 2)
    return {
        "total_amount": round(amount, 2),
        "platform_fee": platform_fee,
        "merchant_settlement": merchant_amount,
        "platform_fee_percent": platform_fee_percent,
        "currency": "USD",
    }


@router.post("/settle-and-dispatch")
async def settle_and_dispatch(
    payload: SettleAndDispatchRequest,
    x_idempotency_key: Optional[str] = Header(default=None, alias="X-Idempotency-Key"),
):
    """Full pipeline: quality assessment + fraud check + split payment + PDF + email."""
    try:
        # Idempotency check
        if x_idempotency_key:
            cached = get_idempotent(x_idempotency_key)
            if cached is not None:
                return cached

        # 1. Quality assessment
        quality_result = await assess_quality(payload.telemetry, payload.object_label)
        quality_score = quality_result["quality_score"]

        # 2. Fraud detection
        fraud = compute_fraud_flags(quality_score, float(payload.amount), payload.telemetry)
        if fraud.blocked:
            raise PaymentSettlementError(
                paypal_error_detail(
                    {
                        "reason": "FRAUD_HIGH_RISK",
                        "risk_score": fraud.risk_score,
                        "risk_level": fraud.risk_level,
                        "flags": fraud.flags,
                    }
                )
            )

        # 3. Determine payment action (quality-gated)
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        profile = resolve_material(payload.object_label)
        phys_report = tribological_report(profile, 1.1)

        force_budget = {
            "unit": "Newtons",
            "max_allowed_normal_force_N": round(profile["elastic_modulus_gpa"] * 0.01, 2),
            "recommended_grasp_force_N": 1.1,
            "minimum_slippage_threshold_N": phys_report["slip_threshold_n"],
            "force_budget_margin_percent": phys_report["safety_margin_percent"],
        }

        split = compute_split_payment(float(payload.amount), float(payload.platform_fee_percent))

        _orders[order_id] = {
            "order_id": order_id,
            "status": "CREATED",
            "total_amount": float(payload.amount),
            "currency": "USD",
            "items": [{"object_label": payload.object_label, "quantity": 1, "unit_price": float(payload.amount)}],
            "quality_assessment": phys_report,
            "force_budget": force_budget,
            "payment_released": False,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
            "quality_score": quality_score,
            "payment_action": quality_result["payment_action"],
            "fraud_flags": fraud.dict(),
            "split_payment": split,
        }

        if quality_score >= 70:
            _orders[order_id]["status"] = "COMPLETED"
            _orders[order_id]["payment_released"] = True
            payment_status = "RELEASED"
        elif quality_score >= 40:
            _orders[order_id]["status"] = "HELD"
            payment_status = "HELD"
            raise PaymentSettlementError(
                paypal_error_detail(
                    {
                        "reason": "QUALITY_HOLD_FOR_REVIEW",
                        "quality_score": quality_score,
                        "threshold_release": 70,
                        "threshold_hold": 40,
                    }
                )
            )
        else:
            _orders[order_id]["status"] = "REJECTED"
            payment_status = "REJECTED"
            raise PaymentSettlementError(
                paypal_error_detail(
                    {
                        "reason": "QUALITY_BELOW_THRESHOLD",
                        "quality_score": quality_score,
                        "threshold": 40,
                    }
                )
            )

        # 4. Generate PDF report
        pdf_payload = CompliancePDFReq(
            session_id=order_id,
            object_label=payload.object_label,
            force_budget=force_budget,
            neuromorphic_reflex=payload.telemetry.get("neuromorphic_reflex", {}) or {},
            tactile_reasoning_cot=payload.telemetry.get("tactile_reasoning_cot", {}) or {},
            benchmark_telemetry=payload.telemetry.get("benchmark_telemetry", {}) or {},
            material_profile=phys_report,
            acoustic_friction_profile=payload.telemetry.get("acoustic_friction_profile", {}) or {},
            multi_digit_topology=payload.telemetry.get("multi_digit_topology", {}) or {},
            nemotron_diagnosis=quality_result["nemotron_diagnosis"],
        )
        pdf_bytes = _generate_pdf(pdf_payload)

        # 5. Send email with PDF
        email_result = await send_audit_report_email(
            recipient_email=payload.recipient_email,
            pdf_bytes=pdf_bytes,
            order_id=order_id,
        )

        response = {
            "order_id": order_id,
            "status": payment_status,
            "quality_score": quality_score,
            "payment_action": quality_result["payment_action"],
            "nemotron_diagnosis": quality_result["nemotron_diagnosis"],
            "fraud_flags": fraud.dict(),
            "split_payment": split,
            "email_dispatch": email_result,
            "pdf_generated": True,
            "total_amount": float(payload.amount),
            "currency": "USD",
        }

        if x_idempotency_key:
            set_idempotent(x_idempotency_key, response)

        return response

    except PaymentSettlementError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Error interno del servidor: %s" % str(e),
                "provider_error": None,
            },
        )
