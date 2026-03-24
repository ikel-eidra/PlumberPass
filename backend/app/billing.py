from __future__ import annotations

import hashlib
import hmac
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock
from typing import Any
from urllib import error, parse, request

_STATE_LOCK = Lock()
_DEFAULT_FRONTEND_URL = "https://plumberpass.futoltech.com"


def _utcnow() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _billing_state_path() -> Path:
    override = os.getenv("BILLING_ENTITLEMENTS_PATH")
    if override:
        return Path(override)
    return (
        Path(__file__).resolve().parent.parent
        / "data"
        / "billing"
        / "entitlements.json"
    )


def _ensure_state_path() -> Path:
    path = _billing_state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(
            json.dumps({"devices": {}, "sessions": {}}, indent=2), encoding="utf-8"
        )
    return path


def _load_state() -> dict[str, Any]:
    path = _ensure_state_path()
    with _STATE_LOCK:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            payload = {"devices": {}, "sessions": {}}
        payload.setdefault("devices", {})
        payload.setdefault("sessions", {})
        return payload


def _write_state(payload: dict[str, Any]) -> None:
    path = _ensure_state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(".tmp")
    with _STATE_LOCK:
        temp_path.write_text(
            json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8"
        )
        temp_path.replace(path)


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


def _price_label(currency: str, unit_amount: int) -> str:
    amount = unit_amount / 100
    currency_code = currency.upper()
    return f"{currency_code} {amount:,.2f} one-time unlock"


def _resolve_frontend_url(origin: str | None = None) -> str:
    configured = os.getenv("BILLING_FRONTEND_URL")
    if configured:
        return configured.rstrip("/")

    if origin and origin.startswith(("http://", "https://")):
        return origin.rstrip("/")

    return _DEFAULT_FRONTEND_URL


def get_billing_config(origin: str | None = None) -> dict[str, Any]:
    currency = os.getenv("STRIPE_PREMIUM_CURRENCY", "php").lower()
    unit_amount = _env_int("STRIPE_PREMIUM_UNIT_AMOUNT", 0)
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
    frontend_url = _resolve_frontend_url(origin)
    checkout_ready = bool(secret_key and unit_amount > 0)

    return {
        "provider": "stripe_checkout",
        "checkout_ready": checkout_ready,
        "webhook_ready": bool(checkout_ready and webhook_secret),
        "prototype_unlock_enabled": not checkout_ready,
        "billing_model": "one_time_unlock",
        "plan_label": os.getenv("STRIPE_PREMIUM_NAME", "PlumberPass Premium"),
        "plan_summary": os.getenv(
            "STRIPE_PREMIUM_DESCRIPTION",
            "One-time premium unlock for mock exams and figure drill.",
        ),
        "price_label": (
            _price_label(currency, unit_amount)
            if unit_amount > 0
            else "Set premium price"
        ),
        "currency": currency,
        "unit_amount": unit_amount,
        "premium_url": frontend_url,
        "payments_now": ["Debit card", "Credit card"],
        "payments_planned": ["GCash"],
        "payments_deferred": ["USDT"],
    }


def get_entitlement(device_id: str) -> dict[str, Any]:
    state = _load_state()
    device_record = state["devices"].get(device_id)
    if not device_record:
        return {
            "device_id": device_id,
            "tier": "free",
            "premium_active": False,
            "source": None,
            "granted_at": None,
            "checkout_session_id": None,
        }

    return {
        "device_id": device_id,
        "tier": device_record.get("tier", "free"),
        "premium_active": device_record.get("tier") == "premium",
        "source": device_record.get("source"),
        "granted_at": device_record.get("granted_at"),
        "checkout_session_id": device_record.get("checkout_session_id"),
    }


def _record_pending_session(
    session_id: str, device_id: str, gate: str | None = None
) -> None:
    state = _load_state()
    state["sessions"][session_id] = {
        "device_id": device_id,
        "gate": gate,
        "status": "open",
        "payment_status": "unpaid",
        "created_at": _utcnow(),
        "verified_at": None,
    }
    _write_state(state)


def _grant_premium(
    device_id: str,
    *,
    source: str,
    checkout_session_id: str | None = None,
    customer_email: str | None = None,
    payment_status: str | None = None,
) -> dict[str, Any]:
    state = _load_state()
    granted_at = _utcnow()
    state["devices"][device_id] = {
        "tier": "premium",
        "source": source,
        "granted_at": granted_at,
        "checkout_session_id": checkout_session_id,
        "customer_email": customer_email,
        "payment_status": payment_status,
        "last_verified_at": granted_at,
    }

    if checkout_session_id:
        session_record = state["sessions"].setdefault(checkout_session_id, {})
        session_record.update(
            {
                "device_id": device_id,
                "status": "complete",
                "payment_status": payment_status or "paid",
                "verified_at": granted_at,
            }
        )

    _write_state(state)
    return get_entitlement(device_id)


def _resolve_device_id(session_payload: dict[str, Any]) -> str | None:
    metadata = session_payload.get("metadata") or {}
    return metadata.get("device_id") or session_payload.get("client_reference_id")


