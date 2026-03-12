"""Tests US19 paiements Stripe (mode mock + webhook signature)."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes.payments import router as payments_router


def _build_test_client() -> TestClient:
    app = FastAPI()
    app.include_router(payments_router)
    return TestClient(app)


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
