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


class Topic(BaseModel):
    name: str
    subtopics: list[str]


class HealthResponse(BaseModel):
    status: str
