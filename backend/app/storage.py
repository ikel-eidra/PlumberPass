from __future__ import annotations

import json
from pathlib import Path

from .models import Flashcard, IdentificationItem, MockQuestion, Question, Topic

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_PATH = DATA_DIR / "seed.json"
MOCK_EXAM1_PART_A_PATH = DATA_DIR / "mock_exam1_part_a.json"
MOCK_EXAM1_PART_B_PATH = DATA_DIR / "mock_exam1_part_b.json"


def _load_batch_payloads() -> list[dict]:
    """Dynamically loads all JSON files in the data directory excluding seed and mock exams."""
    payloads: list[dict] = []
    # Exclude known non-batch files
    excluded = {"seed.json", "mock_exam1_part_a.json", "mock_exam1_part_b.json"}

    for path in DATA_DIR.glob("*.json"):
        if path.name in excluded:
            continue
        try:
            payloads.append(json.loads(path.read_text(encoding="utf-8")))
        except Exception:
            continue
    return payloads


def load_questions() -> list[Question]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    questions = [Question(**item) for item in payload["questions"]]
    for batch_payload in _load_batch_payloads():
        batch_questions = [
            Question(
                id=item.get("id", f"MCQ-{i}"),
                topic=item.get("topic", "General"),
                subtopic=item.get("subtopic", ""),
                difficulty=str(item.get("difficulty", "3")),
                prompt=item.get("prompt") or item.get("question_text") or "No prompt provided.",
                choices=[{"label": key, "text": value} for key, value in item.get("choices", {}).items()],
                answer_key=item.get("answer_key", "A"),
                explanation_short=item.get("explanation_short", ""),
                explanation_long=item.get("explanation_long", ""),
                tags=item.get("tags", []),
            )
            for i, item in enumerate(batch_payload.get("mcqs", []))
        ]
        questions.extend(batch_questions)
    return questions


def load_topics() -> list[Topic]:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return [Topic(**item) for item in payload["topics"]]


def load_flashcards() -> list[Flashcard]:
    flashcards: list[Flashcard] = []
    for payload in _load_batch_payloads():
        for i, item in enumerate(payload.get("flashcards", [])):
            try:
                flashcards.append(Flashcard(
                    id=item.get("id", f"FC-{i}"),
                    topic=item.get("topic", "General"),
                    subtopic=item.get("subtopic", ""),
                    front=item.get("front", ""),
                    back=item.get("back", ""),
                    explanation_short=item.get("explanation_short", ""),
                    explanation_long=item.get("explanation_long", ""),
                    tags=item.get("tags", []),
                    difficulty=item.get("difficulty", 3),
                    source_ref=item.get("source_ref", ""),
                    quality_flag=item.get("quality_flag", "OK")
                ))
            except Exception:
                continue
    return flashcards


def load_identification_items() -> list[IdentificationItem]:
    identification_items: list[IdentificationItem] = []
    for payload in _load_batch_payloads():
        for i, item in enumerate(payload.get("identification", [])):
            try:
                identification_items.append(IdentificationItem(
                    id=item.get("id", f"ID-{i}"),
                    topic=item.get("topic", "General"),
                    subtopic=item.get("subtopic", ""),
                    prompt=item.get("prompt", ""),
                    accepted_answers=item.get("accepted_answers", []),
                    explanation_short=item.get("explanation_short", ""),
                    explanation_long=item.get("explanation_long", ""),
                    tags=item.get("tags", []),
                    difficulty=item.get("difficulty", 3),
                    source_ref=item.get("source_ref", ""),
                    quality_flag=item.get("quality_flag", "OK")
                ))
            except Exception:
                continue
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
