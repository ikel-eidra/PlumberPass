from __future__ import annotations

from pydantic import BaseModel, Field


class Choice(BaseModel):
    label: str = Field(..., min_length=1, max_length=1, description="Choice label A-E")
    text: str


class Question(BaseModel):
    id: str
    topic: str
    subtopic: str
    difficulty: str
    prompt: str
    choices: list[Choice]
    answer_key: str = Field(..., min_length=1, max_length=1)
    explanation_short: str
    explanation_long: str
    tags: list[str]
    source_ref: str | None = None
    quality_flag: str | None = None


class Flashcard(BaseModel):
    id: str
    topic: str
    subtopic: str
    front: str
    back: str
    explanation_short: str
    explanation_long: str
    tags: list[str]
    difficulty: int
    source_ref: str
    quality_flag: str


class IdentificationItem(BaseModel):
    id: str
    topic: str
    subtopic: str
    prompt: str
    accepted_answers: list[str]
    explanation_short: str
    explanation_long: str
    tags: list[str]
    difficulty: int
    source_ref: str
    quality_flag: str


class VisualReviewItem(BaseModel):
    id: str
    topic: str
    subtopic: str
    prompt: str
    answer: str
    accepted_answers: list[str]
    caption: str
    image_path: str
    explanation_short: str
    explanation_long: str
    tags: list[str]
    difficulty: int
    source_ref: str
    quality_flag: str


class MockQuestion(BaseModel):
    id: str
    topic: str
    subtopic: str
    prompt: str
    choices: list[Choice]
    answer_key: str = Field(..., min_length=1, max_length=1)
    explanation_short: str
    explanation_long: str
    difficulty: int
    source_ref: str
    quality_flag: str


class Topic(BaseModel):
    name: str
    subtopics: list[str]


class HealthResponse(BaseModel):
    status: str


class BillingConfigResponse(BaseModel):
    provider: str
    checkout_ready: bool
    webhook_ready: bool
    prototype_unlock_enabled: bool
    billing_model: str
    plan_label: str
    plan_summary: str
    price_label: str
    currency: str
    unit_amount: int
    premium_url: str
    payments_now: list[str]
    payments_planned: list[str]
    payments_deferred: list[str]


class CheckoutSessionCreateRequest(BaseModel):
    device_id: str = Field(..., min_length=6)
    gate: str | None = None
    success_path: str | None = None
    cancel_path: str | None = None


class CheckoutSessionCreateResponse(BaseModel):
    session_id: str
    checkout_url: str


class EntitlementResponse(BaseModel):
    device_id: str
    tier: str
    premium_active: bool
    source: str | None = None
    granted_at: str | None = None
    checkout_session_id: str | None = None
    checkout_ready: bool = False


class CheckoutSessionVerifyRequest(BaseModel):
    session_id: str
    device_id: str = Field(..., min_length=6)


class CheckoutSessionVerifyResponse(EntitlementResponse):
    session_id: str
    session_status: str | None = None
    payment_status: str | None = None
    granted_via: str | None = None