def _stripe_request_json(
    method: str,
    path: str,
    *,
    data: dict[str, str] | None = None,
) -> dict[str, Any]:
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not secret_key:
        raise RuntimeError("Stripe billing is not configured.")

    url = f"https://api.stripe.com{path}"
    request_data: bytes | None = None
    if method.upper() == "GET" and data:
        url = f"{url}?{parse.urlencode(data, doseq=True)}"
    elif data:
        request_data = parse.urlencode(data, doseq=True).encode("utf-8")

    stripe_request = request.Request(
        url,
        data=request_data,
        method=method.upper(),
        headers={
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )

    try:
        with request.urlopen(stripe_request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        try:
            payload = json.loads(detail)
            message = payload.get("error", {}).get("message") or detail
        except json.JSONDecodeError:
            message = detail or exc.reason
        raise RuntimeError(message) from exc


def create_checkout_session(
    *,
    device_id: str,
    gate: str | None,
    origin: str | None,
    success_path: str | None = None,
    cancel_path: str | None = None,
) -> dict[str, Any]:
    config = get_billing_config(origin)
    if not config["checkout_ready"]:
        raise RuntimeError("Stripe billing is not configured.")

    frontend_url = _resolve_frontend_url(origin)
    success_target = (
        success_path or "/?checkout=success&session_id={CHECKOUT_SESSION_ID}"
    )
    cancel_target = cancel_path or "/?checkout=canceled"

    session_payload = _stripe_request_json(
        "POST",
        "/v1/checkout/sessions",
        data={
            "mode": "payment",
            "payment_method_types[0]": "card",
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": config["currency"],
            "line_items[0][price_data][unit_amount]": str(config["unit_amount"]),
            "line_items[0][price_data][product_data][name]": config["plan_label"],
            "line_items[0][price_data][product_data][description]": config[
                "plan_summary"
            ],
            "client_reference_id": device_id,
            "metadata[device_id]": device_id,
            "metadata[tier]": "premium",
            "metadata[gate]": gate or "premium",
            "success_url": f"{frontend_url}{success_target}",
            "cancel_url": f"{frontend_url}{cancel_target}",
        },
    )

    session_id = session_payload.get("id", "")
    if not session_id or not session_payload.get("url"):
        raise RuntimeError("Stripe did not return a hosted checkout URL.")

    _record_pending_session(session_id, device_id, gate)
    return {
        "session_id": session_id,
        "checkout_url": session_payload["url"],
    }


def verify_checkout_session(session_id: str, device_id: str) -> dict[str, Any]:
    session_payload = _stripe_request_json("GET", f"/v1/checkout/sessions/{session_id}")
    resolved_device_id = _resolve_device_id(session_payload)

    if resolved_device_id and resolved_device_id != device_id:
        raise RuntimeError("Checkout session does not match this device.")

    session_status = session_payload.get("status", "open")
    payment_status = session_payload.get("payment_status", "unpaid")

    if payment_status == "paid":
        entitlement = _grant_premium(
            device_id,
            source="stripe_checkout",
            checkout_session_id=session_id,
            customer_email=session_payload.get("customer_details", {}).get("email"),
            payment_status=payment_status,
        )
    else:
        entitlement = get_entitlement(device_id)

    entitlement.update(
        {
            "session_id": session_id,
            "session_status": session_status,
            "payment_status": payment_status,
            "granted_via": "session_verify" if payment_status == "paid" else None,
        }
    )
    return entitlement


def _parse_signature_header(signature_header: str) -> tuple[int, list[str]]:
    parts = {}
    for item in signature_header.split(","):
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        parts.setdefault(key.strip(), []).append(value.strip())

    timestamps = parts.get("t")
    signatures = parts.get("v1") or []
    if not timestamps or not signatures:
        raise RuntimeError("Invalid Stripe signature header.")

    try:
        timestamp = int(timestamps[0])
    except ValueError as exc:
        raise RuntimeError("Invalid Stripe signature timestamp.") from exc

    return timestamp, signatures


def parse_webhook_event(payload: bytes, signature_header: str) -> dict[str, Any]:
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise RuntimeError("Stripe webhook secret is not configured.")

    timestamp, signatures = _parse_signature_header(signature_header)
    signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode("utf-8")
    expected = hmac.new(
        secret.encode("utf-8"), signed_payload, hashlib.sha256
    ).hexdigest()

    if not any(hmac.compare_digest(expected, signature) for signature in signatures):
        raise RuntimeError("Invalid Stripe signature.")

    if abs(int(datetime.now(UTC).timestamp()) - timestamp) > 300:
        raise RuntimeError("Expired Stripe signature timestamp.")

    return json.loads(payload.decode("utf-8"))


def apply_webhook_event(event: dict[str, Any]) -> dict[str, Any]:
    event_type = event.get("type", "")
    session_payload = event.get("data", {}).get("object", {}) or {}
    device_id = _resolve_device_id(session_payload)
    session_id = session_payload.get("id")
    payment_status = session_payload.get("payment_status", "unpaid")

    if (
        event_type
        in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}
        and device_id
        and payment_status == "paid"
    ):
        entitlement = _grant_premium(
            device_id,
            source="stripe_webhook",
            checkout_session_id=session_id,
            customer_email=session_payload.get("customer_details", {}).get("email"),
            payment_status=payment_status,
        )
        return {
            "received": True,
            "event_type": event_type,
            "granted": entitlement["premium_active"],
            "device_id": device_id,
        }

    return {
        "received": True,
        "event_type": event_type,
        "granted": False,
        "device_id": device_id,
    }
