from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "backend" / "data"
PUBLISHED_DIR = DATA_DIR / "published"
SOURCE_NAME = "reference_materials_generated.json"
OUTPUT_NAME = "useful_conversions_mcq_curated.json"
SOURCE_PREFIX = "5. USEFUL CONVERSIONS.pdf"


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def _extract_candidates() -> list[dict[str, str]]:
    payload = json.loads((DATA_DIR / SOURCE_NAME).read_text(encoding="utf-8"))
    candidates_by_prompt: dict[str, dict[str, str]] = {}

    for item in payload.get("identification", []):
        source_ref = _normalize_text(item.get("source_ref"))
        if not source_ref.startswith(SOURCE_PREFIX):
            continue

        prompt = _normalize_text(item.get("prompt"))
        accepted_answers = item.get("accepted_answers") or []
        if not prompt or not accepted_answers:
            continue

        answer = _normalize_text(accepted_answers[0])
        if not answer:
            continue

        existing = candidates_by_prompt.get(prompt)
        if existing is None:
            candidates_by_prompt[prompt] = {
                "source_id": _normalize_text(item.get("id")),
                "prompt": prompt,
                "answer": answer,
                "source_ref": source_ref,
            }

    return list(candidates_by_prompt.values())


def _pick_distractors(current: dict[str, str], candidates: list[dict[str, str]]) -> list[str] | None:
    pool = [candidate["answer"] for candidate in candidates if candidate["prompt"] != current["prompt"]]
    if len(pool) < 3:
        return None

    pool.sort(
        key=lambda answer: (
            abs(len(answer) - len(current["answer"])),
            hashlib.sha1(answer.encode("utf-8")).hexdigest(),
        )
    )
    return pool[:3]


def publish_conversion_mcqs() -> Path:
    candidates = _extract_candidates()
    labels = ["A", "B", "C", "D"]
    questions: list[dict[str, Any]] = []

    for candidate in candidates:
        distractors = _pick_distractors(candidate, candidates)
        if distractors is None:
            continue

        answer_slot = int(hashlib.sha1(candidate["source_id"].encode("utf-8")).hexdigest()[:2], 16) % 4
        options = distractors.copy()
        options.insert(answer_slot, candidate["answer"])

        questions.append(
            {
                "id": f"conversion-derived__{candidate['source_id']}",
                "topic": "Plumbing Arithmetic",
                "subtopic": "Useful Conversions",
                "difficulty": "Easy",
                "prompt": candidate["prompt"],
                "choices": [
                    {"label": label, "text": text}
                    for label, text in zip(labels, options)
                ],
                "answer_key": labels[answer_slot],
                "explanation_short": f"{candidate['answer']} is one accepted equivalent.",
                "explanation_long": f"{candidate['prompt']}: {candidate['answer']}",
                "tags": ["conversions", "plumbing-arithmetic", "reference", "derived-mcq"],
                "source_ref": candidate["source_ref"],
                "quality_flag": "ok",
            }
        )

    payload = {
        "metadata": {
            "generator": "scripts/publish_conversion_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(DATA_DIR / SOURCE_NAME),
            "promotion_strategy": "One canonical MCQ per useful-conversions prompt",
            "candidate_count": len(candidates),
            "question_count": len(questions),
        },
        "questions": questions,
        "flashcards": [],
        "identification": [],
    }

    output_path = PUBLISHED_DIR / OUTPUT_NAME
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path


def main() -> None:
    print(publish_conversion_mcqs())


if __name__ == "__main__":
    main()
