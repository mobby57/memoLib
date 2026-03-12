"""
Routes Paiement Stripe - US19
- Creation de session Checkout
- Webhook Stripe avec verification de signature
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import csv
import hashlib
import hmac
import io
import json
import os
import time
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Case, PaymentEvent

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
    event_id: Optional[str] = None
    case_reference: Optional[str] = None
    case_updated: bool = False
    duplicate_event: bool = False


class PaymentConfirmRequest(BaseModel):
    """Confirmation de paiement metier (retour success page)."""

    case_reference: str = Field(..., min_length=3, max_length=100)
    session_id: Optional[str] = Field(default=None, max_length=255)
    payment_status: str = Field(default="paid", min_length=2, max_length=30)
    provider: str = Field(default="stripe", min_length=2, max_length=30)


class PaymentConfirmResponse(BaseModel):
    """Resultat d'ecriture metier paiement."""

    confirmed: bool
    case_reference: str
    case_id: int
    previous_status: str
    new_status: str


class CasePaymentEventsResponse(BaseModel):
    """Historique des evenements paiement d'un dossier."""

    case_id: int
    case_reference: str
    total_events: int
    payment_events: list[Dict[str, Any]]


class PaymentEventItemResponse(BaseModel):
    """Item unitaire d'evenement paiement pour endpoint admin."""

    id: int
    case_id: int
    case_reference: str
    provider: str
    source: str
    provider_event_id: Optional[str] = None
    provider_session_id: Optional[str] = None
    payment_status: str
    created_at: Optional[str] = None


class PaymentEventsListResponse(BaseModel):
    """Reponse paginee du listing admin des evenements paiements."""

    total: int
    limit: int
    offset: int
    events: list[PaymentEventItemResponse]


def _stripe_secret_key() -> str:
    return os.getenv("STRIPE_SECRET_KEY", "").strip()


def _stripe_publishable_key() -> str:
    return os.getenv("STRIPE_PUBLISHABLE_KEY", "").strip()


def _stripe_webhook_secret() -> str:
    return os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()


def _admin_api_key() -> str:
    return os.getenv("ADMIN_API_KEY", "").strip()


