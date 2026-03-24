from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .models import (
    Flashcard,
    IdentificationItem,
    MockQuestion,
    Question,
    Topic,
    VisualReviewItem,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PUBLISHED_DATA_DIR = DATA_DIR / "published"
DATA_PATH = DATA_DIR / "seed.json"
MOCK_EXAM1_PART_A_PATH = DATA_DIR / "mock_exam1_part_a.json"
MOCK_EXAM1_PART_B_PATH = DATA_DIR / "mock_exam1_part_b.json"
QUESTION_FILE_BLACKLIST = {
    "advance_week1.json",
    "master_question_bank.json",
    "materials_publish_candidates.json",
    "mock_exam1_part_a.json",
    "mock_exam1_part_b.json",
    "reference_materials_generated.json",
    "reference_materials_ocr_queue.json",
}
QUESTION_QUALITY_RANK = {
    "verified": 5,
    "ok": 4,
    "probable": 4,
    "review": 2,
    "draft": 1,
    "uncertain": 1,
    "manual_review": 0,
}


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _iter_payloads() -> list[tuple[Path, Any]]:
    payloads: list[tuple[Path, Any]] = []
    candidate_paths = sorted(DATA_DIR.glob("*.json"))
    if PUBLISHED_DATA_DIR.exists():
        candidate_paths.extend(sorted(PUBLISHED_DATA_DIR.glob("*.json")))
    for path in candidate_paths:
        if path.name in QUESTION_FILE_BLACKLIST:
            continue
        try:
            payloads.append((path, _load_json(path)))
        except Exception:
            continue
    return payloads


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return " ".join(value.split())


def _normalize_choices(raw_choices: Any) -> list[dict[str, str]]:
    if isinstance(raw_choices, dict):
        items = sorted(raw_choices.items())
    elif isinstance(raw_choices, list):
        items = [
            (item.get("label"), item.get("text"))
            for item in raw_choices
            if isinstance(item, dict)
        ]
    else:
        return []

    normalized: list[dict[str, str]] = []
    for label, text in items:
        label_text = _clean_text(label).upper()[:1]
        choice_text = _clean_text(text)
        if label_text and choice_text:
            normalized.append({"label": label_text, "text": choice_text})
    return normalized


def _normalize_question(item: dict[str, Any]) -> Question | None:
    question_id = _clean_text(item.get("id") or item.get("QID"))
    prompt = _clean_text(
        item.get("prompt") or item.get("question_text") or item.get("QuestionText")
    )
    choices = _normalize_choices(item.get("choices") or item.get("Choices"))
    answer_key = _clean_text(item.get("answer_key") or item.get("AnswerKey")).upper()[
        :1
    ]

    if not question_id or not prompt or len(choices) < 2:
        return None
    if answer_key not in {choice["label"] for choice in choices}:
        return None

    return Question(
        id=question_id,
        topic=_clean_text(item.get("topic") or item.get("Topic") or "General Plumbing"),
        subtopic=_clean_text(item.get("subtopic") or item.get("Subtopic") or "General"),
        difficulty=_clean_text(
            item.get("difficulty") or item.get("Difficulty") or "Medium"
        ),
        prompt=prompt,
        choices=choices,
        answer_key=answer_key,
        explanation_short=_clean_text(
            item.get("explanation_short") or item.get("ExplanationShort")
        ),
        explanation_long=_clean_text(
            item.get("explanation_long") or item.get("ExplanationLong")
        ),
        tags=[_clean_text(tag) for tag in item.get("tags", []) if _clean_text(tag)],
        source_ref=_clean_text(item.get("source_ref") or item.get("SourceRef")) or None,
        quality_flag=_clean_text(
            item.get("quality_flag")
            or item.get("QualityFlag")
            or item.get("confidence")
        )
        or None,
    )


def _question_score(question: Question) -> tuple[int, int, int]:
    quality = QUESTION_QUALITY_RANK.get((question.quality_flag or "").lower(), 3)
    return (quality, len(question.explanation_long), len(question.prompt))


def _merge_questions(questions: list[Question]) -> list[Question]:
    merged: dict[str, Question] = {}
    for question in questions:
        existing = merged.get(question.id)
        if existing is None or _question_score(question) > _question_score(existing):
            merged[question.id] = question
    return list(merged.values())


def _collect_questions() -> list[Question]:
    questions: list[Question] = []

    for path, payload in _iter_payloads():
        candidates: Any = []
        if isinstance(payload, dict):
            if "questions" in payload:
                candidates = payload["questions"]
            elif "mcqs" in payload:
                candidates = payload["mcqs"]
        elif isinstance(payload, list):
            candidates = payload

        if not isinstance(candidates, list):
            continue

        for item in candidates:
            if not isinstance(item, dict):
                continue
            normalized = _normalize_question(item)
            if normalized is not None:
                questions.append(normalized)

    return _merge_questions(questions)


def _build_topics(
    questions: list[Question],
    flashcards: list[Flashcard],
    identification_items: list[IdentificationItem],
) -> list[Topic]:
    topic_map: dict[str, set[str]] = {}
    for item in [*questions, *flashcards, *identification_items]:
        if not item.topic:
            continue
        topic_map.setdefault(item.topic, set())
        if item.subtopic:
            topic_map[item.topic].add(item.subtopic)

    return [
        Topic(name=name, subtopics=sorted(subtopics))
        for name, subtopics in sorted(topic_map.items())
    ]


def load_questions() -> list[Question]:
    return _collect_questions()


def load_topics() -> list[Topic]:
    return _build_topics(
        load_questions(), load_flashcards(), load_identification_items()
    )


def load_flashcards() -> list[Flashcard]:
    flashcards: dict[str, Flashcard] = {}
    for _, payload in _iter_payloads():
        if not isinstance(payload, dict):
            continue
        for item in payload.get("flashcards", []):
            try:
                flashcard = Flashcard(**item)
            except Exception:
                continue
            flashcards[flashcard.id] = flashcard
    return list(flashcards.values())


def load_identification_items() -> list[IdentificationItem]:
    identification_items: dict[str, IdentificationItem] = {}
    for _, payload in _iter_payloads():
        if not isinstance(payload, dict):
            continue
        for item in payload.get("identification", []):
            try:
                identification = IdentificationItem(**item)
            except Exception:
                continue
            identification_items[identification.id] = identification
    return list(identification_items.values())


def load_visual_review_items() -> list[VisualReviewItem]:
    visual_items: dict[str, VisualReviewItem] = {}
    for _, payload in _iter_payloads():
        if not isinstance(payload, dict):
            continue
        for item in payload.get("visual_review", []):
            try:
                visual_item = VisualReviewItem(**item)
            except Exception:
                continue
            visual_key = re.sub(r"[^a-z0-9]+", " ", visual_item.caption.lower()).strip()
            existing = visual_items.get(visual_key)
            if existing is None or (
                len(visual_item.explanation_long),
                len(visual_item.prompt),
                len(visual_item.accepted_answers),
            ) > (
                len(existing.explanation_long),
                len(existing.prompt),
                len(existing.accepted_answers),
            ):
                visual_items[visual_key] = visual_item
    return sorted(visual_items.values(), key=lambda item: (item.topic, item.caption))


def load_mock_exam1_part_a() -> list[MockQuestion]:
    if not MOCK_EXAM1_PART_A_PATH.exists():
        return []
    payload = _load_json(MOCK_EXAM1_PART_A_PATH)
    return [
        MockQuestion(
            id=item["QID"],
            topic=item["Topic"],
            subtopic=item["Subtopic"],
            prompt=item["QuestionText"],
            choices=[
                {"label": key, "text": value} for key, value in item["Choices"].items()
            ],
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
    payload = _load_json(MOCK_EXAM1_PART_B_PATH)
    return [
        MockQuestion(
            id=item["QID"],
            topic=item["Topic"],
            subtopic=item["Subtopic"],
            prompt=item["QuestionText"],
            choices=[
                {"label": key, "text": value} for key, value in item["Choices"].items()
            ],
            answer_key=item["AnswerKey"],
            explanation_short=item["ExplanationShort"],
            explanation_long=item["ExplanationLong"],
            difficulty=item["Difficulty"],
            source_ref=item["SourceRef"],
            quality_flag=item["QualityFlag"],
        )
        for item in payload
    ]
