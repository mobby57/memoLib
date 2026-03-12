"""
Routes Paiement Stripe - US19
- Creation de session Checkout
- Webhook Stripe avec verification de signature
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import hashlib
import hmac
import os
import time
import uuid

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/api/payments", tags=["payments"])


class CheckoutSessionRequest(BaseModel):
    """Payload de creation d'une session de paiement."""

    case_reference: str = Field(..., min_length=3, max_length=100)
    amount_cents: int = Field(..., ge=100, le=2_000_000)
    currency: str = Field(default="eur", min_length=3, max_length=3)
    description: str = Field(default="Honoraires juridiques MemoLib", min_length=3, max_length=500)
    success_url: str = Field(default="http://localhost:5000/payment/success")
    cancel_url: str = Field(default="http://localhost:5000/payment/cancel")
    customer_email: Optional[EmailStr] = None


class CheckoutSessionResponse(BaseModel):
    """Reponse de creation d'une session checkout."""

    session_id: str
    checkout_url: str
    provider: str
    status: str
    created_at: datetime


class WebhookProcessResponse(BaseModel):
    """Reponse normalisee du traitement webhook."""

    received: bool
    verified: bool
    event_type: Optional[str] = None
    payment_status: Optional[str] = None
    session_id: Optional[str] = None


def _stripe_secret_key() -> str:
    return os.getenv("STRIPE_SECRET_KEY", "").strip()


def _stripe_publishable_key() -> str:
    return os.getenv("STRIPE_PUBLISHABLE_KEY", "").strip()


def _stripe_webhook_secret() -> str:
    return os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()


def _build_mock_checkout_url(success_url: str, session_id: str) -> str:
    separator = "&" if "?" in success_url else "?"
    return f"{success_url}{separator}mock_session_id={session_id}"


def _parse_signature_header(signature_header: str) -> Dict[str, str]:
    parsed: Dict[str, str] = {}
    for part in signature_header.split(","):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        parsed[key.strip()] = value.strip()
    return parsed


def _verify_webhook_signature(payload: bytes, signature_header: str, webhook_secret: str) -> bool:
    parsed = _parse_signature_header(signature_header)
    timestamp_raw = parsed.get("t")
    signature_v1 = parsed.get("v1")

    if not timestamp_raw or not signature_v1:
        return False

    try:
        timestamp_value = int(timestamp_raw)
    except ValueError:
        return False

    tolerance_seconds = 5 * 60
    now = int(time.time())
    if abs(now - timestamp_value) > tolerance_seconds:
        return False

    signed_payload = f"{timestamp_raw}.".encode("utf-8") + payload
    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature_v1)


async def _create_real_stripe_session(request: CheckoutSessionRequest, secret_key: str) -> CheckoutSessionResponse:
    data: Dict[str, Any] = {
        "mode": "payment",
        "success_url": request.success_url,
        "cancel_url": request.cancel_url,
        "line_items[0][quantity]": 1,
        "line_items[0][price_data][currency]": request.currency.lower(),
        "line_items[0][price_data][unit_amount]": request.amount_cents,
        "line_items[0][price_data][product_data][name]": request.description,
        "metadata[case_reference]": request.case_reference,
        "metadata[source]": "memolib-us19",
    }

    if request.customer_email:
        data["customer_email"] = request.customer_email

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://api.stripe.com/v1/checkout/sessions",
            data=data,
            headers=headers,
        )

    if response.status_code >= 400:
        detail = "Stripe checkout session creation failed"
        try:
            error_payload = response.json()
            stripe_error = error_payload.get("error", {}).get("message")
            if stripe_error:
                detail = stripe_error
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)

    payload = response.json()
    session_id = payload.get("id")
    checkout_url = payload.get("url")

    if not session_id or not checkout_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe response missing id/url",
        )

    return CheckoutSessionResponse(
        session_id=session_id,
        checkout_url=checkout_url,
        provider="stripe",
        status="created",
        created_at=datetime.now(timezone.utc),
    )


@router.get("/config", status_code=status.HTTP_200_OK)
async def get_payment_config() -> Dict[str, Any]:
    """Expose uniquement les infos publiques necessaires au frontend."""

    publishable_key = _stripe_publishable_key()
    return {
        "stripe_enabled": bool(_stripe_secret_key()),
        "publishable_key": publishable_key,
        "mode": "live_or_test" if publishable_key else "mock",
    }


@router.post(
    "/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_200_OK,
)
async def create_checkout_session(request: CheckoutSessionRequest) -> CheckoutSessionResponse:
    """
    Cree une session Stripe Checkout.

    - Si STRIPE_SECRET_KEY est configure: appel Stripe API.
    - Sinon: fallback mock pour dev local.
    """

    secret_key = _stripe_secret_key()
    if secret_key:
        return await _create_real_stripe_session(request, secret_key)

    mock_session_id = f"cs_mock_{uuid.uuid4().hex[:24]}"
    return CheckoutSessionResponse(
        session_id=mock_session_id,
        checkout_url=_build_mock_checkout_url(request.success_url, mock_session_id),
        provider="mock",
        status="created",
        created_at=datetime.now(timezone.utc),
    )


@router.post("/webhook", response_model=WebhookProcessResponse, status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request) -> WebhookProcessResponse:
    """Traite les webhooks Stripe et verifie la signature si secret configure."""

    payload = await request.body()
    signature_header = request.headers.get("stripe-signature", "")
    webhook_secret = _stripe_webhook_secret()

    verified = False
    if webhook_secret:
        if not signature_header:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe-Signature header")
        verified = _verify_webhook_signature(payload, signature_header, webhook_secret)
        if not verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature")
    else:
        # Mode developpement local: pas de verification si secret absent
        verified = False

    try:
        event_payload = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event_type = event_payload.get("type")
    event_data = event_payload.get("data", {}).get("object", {})

    session_id = event_data.get("id")
    payment_status = event_data.get("payment_status") or event_data.get("status")

    # Ici on ferait la persistence en base + idempotence event_id + audit log.
    return WebhookProcessResponse(
        received=True,
        verified=verified,
        event_type=event_type,
        payment_status=payment_status,
        session_id=session_id,
    )