def verify_admin_access(request: Request) -> None:
    """Protection admin par header X-Admin-Key quand ADMIN_API_KEY est configuree."""
    expected_key = _admin_api_key()
    if not expected_key:
        return

    provided_key = request.headers.get("x-admin-key", "")
    if not provided_key or not hmac.compare_digest(provided_key, expected_key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access denied")


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


def _append_payment_note(existing_note: Optional[str], payload: Dict[str, Any]) -> str:
    entries: list[Dict[str, Any]] = []

    if existing_note:
        try:
            parsed = json.loads(existing_note)
            if isinstance(parsed, list):
                entries = parsed
        except Exception:
            entries = [{"legacy_note": existing_note}]

    entries.append(payload)
    # Evite une croissance infinie dans le champ notes.
    entries = entries[-20:]
    return json.dumps(entries, ensure_ascii=True)


def _parse_payment_notes(notes: Optional[str]) -> list[Dict[str, Any]]:
    if not notes:
        return []
    try:
        parsed = json.loads(notes)
    except Exception:
        return []
    if isinstance(parsed, list):
        return [entry for entry in parsed if isinstance(entry, dict)]
    return []


def _case_contains_event(case: Case, event_id: str) -> bool:
    for entry in _parse_payment_notes(case.notes):
        if entry.get("event_id") == event_id:
            return True
    return False


def _has_payment_event_id(db: Session, provider_event_id: str) -> bool:
    existing = (
        db.query(PaymentEvent)
        .filter(PaymentEvent.provider_event_id == provider_event_id)
        .first()
    )
    return existing is not None


def _record_payment_event(
    db: Session,
    case_id: int,
    provider: str,
    source: str,
    payment_status: str,
    provider_event_id: Optional[str],
    provider_session_id: Optional[str],
    payload: Optional[Dict[str, Any]],
) -> bool:
    payload_json = json.dumps(payload, ensure_ascii=True) if payload is not None else None
    event_row = PaymentEvent(
        case_id=case_id,
        provider=provider,
        provider_event_id=provider_event_id,
        provider_session_id=provider_session_id,
        payment_status=payment_status,
        source=source,
        payload_json=payload_json,
    )

    db.add(event_row)
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False


def _apply_payment_on_case(
    db: Session,
    case_reference: str,
    provider: str,
    session_id: Optional[str],
    payment_status: str,
    source: str,
    event_id: Optional[str] = None,
) -> tuple[bool, Optional[Case], Optional[str]]:
    case = db.query(Case).filter(Case.reference == case_reference).first()
    if not case:
        return False, None, None

    previous_status = case.status

    if payment_status == "paid":
        if case.status in {"open", "pending"}:
            case.status = "in_progress"
    elif payment_status in {"unpaid", "no_payment_required"}:
        pass

    note_payload = {
        "ts_utc": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "provider": provider,
        "payment_status": payment_status,
        "session_id": session_id,
        "event_id": event_id,
        "previous_status": previous_status,
        "new_status": case.status,
    }
    case.notes = _append_payment_note(case.notes, note_payload)
    case.updated_at = datetime.utcnow()

    db.add(case)
    db.commit()
    db.refresh(case)
    return True, case, previous_status


def _build_payment_events_query(
    db: Session,
    case_reference: Optional[str],
    provider: Optional[str],
    payment_status: Optional[str],
    source: Optional[str],
    created_from: Optional[datetime],
    created_to: Optional[datetime],
):
    query = db.query(PaymentEvent, Case.reference).join(Case, PaymentEvent.case_id == Case.id)

    if case_reference:
        query = query.filter(Case.reference == case_reference)
    if provider:
        query = query.filter(PaymentEvent.provider == provider)
    if payment_status:
        query = query.filter(PaymentEvent.payment_status == payment_status)
    if source:
        query = query.filter(PaymentEvent.source == source)
    if created_from:
        query = query.filter(PaymentEvent.created_at >= created_from)
    if created_to:
        query = query.filter(PaymentEvent.created_at <= created_to)

    return query


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
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> WebhookProcessResponse:
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
    event_id = event_payload.get("id")
    event_data = event_payload.get("data", {}).get("object", {})

    session_id = event_data.get("id")
    payment_status = event_data.get("payment_status") or event_data.get("status")
    metadata = event_data.get("metadata", {}) if isinstance(event_data, dict) else {}
    case_reference = metadata.get("case_reference") if isinstance(metadata, dict) else None

    case_updated = False
    duplicate_event = False
    if event_type == "checkout.session.completed" and payment_status == "paid" and case_reference:
        case = db.query(Case).filter(Case.reference == case_reference).first()
        if case and event_id and _has_payment_event_id(db, event_id):
            duplicate_event = True
        elif case:
            case_updated, _, _ = _apply_payment_on_case(
                db=db,
                case_reference=case_reference,
                provider="stripe",
                session_id=session_id,
                payment_status=payment_status,
                source="stripe_webhook",
                event_id=event_id,
            )
            created = _record_payment_event(
                db=db,
                case_id=case.id,
                provider="stripe",
                source="stripe_webhook",
                payment_status=payment_status,
                provider_event_id=event_id,
                provider_session_id=session_id,
                payload=event_payload,
            )
            if not created and event_id:
                duplicate_event = True
                case_updated = False

    return WebhookProcessResponse(
        received=True,
        verified=verified,
        event_type=event_type,
        payment_status=payment_status,
        session_id=session_id,
        event_id=event_id,
        case_reference=case_reference,
        case_updated=case_updated,
        duplicate_event=duplicate_event,
    )


@router.get("/case/{case_reference}/events", response_model=CasePaymentEventsResponse, status_code=status.HTTP_200_OK)
async def get_case_payment_events(case_reference: str, db: Session = Depends(get_db)) -> CasePaymentEventsResponse:
    """Retourne les evenements paiement persistes pour un dossier."""

    case = db.query(Case).filter(Case.reference == case_reference).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    rows = (
        db.query(PaymentEvent)
        .filter(PaymentEvent.case_id == case.id)
        .order_by(PaymentEvent.created_at.desc(), PaymentEvent.id.desc())
        .all()
    )

    payment_entries = []
    for row in rows:
        parsed_payload = None
        if row.payload_json:
            try:
                parsed_payload = json.loads(row.payload_json)
            except Exception:
                parsed_payload = None
        payment_entries.append(
            {
                "id": row.id,
                "provider": row.provider,
                "source": row.source,
                "provider_event_id": row.provider_event_id,
                "provider_session_id": row.provider_session_id,
                "payment_status": row.payment_status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "payload": parsed_payload,
            }
        )

    return CasePaymentEventsResponse(
        case_id=case.id,
        case_reference=case.reference,
        total_events=len(payment_entries),
        payment_events=payment_entries,
    )


@router.get("/events", response_model=PaymentEventsListResponse, status_code=status.HTTP_200_OK)
async def list_payment_events(
    request: Request,
    db: Session = Depends(get_db),
    case_reference: Optional[str] = Query(default=None, min_length=2, max_length=100),
    provider: Optional[str] = Query(default=None, min_length=2, max_length=30),
    payment_status: Optional[str] = Query(default=None, min_length=2, max_length=30),
    source: Optional[str] = Query(default=None, min_length=2, max_length=50),
    created_from: Optional[datetime] = Query(default=None),
    created_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> PaymentEventsListResponse:
    """Listing admin des evenements paiements avec filtres et pagination."""

    verify_admin_access(request)

    base_query = _build_payment_events_query(
        db=db,
        case_reference=case_reference,
        provider=provider,
        payment_status=payment_status,
        source=source,
        created_from=created_from,
        created_to=created_to,
    )

    total = base_query.count()
    rows = (
        base_query.order_by(PaymentEvent.created_at.desc(), PaymentEvent.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        PaymentEventItemResponse(
            id=row[0].id,
            case_id=row[0].case_id,
            case_reference=row[1],
            provider=row[0].provider,
            source=row[0].source,
            provider_event_id=row[0].provider_event_id,
            provider_session_id=row[0].provider_session_id,
            payment_status=row[0].payment_status,
            created_at=row[0].created_at.isoformat() if row[0].created_at else None,
        )
        for row in rows
    ]

    return PaymentEventsListResponse(total=total, limit=limit, offset=offset, events=items)


@router.get("/events/export.csv", status_code=status.HTTP_200_OK)
async def export_payment_events_csv(
    request: Request,
    db: Session = Depends(get_db),
    case_reference: Optional[str] = Query(default=None, min_length=2, max_length=100),
    provider: Optional[str] = Query(default=None, min_length=2, max_length=30),
    payment_status: Optional[str] = Query(default=None, min_length=2, max_length=30),
    source: Optional[str] = Query(default=None, min_length=2, max_length=50),
    created_from: Optional[datetime] = Query(default=None),
    created_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    """Export CSV admin des evenements paiements avec filtres."""

    verify_admin_access(request)

    query = _build_payment_events_query(
        db=db,
        case_reference=case_reference,
        provider=provider,
        payment_status=payment_status,
        source=source,
        created_from=created_from,
        created_to=created_to,
    )

    rows = (
        query.order_by(PaymentEvent.created_at.desc(), PaymentEvent.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "case_id",
            "case_reference",
            "provider",
            "source",
            "provider_event_id",
            "provider_session_id",
            "payment_status",
            "created_at",
        ]
    )

    for row in rows:
        event, case_ref = row
        writer.writerow(
            [
                event.id,
                event.case_id,
                case_ref,
                event.provider,
                event.source,
                event.provider_event_id or "",
                event.provider_session_id or "",
                event.payment_status,
                event.created_at.isoformat() if event.created_at else "",
            ]
        )

    csv_content = buffer.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payment_events.csv"},
    )


@router.post("/confirm", response_model=PaymentConfirmResponse, status_code=status.HTTP_200_OK)
async def confirm_payment(request: PaymentConfirmRequest, db: Session = Depends(get_db)) -> PaymentConfirmResponse:
    """Confirme un paiement cote metier (fallback en cas de webhook non recu)."""

    updated, case, previous_status = _apply_payment_on_case(
        db=db,
        case_reference=request.case_reference,
        provider=request.provider,
        session_id=request.session_id,
        payment_status=request.payment_status,
        source="manual_confirm",
        event_id=None,
    )

    if not updated or not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    _record_payment_event(
        db=db,
        case_id=case.id,
        provider=request.provider,
        source="manual_confirm",
        payment_status=request.payment_status,
        provider_event_id=None,
        provider_session_id=request.session_id,
        payload={
            "case_reference": request.case_reference,
            "payment_status": request.payment_status,
            "provider": request.provider,
        },
    )

    return PaymentConfirmResponse(
        confirmed=True,
        case_reference=case.reference,
        case_id=case.id,
        previous_status=previous_status or case.status,
        new_status=case.status,
    )
