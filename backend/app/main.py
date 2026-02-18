from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import Flashcard, HealthResponse, IdentificationItem, MockQuestion, Question, Topic
from .storage import (
    load_flashcards,
    load_identification_items,
    load_mock_exam1_part_a,
    load_mock_exam1_part_b,
    load_questions,
    load_topics,
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


@app.get("/api/v1/study/items")
async def get_study_items():
    return {
        "questions": load_questions(),
        "flashcards": load_flashcards(),
        "identification": load_identification_items()
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


@app.get("/api/v1/study/mock-exams/1/part-a", response_model=list[MockQuestion])
async def list_mock_exam1_part_a() -> list[MockQuestion]:
    return load_mock_exam1_part_a()


@app.get("/api/v1/study/mock-exams/1/part-b", response_model=list[MockQuestion])
async def list_mock_exam1_part_b() -> list[MockQuestion]:
    return load_mock_exam1_part_b()
