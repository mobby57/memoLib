"""Tests US19 paiements Stripe (mode mock + webhook signature)."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import pytest

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Case, PaymentEvent
from routes import payments as payments_module
from routes.payments import router as payments_router


@pytest.fixture(autouse=True)
def _reset_admin_rate_limit_state(monkeypatch):
    monkeypatch.delenv("ADMIN_RATE_LIMIT_MAX", raising=False)
    monkeypatch.delenv("ADMIN_RATE_LIMIT_WINDOW_SECONDS", raising=False)
    payments_module._reset_admin_rate_limit_state()
    yield
    payments_module._reset_admin_rate_limit_state()


def _build_test_client() -> TestClient:
    app = FastAPI()
    app.include_router(payments_router)
    return TestClient(app)


def _build_test_client_with_memory_db() -> tuple[TestClient, sessionmaker]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI()
    app.include_router(payments_router)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[payments_module.get_db] = override_get_db
    return TestClient(app), TestingSessionLocal


def test_checkout_session_mock_when_secret_missing(monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    client = _build_test_client()
    response = client.post(
        "/api/payments/checkout-session",
        json={
            "case_reference": "CASE-2026-101",
            "amount_cents": 12900,
            "currency": "eur",
            "description": "Honoraires dossier contentieux",
            "success_url": "http://localhost:5000/payment/success",
            "cancel_url": "http://localhost:5000/payment/cancel",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["session_id"].startswith("cs_mock_")
    assert "mock_session_id=" in payload["checkout_url"]


def test_checkout_session_rejects_invalid_amount(monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    client = _build_test_client()
    response = client.post(
        "/api/payments/checkout-session",
        json={
            "case_reference": "CASE-2026-102",
            "amount_cents": 99,
            "currency": "eur",
            "description": "Montant trop bas",
            "success_url": "http://localhost:5000/payment/success",
            "cancel_url": "http://localhost:5000/payment/cancel",
        },
    )

    assert response.status_code == 422


def test_webhook_requires_signature_when_secret_configured(monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test_123")

    client = _build_test_client()
    response = client.post(
        "/api/payments/webhook",
        data=json.dumps({"type": "checkout.session.completed"}),
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Missing Stripe-Signature header"


def test_webhook_rejects_invalid_signature(monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test_123")

    client = _build_test_client()
    response = client.post(
        "/api/payments/webhook",
        data=json.dumps({"type": "checkout.session.completed"}),
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": "t=1700000000,v1=not-valid",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid Stripe signature"


def test_webhook_accepts_valid_signature(monkeypatch):
    secret = "whsec_test_abc"
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", secret)

    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_123",
                "payment_status": "paid",
            }
        },
    }
    payload_str = json.dumps(event, separators=(",", ":"))
    payload_bytes = payload_str.encode("utf-8")

    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    signature_header = f"t={timestamp},v1={signature}"

    client = _build_test_client()
    response = client.post(
        "/api/payments/webhook",
        data=payload_bytes,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": signature_header,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["received"] is True
    assert payload["verified"] is True
    assert payload["event_type"] == "checkout.session.completed"
    assert payload["session_id"] == "cs_test_123"
    assert payload["payment_status"] == "paid"


def test_payment_config_exposes_only_public_data(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_abc")
    monkeypatch.setenv("STRIPE_PUBLISHABLE_KEY", "pk_test_abc")

    client = _build_test_client()
    response = client.get("/api/payments/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["stripe_enabled"] is True
    assert payload["publishable_key"] == "pk_test_abc"
    assert "secret_key" not in payload


def test_confirm_updates_case_status_and_notes(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    db_case = Case(
        user_id=1,
        reference="CASE-2026-PAID-01",
        title="Dossier paiement",
        status="open",
        priority="normal",
    )
    db.add(db_case)
    db.commit()
    db.close()

    response = client.post(
        "/api/payments/confirm",
        json={
            "case_reference": "CASE-2026-PAID-01",
            "session_id": "cs_test_manual_01",
            "payment_status": "paid",
            "provider": "stripe",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["confirmed"] is True
    assert payload["new_status"] == "in_progress"

    db = SessionLocal()
    updated = db.query(Case).filter(Case.reference == "CASE-2026-PAID-01").first()
    assert updated is not None
    assert updated.status == "in_progress"
    assert updated.notes is not None
    assert "manual_confirm" in updated.notes
    db.close()


def test_webhook_paid_updates_case_when_reference_present(monkeypatch):
    secret = "whsec_update_case_test"
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", secret)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    db_case = Case(
        user_id=2,
        reference="CASE-2026-WEBHOOK-01",
        title="Dossier webhook",
        status="pending",
        priority="high",
    )
    db.add(db_case)
    db.commit()
    db.close()

    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_webhook_123",
                "payment_status": "paid",
                "metadata": {"case_reference": "CASE-2026-WEBHOOK-01"},
            }
        },
    }
    payload_str = json.dumps(event, separators=(",", ":"))
    payload_bytes = payload_str.encode("utf-8")

    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    signature_header = f"t={timestamp},v1={signature}"

    response = client.post(
        "/api/payments/webhook",
        data=payload_bytes,
        headers={"Content-Type": "application/json", "Stripe-Signature": signature_header},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["case_reference"] == "CASE-2026-WEBHOOK-01"
    assert body["case_updated"] is True

    db = SessionLocal()
    updated = db.query(Case).filter(Case.reference == "CASE-2026-WEBHOOK-01").first()
    assert updated is not None
    assert updated.status == "in_progress"
    assert updated.notes is not None
    assert "stripe_webhook" in updated.notes
    db.close()


def test_webhook_duplicate_event_id_is_ignored(monkeypatch):
    secret = "whsec_duplicate_test"
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", secret)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    db_case = Case(
        user_id=3,
        reference="CASE-2026-WEBHOOK-DUP",
        title="Dossier duplicate webhook",
        status="pending",
        priority="high",
    )
    db.add(db_case)
    db.commit()
    db.close()

    event = {
        "id": "evt_duplicate_001",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_webhook_dup_123",
                "payment_status": "paid",
                "metadata": {"case_reference": "CASE-2026-WEBHOOK-DUP"},
            }
        },
    }
    payload_str = json.dumps(event, separators=(",", ":"))
    payload_bytes = payload_str.encode("utf-8")
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    signature_header = f"t={timestamp},v1={signature}"

    first = client.post(
        "/api/payments/webhook",
        data=payload_bytes,
        headers={"Content-Type": "application/json", "Stripe-Signature": signature_header},
    )
    second = client.post(
        "/api/payments/webhook",
        data=payload_bytes,
        headers={"Content-Type": "application/json", "Stripe-Signature": signature_header},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["duplicate_event"] is False
    assert second.json()["duplicate_event"] is True
    assert second.json()["case_updated"] is False

    db = SessionLocal()
    updated = db.query(Case).filter(Case.reference == "CASE-2026-WEBHOOK-DUP").first()
    assert updated is not None
    webhook_events = (
        db.query(PaymentEvent)
        .filter(
            PaymentEvent.case_id == updated.id,
            PaymentEvent.source == "stripe_webhook",
            PaymentEvent.provider_event_id == "evt_duplicate_001",
        )
        .all()
    )
    assert len(webhook_events) == 1
    db.close()


def test_get_case_payment_events_returns_entries(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    db_case = Case(
        user_id=4,
        reference="CASE-2026-EVENTS-01",
        title="Dossier events",
        status="open",
        priority="normal",
    )
    db.add(db_case)
    db.commit()
    db.close()

    confirm = client.post(
        "/api/payments/confirm",
        json={
            "case_reference": "CASE-2026-EVENTS-01",
            "session_id": "cs_manual_events_01",
            "payment_status": "paid",
            "provider": "stripe",
        },
    )
    assert confirm.status_code == 200

    response = client.get("/api/payments/case/CASE-2026-EVENTS-01/events")
    assert response.status_code == 200
    payload = response.json()
    assert payload["case_reference"] == "CASE-2026-EVENTS-01"
    assert payload["total_events"] >= 1
    assert any(entry.get("source") == "manual_confirm" for entry in payload["payment_events"])
    assert any(entry.get("provider_session_id") == "cs_manual_events_01" for entry in payload["payment_events"])


def test_confirm_creates_payment_event_row(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    db_case = Case(
        user_id=5,
        reference="CASE-2026-EVENT-ROW-01",
        title="Dossier row",
        status="open",
        priority="normal",
    )
    db.add(db_case)
    db.commit()
    db.close()

    response = client.post(
        "/api/payments/confirm",
        json={
            "case_reference": "CASE-2026-EVENT-ROW-01",
            "session_id": "cs_manual_event_row_01",
            "payment_status": "paid",
            "provider": "stripe",
        },
    )
    assert response.status_code == 200

    db = SessionLocal()
    case = db.query(Case).filter(Case.reference == "CASE-2026-EVENT-ROW-01").first()
    assert case is not None
    evt = (
        db.query(PaymentEvent)
        .filter(PaymentEvent.case_id == case.id, PaymentEvent.source == "manual_confirm")
        .order_by(PaymentEvent.id.desc())
        .first()
    )
    assert evt is not None
    assert evt.provider_session_id == "cs_manual_event_row_01"
    assert evt.payment_status == "paid"
    db.close()


def test_list_payment_events_filters_by_provider_and_status(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    c1 = Case(user_id=10, reference="CASE-2026-LIST-01", title="A", status="open", priority="normal")
    c2 = Case(user_id=11, reference="CASE-2026-LIST-02", title="B", status="open", priority="normal")
    db.add(c1)
    db.add(c2)
    db.commit()

    e1 = PaymentEvent(
        case_id=c1.id,
        provider="stripe",
        source="manual_confirm",
        provider_event_id=None,
        provider_session_id="cs_1",
        payment_status="paid",
        payload_json='{"k":"v"}',
    )
    e2 = PaymentEvent(
        case_id=c2.id,
        provider="mock",
        source="manual_confirm",
        provider_event_id=None,
        provider_session_id="cs_2",
        payment_status="unpaid",
        payload_json='{"k":"v2"}',
    )
    db.add(e1)
    db.add(e2)
    db.commit()
    db.close()

    response = client.get("/api/payments/events?provider=stripe&payment_status=paid")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert len(payload["events"]) == 1
    assert payload["events"][0]["provider"] == "stripe"
    assert payload["events"][0]["payment_status"] == "paid"
    assert payload["events"][0]["case_reference"] == "CASE-2026-LIST-01"


def test_list_payment_events_supports_pagination(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=12, reference="CASE-2026-LIST-PAG", title="Pag", status="open", priority="normal")
    db.add(case)
    db.commit()

    for idx in range(5):
        db.add(
            PaymentEvent(
                case_id=case.id,
                provider="stripe",
                source="manual_confirm",
                provider_event_id=None,
                provider_session_id=f"cs_pag_{idx}",
                payment_status="paid",
                payload_json='{}',
            )
        )
    db.commit()
    db.close()

    response = client.get("/api/payments/events?case_reference=CASE-2026-LIST-PAG&limit=2&offset=1")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 5
    assert payload["limit"] == 2
    assert payload["offset"] == 1
    assert len(payload["events"]) == 2


def test_list_payment_events_requires_admin_key_when_configured(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "admin-secret-key")
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=20, reference="CASE-2026-SEC-01", title="Sec", status="open", priority="normal")
    db.add(case)
    db.commit()
    db.close()

    response = client.get("/api/payments/events")
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access denied"


def test_list_payment_events_accepts_admin_key_header(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "admin-secret-key")
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=21, reference="CASE-2026-SEC-02", title="Sec2", status="open", priority="normal")
    db.add(case)
    db.commit()

    db.add(
        PaymentEvent(
            case_id=case.id,
            provider="stripe",
            source="manual_confirm",
            provider_event_id=None,
            provider_session_id="cs_sec_01",
            payment_status="paid",
            payload_json='{}',
        )
    )
    db.commit()
    db.close()

    response = client.get("/api/payments/events", headers={"X-Admin-Key": "admin-secret-key"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1


def test_export_payment_events_csv_requires_admin_key_when_configured(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "admin-export-key")
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=30, reference="CASE-2026-CSV-01", title="CSV", status="open", priority="normal")
    db.add(case)
    db.commit()
    db.close()

    response = client.get("/api/payments/events/export.csv")
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access denied"


def test_export_payment_events_csv_returns_csv_content(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "admin-export-key")
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=31, reference="CASE-2026-CSV-02", title="CSV2", status="open", priority="normal")
    db.add(case)
    db.commit()

    db.add(
        PaymentEvent(
            case_id=case.id,
            provider="stripe",
            source="manual_confirm",
            provider_event_id="evt_csv_01",
            provider_session_id="cs_csv_01",
            payment_status="paid",
            payload_json='{}',
        )
    )
    db.commit()
    db.close()

    response = client.get(
        "/api/payments/events/export.csv?case_reference=CASE-2026-CSV-02",
        headers={"X-Admin-Key": "admin-export-key"},
    )

    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "attachment; filename=payment_events.csv" == response.headers.get("content-disposition")
    content = response.text
    assert "case_reference" in content
    assert "CASE-2026-CSV-02" in content
    assert "evt_csv_01" in content


def test_stats_payment_events_requires_admin_key_when_configured(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "stats-key-secret")
    client, _ = _build_test_client_with_memory_db()

    response = client.get("/api/payments/events/stats")
    assert response.status_code == 403

    response_ok = client.get("/api/payments/events/stats", headers={"X-Admin-Key": "stats-key-secret"})
    assert response_ok.status_code == 200


def test_stats_payment_events_returns_aggregates(monkeypatch):
    monkeypatch.delenv("ADMIN_API_KEY", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case = Case(user_id=42, reference="CASE-2026-STATS-01", title="Stats", status="open", priority="normal")
    db.add(case)
    db.commit()

    for evt_id, status_val, provider_val, source_val in [
        ("evt_s1", "paid", "stripe", "stripe_webhook"),
        ("evt_s2", "paid", "stripe", "manual_confirm"),
        ("evt_s3", "unpaid", "mock", "manual_confirm"),
    ]:
        db.add(
            PaymentEvent(
                case_id=case.id,
                provider=provider_val,
                source=source_val,
                provider_event_id=evt_id,
                payment_status=status_val,
                payload_json='{}',
            )
        )
    db.commit()
    db.close()

    response = client.get("/api/payments/events/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["by_status"]["paid"] == 2
    assert data["by_status"]["unpaid"] == 1
    assert data["by_provider"]["stripe"] == 2
    assert data["by_provider"]["mock"] == 1
    assert data["by_source"]["stripe_webhook"] == 1
    assert data["by_source"]["manual_confirm"] == 2


def test_stats_payment_events_applies_same_filters_as_listing(monkeypatch):
    monkeypatch.delenv("ADMIN_API_KEY", raising=False)
    client, SessionLocal = _build_test_client_with_memory_db()

    db = SessionLocal()
    case_a = Case(user_id=51, reference="CASE-2026-STATS-F1", title="Stats F1", status="open", priority="normal")
    case_b = Case(user_id=52, reference="CASE-2026-STATS-F2", title="Stats F2", status="open", priority="normal")
    db.add_all([case_a, case_b])
    db.commit()

    db.add_all(
        [
            PaymentEvent(
                case_id=case_a.id,
                provider="stripe",
                source="manual_confirm",
                provider_event_id="evt_stats_filter_1",
                payment_status="paid",
                payload_json='{}',
            ),
            PaymentEvent(
                case_id=case_a.id,
                provider="stripe",
                source="stripe_webhook",
                provider_event_id="evt_stats_filter_2",
                payment_status="paid",
                payload_json='{}',
            ),
            PaymentEvent(
                case_id=case_b.id,
                provider="mock",
                source="manual_confirm",
                provider_event_id="evt_stats_filter_3",
                payment_status="unpaid",
                payload_json='{}',
            ),
        ]
    )
    db.commit()
    db.close()

    response = client.get(
        "/api/payments/events/stats?case_reference=CASE-2026-STATS-F1&provider=stripe&payment_status=paid"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["by_status"] == {"paid": 2}
    assert data["by_provider"] == {"stripe": 2}
    assert data["by_source"]["manual_confirm"] == 1
    assert data["by_source"]["stripe_webhook"] == 1


def test_admin_payment_endpoints_are_rate_limited(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "admin-rate-key")
    monkeypatch.setenv("ADMIN_RATE_LIMIT_MAX", "2")
    monkeypatch.setenv("ADMIN_RATE_LIMIT_WINDOW_SECONDS", "60")
    client, _ = _build_test_client_with_memory_db()

    r1 = client.get("/api/payments/events/stats", headers={"X-Admin-Key": "admin-rate-key"})
    r2 = client.get("/api/payments/events/stats", headers={"X-Admin-Key": "admin-rate-key"})
    r3 = client.get("/api/payments/events/stats", headers={"X-Admin-Key": "admin-rate-key"})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 429
    assert r3.json()["detail"] == "Too many requests"
    assert r3.headers.get("retry-after") is not None
