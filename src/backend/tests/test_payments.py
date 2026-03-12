"""Tests US19 paiements Stripe (mode mock + webhook signature)."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Case
from routes import payments as payments_module
from routes.payments import router as payments_router


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
