from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
FRONTEND_PUBLIC_DIR = REPO_ROOT / "frontend" / "public"
OUTPUT_PATH = FRONTEND_PUBLIC_DIR / "study-bundle.json"


def main() -> None:
    import sys

    sys.path.insert(0, str(BACKEND_DIR))

    from app.storage import (  # noqa: E402
        load_flashcards,
        load_identification_items,
        load_mock_exam1_part_a,
        load_mock_exam1_part_b,
        load_questions,
        load_topics,
        load_visual_review_items,
    )

    questions = load_questions()
    mock_questions = [
        {
            "id": question.id,
            "topic": question.topic,
            "subtopic": question.subtopic,
            "difficulty": str(question.difficulty),
            "prompt": question.prompt,
            "choices": [choice.model_dump() for choice in question.choices],
            "answer_key": question.answer_key,
            "explanation_short": question.explanation_short,
            "explanation_long": question.explanation_long,
            "tags": [],
            "source_ref": question.source_ref,
            "quality_flag": question.quality_flag,
        }
        for question in [*load_mock_exam1_part_a(), *load_mock_exam1_part_b()]
    ]

    payload = {
        "metadata": {
            "generator": "scripts/export_study_bundle.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "study_question_count": len(questions),
            "flashcard_count": len(load_flashcards()),
            "identification_count": len(load_identification_items()),
            "visual_review_count": len(load_visual_review_items()),
            "mock_question_count": len(mock_questions),
        },
        "topics": [topic.model_dump() for topic in load_topics()],
        "questions": [question.model_dump() for question in questions],
        "flashcards": [flashcard.model_dump() for flashcard in load_flashcards()],
        "identification": [
            identification.model_dump() for identification in load_identification_items()
        ],
        "visual_review": [item.model_dump() for item in load_visual_review_items()],
        "mock_questions": mock_questions,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
