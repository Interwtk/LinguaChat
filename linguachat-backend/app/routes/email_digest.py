import os
import re
import secrets
from email.utils import parseaddr

from fastapi import APIRouter, Header, HTTPException

from app.models.email_digest import (
    DispatchResult,
    ProgressSnapshot,
    SubscriptionCreate,
    SubscriptionCreated,
    SubscriptionStatus,
    SubscriptionUpdate,
)
from app.services.email_digest import dispatch_due_emails, normalize_locale, transport_from_env, validate_timezone
from app.services.email_store import EmailStore


router = APIRouter(prefix="/email-digest", tags=["daily-email"])
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def get_store() -> EmailStore:
    return EmailStore()


def validate_email(value: str) -> str:
    candidate = (value or "").strip()
    _, parsed = parseaddr(candidate)
    if parsed != candidate or len(candidate) > 254 or not EMAIL_PATTERN.fullmatch(candidate):
        raise HTTPException(status_code=422, detail="Invalid email address")
    return candidate


def require_manage_token(store: EmailStore, subscription_id: str, token: str | None):
    if not token or not store.verify_manage_token(subscription_id, token):
        raise HTTPException(status_code=401, detail="Invalid subscription management token")


def status_payload(subscription: dict) -> SubscriptionStatus:
    return SubscriptionStatus(
        subscription_id=subscription["subscription_id"],
        email=subscription["email"],
        locale=subscription["locale"],
        timezone=subscription["timezone"],
        preferred_hour=subscription["preferred_hour"],
        enabled=subscription["enabled"],
        progress=subscription.get("progress"),
    )


@router.post("/subscriptions", response_model=SubscriptionCreated, status_code=201)
def create_subscription(payload: SubscriptionCreate):
    store = get_store()
    try:
        timezone_name = validate_timezone(payload.timezone)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    subscription, manage_token = store.create_subscription(
        email=validate_email(payload.email),
        locale=normalize_locale(payload.locale),
        timezone_name=timezone_name,
        preferred_hour=payload.preferred_hour,
        progress=payload.progress.model_dump(exclude_none=True) if payload.progress else None,
    )
    return SubscriptionCreated(
        subscription_id=subscription["subscription_id"],
        manage_token=manage_token,
        enabled=True,
    )


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionStatus)
def get_subscription(
    subscription_id: str,
    x_linguachat_email_token: str | None = Header(default=None),
):
    store = get_store()
    require_manage_token(store, subscription_id, x_linguachat_email_token)
    subscription = store.get_subscription(subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return status_payload(subscription)


@router.put("/subscriptions/{subscription_id}", response_model=SubscriptionStatus)
def update_subscription(
    subscription_id: str,
    payload: SubscriptionUpdate,
    x_linguachat_email_token: str | None = Header(default=None),
):
    store = get_store()
    require_manage_token(store, subscription_id, x_linguachat_email_token)
    changes = payload.model_dump(exclude_unset=True)
    if "email" in changes:
        changes["email"] = validate_email(changes["email"])
    if "locale" in changes:
        changes["locale"] = normalize_locale(changes["locale"])
    if "timezone" in changes:
        try:
            changes["timezone"] = validate_timezone(changes["timezone"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    subscription = store.update_subscription(subscription_id, changes)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return status_payload(subscription)


@router.post("/subscriptions/{subscription_id}/progress", response_model=SubscriptionStatus)
def sync_progress(
    subscription_id: str,
    payload: ProgressSnapshot,
    x_linguachat_email_token: str | None = Header(default=None),
):
    store = get_store()
    require_manage_token(store, subscription_id, x_linguachat_email_token)
    subscription = store.set_progress(subscription_id, payload.model_dump(exclude_none=True))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return status_payload(subscription)


@router.delete("/subscriptions/{subscription_id}", response_model=SubscriptionStatus)
def disable_subscription(
    subscription_id: str,
    x_linguachat_email_token: str | None = Header(default=None),
):
    store = get_store()
    require_manage_token(store, subscription_id, x_linguachat_email_token)
    subscription = store.update_subscription(subscription_id, {"enabled": False})
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return status_payload(subscription)


@router.get("/unsubscribe/{unsubscribe_token}")
def unsubscribe(unsubscribe_token: str):
    if not unsubscribe_token or len(unsubscribe_token) > 256:
        raise HTTPException(status_code=404, detail="Unsubscribe link not found")
    if not get_store().unsubscribe_by_token(unsubscribe_token):
        raise HTTPException(status_code=404, detail="Unsubscribe link not found")
    return {"ok": True, "message": "Daily LinguaChat email disabled"}


@router.post("/internal/dispatch", response_model=DispatchResult)
def dispatch(
    x_linguachat_scheduler_token: str | None = Header(default=None),
):
    expected = os.getenv("EMAIL_SCHEDULER_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Daily email scheduler is not configured")
    if not x_linguachat_scheduler_token or not secrets.compare_digest(expected, x_linguachat_scheduler_token):
        raise HTTPException(status_code=401, detail="Invalid scheduler token")
    try:
        transport = transport_from_env()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return DispatchResult(**dispatch_due_emails(get_store(), transport))
