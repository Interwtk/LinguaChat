from typing import Optional

from pydantic import BaseModel, Field


class ProgressSnapshot(BaseModel):
    level: Optional[str] = None
    xp: Optional[int] = Field(default=None, ge=0)
    streak: Optional[int] = Field(default=None, ge=0)
    messages_sent: Optional[int] = Field(default=None, ge=0)
    missions_completed: Optional[int] = Field(default=None, ge=0)
    last_practice_date: Optional[str] = None


class SubscriptionCreate(BaseModel):
    email: str
    locale: str = "en"
    timezone: str = "UTC"
    preferred_hour: int = Field(default=8, ge=0, le=23)
    progress: Optional[ProgressSnapshot] = None


class SubscriptionUpdate(BaseModel):
    email: Optional[str] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None
    preferred_hour: Optional[int] = Field(default=None, ge=0, le=23)
    enabled: Optional[bool] = None


class SubscriptionCreated(BaseModel):
    subscription_id: str
    manage_token: str
    enabled: bool


class SubscriptionStatus(BaseModel):
    subscription_id: str
    email: str
    locale: str
    timezone: str
    preferred_hour: int
    enabled: bool
    progress: Optional[ProgressSnapshot] = None


class DispatchResult(BaseModel):
    considered: int
    sent: int
    skipped: int
    failed: int
