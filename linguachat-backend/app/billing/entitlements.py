"""Premium entitlements — prepared, NOT active.

Nothing here is wired into the app: no route is registered, no provider is
called, no secret exists. It is the server-side core that a future paid plan
would use, written now so it can be reviewed and tested before any money moves
(docs/business/monetization-plan.md §6).

Principles:
  * the browser never decides who is Premium;
  * state changes only from provider events whose signature verifies;
  * every event is applied at most once (idempotent by event id), and late or
    out-of-order events cannot move a subscription backwards in time;
  * cancelling keeps access until the paid period ends; a refund or a revoked
    subscription ends it; nothing here touches learning data.

`verify_standard_webhook` implements the Standard Webhooks scheme that Polar
uses (headers webhook-id / webhook-timestamp / webhook-signature, HMAC-SHA256
over "id.timestamp.body", secret prefixed "whsec_" and base64-encoded).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone

TOLERANCE_SECONDS = 300

ACTIVE_STATES = {"active", "trialing", "past_due_grace", "canceled_at_period_end"}


class WebhookVerificationError(ValueError):
    pass


def verify_standard_webhook(secret: str, headers: dict, body: bytes, now: float | None = None) -> None:
    """Raise unless the payload was signed with `secret` within the tolerance window."""
    h = {str(k).lower(): v for k, v in (headers or {}).items()}
    msg_id, timestamp, signatures = h.get("webhook-id"), h.get("webhook-timestamp"), h.get("webhook-signature")
    if not (msg_id and timestamp and signatures):
        raise WebhookVerificationError("missing headers")
    try:
        ts = int(timestamp)
    except (TypeError, ValueError) as exc:
        raise WebhookVerificationError("bad timestamp") from exc
    current = now if now is not None else datetime.now(timezone.utc).timestamp()
    if abs(current - ts) > TOLERANCE_SECONDS:
        raise WebhookVerificationError("timestamp outside tolerance")
    key = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        raw_key = base64.b64decode(key)
    except Exception as exc:  # noqa: BLE001 - any malformed secret is a configuration error
        raise WebhookVerificationError("bad secret") from exc
    signed = f"{msg_id}.{ts}.".encode() + body
    expected = base64.b64encode(hmac.new(raw_key, signed, hashlib.sha256).digest()).decode()
    for candidate in str(signatures).split():
        version, _, value = candidate.partition(",")
        if version == "v1" and hmac.compare_digest(value, expected):
            return
    raise WebhookVerificationError("signature mismatch")


@dataclass(frozen=True)
class Entitlement:
    user_id: str
    state: str = "none"                     # none | active | trialing | past_due_grace | canceled_at_period_end | expired | refunded | revoked
    product: str | None = None
    period_end: datetime | None = None
    last_event_at: datetime | None = None
    applied_event_ids: frozenset = field(default_factory=frozenset)

    def has_access(self, now: datetime) -> bool:
        if self.state not in ACTIVE_STATES:
            return False
        return self.period_end is None or now < self.period_end


# provider event type → resulting state (Polar names; Paddle maps onto the same set)
TRANSITIONS = {
    "subscription.created": "active",
    "subscription.active": "active",
    "subscription.uncanceled": "active",
    "subscription.updated": None,            # keeps state, refreshes period/product
    "subscription.past_due": "past_due_grace",
    "subscription.canceled": "canceled_at_period_end",
    "subscription.revoked": "revoked",
    "order.refunded": "refunded",
}


def apply_event(current: Entitlement, event: dict, *, known_products: set[str]) -> Entitlement:
    """Apply one VERIFIED provider event. Unknown, repeated or stale events change nothing."""
    event_id = str(event.get("id") or "")
    kind = event.get("type")
    if not event_id or kind not in TRANSITIONS or event_id in current.applied_event_ids:
        return current
    occurred = event.get("occurred_at")
    if not isinstance(occurred, datetime):
        return current
    if current.last_event_at and occurred < current.last_event_at:
        # out-of-order delivery: remember it was seen, never move state backwards
        return replace(current, applied_event_ids=current.applied_event_ids | {event_id})
    product = event.get("product")
    if product is not None and product not in known_products:
        # a product this server does not sell grants nothing
        return replace(current, applied_event_ids=current.applied_event_ids | {event_id})
    state = TRANSITIONS[kind] or current.state
    return replace(
        current,
        state=state,
        product=product or current.product,
        period_end=event.get("period_end") or current.period_end,
        last_event_at=occurred,
        applied_event_ids=current.applied_event_ids | {event_id},
    )
