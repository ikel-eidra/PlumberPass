import hashlib
import hmac
import json
from pathlib import Path
import sys
import time

from fastapi.testclient import TestClient


sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app import billing  # noqa: E402
from app.main import app  # noqa: E402


client = TestClient(app)


def _billing_path(tmp_path: Path) -> Path:
    return tmp_path / "billing" / "entitlements.json"


def _set_billing_env(monkeypatch, tmp_path: Path) -> Path:
    state_path = _billing_path(tmp_path)
    monkeypatch.setenv("BILLING_ENTITLEMENTS_PATH", str(state_path))
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_example")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test_example")
    monkeypatch.setenv("STRIPE_PREMIUM_UNIT_AMOUNT", "149900")
    monkeypatch.setenv("BILLING_FRONTEND_URL", "https://plumberpass.futoltech.com")
    return state_path


def test_billing_config_is_safe_when_checkout_is_not_configured(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("BILLING_ENTITLEMENTS_PATH", str(_billing_path(tmp_path)))
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)

    response = client.get("/api/v1/billing/config")

    assert response.status_code == 200
    payload = response.json()
    assert payload["checkout_ready"] is False
    assert payload["prototype_unlock_enabled"] is True
    assert payload["billing_model"] == "one_time_unlock"


def test_checkout_session_creation_records_pending_session(monkeypatch, tmp_path: Path):
    state_path = _set_billing_env(monkeypatch, tmp_path)

    def fake_stripe_request(method: str, path: str, data: dict[str, str] | None = None):
        assert method == "POST"
        assert path == "/v1/checkout/sessions"
        assert data is not None
        assert data["payment_method_types[0]"] == "card"
        assert data["metadata[device_id]"] == "device-123456"
        return {
            "id": "cs_test_pending",
            "url": "https://checkout.stripe.com/c/pay/cs_test_pending",
        }

    monkeypatch.setattr(billing, "_stripe_request_json", fake_stripe_request)

    response = client.post(
        "/api/v1/billing/create-checkout-session",
        json={"device_id": "device-123456", "gate": "mock"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["session_id"] == "cs_test_pending"
    assert payload["checkout_url"].startswith("https://checkout.stripe.com/")

    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["sessions"]["cs_test_pending"]["device_id"] == "device-123456"
    assert state["sessions"]["cs_test_pending"]["gate"] == "mock"


def test_checkout_verification_grants_premium_entitlement(monkeypatch, tmp_path: Path):
    _set_billing_env(monkeypatch, tmp_path)

    def fake_stripe_request(method: str, path: str, data: dict[str, str] | None = None):
        assert method == "GET"
        assert path == "/v1/checkout/sessions/cs_paid_live"
        return {
            "id": "cs_paid_live",
            "status": "complete",
            "payment_status": "paid",
            "metadata": {"device_id": "device-abcdef"},
            "customer_details": {"email": "reviewer@example.com"},
        }

    monkeypatch.setattr(billing, "_stripe_request_json", fake_stripe_request)

    response = client.post(
        "/api/v1/billing/verify-checkout-session",
        json={"session_id": "cs_paid_live", "device_id": "device-abcdef"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["premium_active"] is True
    assert payload["tier"] == "premium"
    assert payload["payment_status"] == "paid"

    entitlement = client.get("/api/v1/billing/entitlement/device-abcdef")
    assert entitlement.status_code == 200
    assert entitlement.json()["premium_active"] is True
    assert entitlement.json()["source"] == "stripe_checkout"


def test_webhook_grants_premium_when_signature_is_valid(monkeypatch, tmp_path: Path):
    _set_billing_env(monkeypatch, tmp_path)
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_webhook_paid",
                "payment_status": "paid",
                "metadata": {"device_id": "device-webhook"},
                "customer_details": {"email": "webhook@example.com"},
            }
        },
    }
    payload = json.dumps(event)
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload}".encode("utf-8")
    signature = hmac.new(
        b"whsec_test_example",
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    response = client.post(
        "/api/v1/billing/webhook",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Stripe-Signature": f"t={timestamp},v1={signature}",
        },
    )

    assert response.status_code == 200
    assert response.json()["granted"] is True

    entitlement = client.get("/api/v1/billing/entitlement/device-webhook")
    assert entitlement.status_code == 200
    assert entitlement.json()["premium_active"] is True
    assert entitlement.json()["source"] == "stripe_webhook"
