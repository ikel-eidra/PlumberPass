from __future__ import annotations

import json
from pathlib import Path

from .models import Flashcard, IdentificationItem, MockQuestion, Question, Topic

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "seed.json"
BATCH1_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch1.json"
BATCH2_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch2.json"
BATCH3_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch3.json"
BATCH4_PATH = Path(__file__).resolve().parent.parent / "data" / "notebooklm_batch4.json"
MOCK_EXAM1_PART_A_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "mock_exam1_part_a.json"
)
MOCK_EXAM1_PART_B_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "mock_exam1_part_b.json"
)


def _load_batch_payloads() -> list[dict]:
    payloads: list[dict] = []
    for path in (BATCH1_PATH, BATCH2_PATH, BATCH3_PATH, BATCH4_PATH):
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

def load_mock_exam1_part_a() -> list[MockQuestion]:
    if not MOCK_EXAM1_PART_A_PATH.exists():
        return []
    payload = json.loads(MOCK_EXAM1_PART_A_PATH.read_text(encoding="utf-8"))
    return [
        MockQuestion(
            id=item["QID"],
            topic=item["Topic"],
            subtopic=item["Subtopic"],
            prompt=item["QuestionText"],
            choices=[{"label": key, "text": value} for key, value in item["Choices"].items()],
            answer_key=item["AnswerKey"],
            explanation_short=item["ExplanationShort"],
            explanation_long=item["ExplanationLong"],
            difficulty=item["Difficulty"],
            source_ref=item["SourceRef"],
            quality_flag=item["QualityFlag"],
        )
        for item in payload
    ]


def load_mock_exam1_part_b() -> list[MockQuestion]:
    if not MOCK_EXAM1_PART_B_PATH.exists():
        return []
    payload = json.loads(MOCK_EXAM1_PART_B_PATH.read_text(encoding="utf-8"))
    return [
        MockQuestion(
            id=item["QID"],
            topic=item["Topic"],
            subtopic=item["Subtopic"],
            prompt=item["QuestionText"],
            choices=[{"label": key, "text": value} for key, value in item["Choices"].items()],
            answer_key=item["AnswerKey"],
            explanation_short=item["ExplanationShort"],
            explanation_long=item["ExplanationLong"],
            difficulty=item["Difficulty"],
            source_ref=item["SourceRef"],
            quality_flag=item["QualityFlag"],
        )
        for item in payload
    ]
