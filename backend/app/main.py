from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import Flashcard, HealthResponse, IdentificationItem, Question, Topic
from .storage import (
    load_flashcards,
    load_identification_items,
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


@app.get("/topics", response_model=list[Topic])
async def list_topics() -> list[Topic]:
    return load_topics()


@app.get("/questions", response_model=list[Question])
async def list_questions() -> list[Question]:
    return load_questions()


@app.get("/flashcards", response_model=list[Flashcard])
async def list_flashcards() -> list[Flashcard]:
    return load_flashcards()


@app.get("/identification", response_model=list[IdentificationItem])
async def list_identification_items() -> list[IdentificationItem]:
    return load_identification_items()
