from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .billing import (
    apply_webhook_event,
    create_checkout_session,
    get_billing_config,
    get_entitlement,
    parse_webhook_event,
    verify_checkout_session,
)
from .models import (
    BillingConfigResponse,
    CheckoutSessionCreateRequest,
    CheckoutSessionCreateResponse,
    CheckoutSessionVerifyRequest,
    CheckoutSessionVerifyResponse,
    EntitlementResponse,
    Flashcard,
    HealthResponse,
    IdentificationItem,
    MockQuestion,
    Question,
    Topic,
    VisualReviewItem,
)
from .storage import (
    load_flashcards,
    load_identification_items,
    load_mock_exam1_part_a,
    load_mock_exam1_part_b,
    load_questions,
    load_topics,
    load_visual_review_items,
)

app = FastAPI(title="PlumberPass API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/api/v1/billing/config", response_model=BillingConfigResponse)
async def billing_config(request: Request) -> BillingConfigResponse:
    return BillingConfigResponse(**get_billing_config(request.headers.get("origin")))


@app.get("/api/v1/billing/entitlement/{device_id}", response_model=EntitlementResponse)
async def billing_entitlement(request: Request, device_id: str) -> EntitlementResponse:
    payload = get_entitlement(device_id)
    payload["checkout_ready"] = get_billing_config(request.headers.get("origin"))[
        "checkout_ready"
    ]
    return EntitlementResponse(**payload)


@app.post(
    "/api/v1/billing/create-checkout-session",
    response_model=CheckoutSessionCreateResponse,
)
async def billing_create_checkout_session(
    request: Request,
    payload: CheckoutSessionCreateRequest,
) -> CheckoutSessionCreateResponse:
    try:
        session = create_checkout_session(
            device_id=payload.device_id,
            gate=payload.gate,
            origin=request.headers.get("origin"),
            success_path=payload.success_path,
            cancel_path=payload.cancel_path,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CheckoutSessionCreateResponse(**session)


@app.post(
    "/api/v1/billing/verify-checkout-session",
    response_model=CheckoutSessionVerifyResponse,
)
async def billing_verify_checkout_session(
    request: Request,
    payload: CheckoutSessionVerifyRequest,
) -> CheckoutSessionVerifyResponse:
    try:
        session = verify_checkout_session(payload.session_id, payload.device_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session["checkout_ready"] = get_billing_config(request.headers.get("origin"))[
        "checkout_ready"
    ]
    return CheckoutSessionVerifyResponse(**session)


@app.post("/api/v1/billing/webhook")
async def billing_webhook(request: Request) -> dict[str, object]:
    payload = await request.body()
    signature_header = request.headers.get("Stripe-Signature", "")

    try:
        event = parse_webhook_event(payload, signature_header)
        return apply_webhook_event(event)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/study/items")
async def get_study_items():
    return {
        "questions": load_questions(),
        "flashcards": load_flashcards(),
        "identification": load_identification_items(),
        "visual_review": load_visual_review_items(),
    }


@app.get("/api/v1/study/topics", response_model=list[Topic])
async def list_topics() -> list[Topic]:
    return load_topics()


@app.get("/api/v1/study/questions", response_model=list[Question])
async def list_questions() -> list[Question]:
    return load_questions()


@app.get("/api/v1/study/flashcards", response_model=list[Flashcard])
async def list_flashcards() -> list[Flashcard]:
    return load_flashcards()


@app.get("/api/v1/study/identification", response_model=list[IdentificationItem])
async def list_identification_items() -> list[IdentificationItem]:
    return load_identification_items()


@app.get("/api/v1/study/visual-review", response_model=list[VisualReviewItem])
async def list_visual_review_items() -> list[VisualReviewItem]:
    return load_visual_review_items()


@app.get("/api/v1/study/mock-exams/1/part-a", response_model=list[MockQuestion])
async def list_mock_exam1_part_a() -> list[MockQuestion]:
    return load_mock_exam1_part_a()


@app.get("/api/v1/study/mock-exams/1/part-b", response_model=list[MockQuestion])
async def list_mock_exam1_part_b() -> list[MockQuestion]:
    return load_mock_exam1_part_b()
