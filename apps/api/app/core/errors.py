from fastapi import HTTPException, status


class PaymentSettlementError(HTTPException):
    def __init__(self, detail: dict | str):
        if isinstance(detail, str):
            detail = {
                "code": "PAYMENT_SETTLEMENT_FAILED",
                "message": detail,
                "provider_error": None,
            }
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


def paypal_error_detail(error_response: any) -> dict:
    return {
        "code": "PAYMENT_SETTLEMENT_FAILED",
        "message": "La liquidación del pago falló debido a incumplimiento de calidad o error en el proveedor.",
        "provider_error": error_response,
    }
