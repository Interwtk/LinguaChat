"""Prepared Premium entitlements (app/billing/entitlements.py): signature, idempotency, states.

Inactive by design: these tests also assert that no route exposes billing yet.
"""
import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

import pytest

from app.billing.entitlements import Entitlement, WebhookVerificationError, apply_event, verify_standard_webhook
from main import app

SECRET = "whsec_" + base64.b64encode(b"test-only-secret-not-real").decode()
T0 = datetime(2026, 11, 15, tzinfo=timezone.utc)
PRODUCTS = {"premium_monthly"}


def sign(body: bytes, msg_id="msg_1", ts=None):
    ts = int(ts if ts is not None else T0.timestamp())
    key = base64.b64decode(SECRET[len("whsec_"):])
    sig = base64.b64encode(hmac.new(key, f"{msg_id}.{ts}.".encode() + body, hashlib.sha256).digest()).decode()
    return {"webhook-id": msg_id, "webhook-timestamp": str(ts), "webhook-signature": f"v1,{sig}"}


def test_valid_signature_passes():
    body = json.dumps({"type": "subscription.active"}).encode()
    verify_standard_webhook(SECRET, sign(body), body, now=T0.timestamp())


@pytest.mark.parametrize("mutate", [
    lambda h, b: (h, b + b" "),                                         # body changed
    lambda h, b: ({**h, "webhook-signature": "v1,AAAA"}, b),            # wrong signature
    lambda h, b: ({k: v for k, v in h.items() if k != "webhook-id"}, b),  # missing header
    lambda h, b: ({**h, "webhook-timestamp": str(int(T0.timestamp()) - 3600)}, b),  # replay outside window
])
def test_tampered_or_stale_webhooks_are_rejected(mutate):
    body = json.dumps({"type": "subscription.active"}).encode()
    headers, payload = mutate(sign(body), body)
    with pytest.raises(WebhookVerificationError):
        verify_standard_webhook(SECRET, headers, payload, now=T0.timestamp())


def ev(i, kind, minutes=0, **extra):
    return {"id": f"evt_{i}", "type": kind, "occurred_at": T0 + timedelta(minutes=minutes), "product": "premium_monthly", **extra}


def test_lifecycle_cancel_keeps_access_until_period_end():
    e = Entitlement("user-1")
    end = T0 + timedelta(days=30)
    e = apply_event(e, ev(1, "subscription.active", period_end=end), known_products=PRODUCTS)
    assert e.has_access(T0 + timedelta(days=1))
    e = apply_event(e, ev(2, "subscription.canceled", 10), known_products=PRODUCTS)
    assert e.state == "canceled_at_period_end" and e.has_access(T0 + timedelta(days=29))
    assert not e.has_access(T0 + timedelta(days=31))


def test_refund_and_revoke_end_access():
    e = apply_event(Entitlement("u"), ev(1, "subscription.active", period_end=T0 + timedelta(days=30)), known_products=PRODUCTS)
    assert not apply_event(e, ev(2, "order.refunded", 5), known_products=PRODUCTS).has_access(T0 + timedelta(days=1))
    assert not apply_event(e, ev(3, "subscription.revoked", 5), known_products=PRODUCTS).has_access(T0 + timedelta(days=1))


def test_duplicate_and_out_of_order_events_change_nothing():
    e = apply_event(Entitlement("u"), ev(1, "subscription.active", 10, period_end=T0 + timedelta(days=30)), known_products=PRODUCTS)
    again = apply_event(e, ev(1, "subscription.revoked", 20), known_products=PRODUCTS)
    assert again.state == "active"                      # same id: applied once
    late = apply_event(e, ev(2, "subscription.revoked", 0), known_products=PRODUCTS)
    assert late.state == "active"                       # older than the last applied event


def test_unknown_product_or_event_grants_nothing():
    assert apply_event(Entitlement("u"), ev(1, "subscription.active", product="something_else"), known_products=PRODUCTS).state == "none"
    assert apply_event(Entitlement("u"), ev(2, "checkout.created"), known_products=PRODUCTS).state == "none"


def test_billing_is_not_exposed_by_any_route():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert not any("billing" in p or "webhook" in p or "entitlement" in p for p in paths)
