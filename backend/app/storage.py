from __future__ import annotations

import json
from pathlib import Path

from .models import Flashcard, IdentificationItem, Question, Topic

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "seed.json"
BATCH1_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch1.json"
BATCH2_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch2.json"


def _load_batch_payloads() -> list[dict]:
    payloads: list[dict] = []
    for path in (BATCH1_PATH, BATCH2_PATH):
        if path.exists():
            payloads.append(json.loads(path.read_text(encoding="utf-8")))
    return payloads


def load_questions() -> list[Question]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    questions = [Question(**item) for item in payload["questions"]]
    for batch_payload in _load_batch_payloads():
        batch_questions = [
            Question(
                id=item["id"],
                topic=item["topic"],
                subtopic=item["subtopic"],
                difficulty=str(item["difficulty"]),
                prompt=item["question_text"],
                choices=[{"label": key, "text": value} for key, value in item["choices"].items()],
                answer_key=item["answer_key"],
                explanation_short=item["explanation_short"],
                explanation_long=item["explanation_long"],
                tags=item["tags"],
            )
            for item in batch_payload.get("mcqs", [])
        ]
        questions.extend(batch_questions)
    return questions


def load_topics() -> list[Topic]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return [Topic(**item) for item in payload["topics"]]


def load_flashcards() -> list[Flashcard]:
    flashcards: list[Flashcard] = []
    for payload in _load_batch_payloads():
        flashcards.extend(Flashcard(**item) for item in payload.get("flashcards", []))
    return flashcards


def load_identification_items() -> list[IdentificationItem]:
    identification_items: list[IdentificationItem] = []
    for payload in _load_batch_payloads():
        identification_items.extend(
            IdentificationItem(**item) for item in payload.get("identification", [])
        )
    return identification_items
