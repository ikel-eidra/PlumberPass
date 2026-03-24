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
OUTPUT_NAME = "laws_reference_mcq_curated.json"
SOURCE_PREFIX = "2. LAWS, RULES AND REGULATIONS AFFECTING THE PLUMBING PROFESSION.pdf"
PROMPT_PREFIX = "Which law or code corresponds to:"


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def _extract_candidates() -> list[dict[str, str]]:
    payload = json.loads((DATA_DIR / SOURCE_NAME).read_text(encoding="utf-8"))
    candidates: list[dict[str, str]] = []

    for item in payload.get("identification", []):
        source_ref = _normalize_text(item.get("source_ref"))
        if not source_ref.startswith(SOURCE_PREFIX):
            continue

        accepted_answers = item.get("accepted_answers") or []
        if not accepted_answers:
            continue

        answer = _normalize_text(accepted_answers[0]).upper()
        prompt = _normalize_text(item.get("prompt"))
        if not prompt.startswith(PROMPT_PREFIX):
            continue
        if len(answer) < 4 or len(answer) > 12 or not any(character.isdigit() for character in answer):
            continue

        description = prompt[len(PROMPT_PREFIX) :].strip(" :-")
        if len(description) < 3 or len(description) > 120:
            continue

        candidates.append(
            {
                "source_id": _normalize_text(item.get("id")),
                "answer": answer,
                "description": description,
                "source_ref": source_ref,
            }
        )

    deduped: dict[str, dict[str, str]] = {}
    for candidate in candidates:
        key = candidate["answer"]
        existing = deduped.get(key)
        if existing is None or len(candidate["description"]) < len(existing["description"]):
            deduped[key] = candidate

    return sorted(deduped.values(), key=lambda candidate: candidate["answer"])


def _pick_distractors(current: dict[str, str], candidates: list[dict[str, str]]) -> list[str] | None:
    pool = [candidate["answer"] for candidate in candidates if candidate["answer"] != current["answer"]]
    if len(pool) < 3:
        return None

    pool.sort(
        key=lambda answer: (
            0 if answer[:2] == current["answer"][:2] else 1,
            abs(len(answer) - len(current["answer"])),
            hashlib.sha1(answer.encode("utf-8")).hexdigest(),
        )
    )
    return pool[:3]


def publish_laws_mcqs() -> Path:
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
                "id": f"laws-derived__{candidate['source_id']}",
                "topic": "Plumbing Code",
                "subtopic": "Laws, Rules and Regulations",
                "difficulty": "Easy",
                "prompt": f"Which law or code corresponds to this description? {candidate['description']}",
                "choices": [
                    {"label": label, "text": text}
                    for label, text in zip(labels, options)
                ],
                "answer_key": labels[answer_slot],
                "explanation_short": f"{candidate['answer']} matches this law or code reference.",
                "explanation_long": f"{candidate['answer']}: {candidate['description']}",
                "tags": ["laws", "regulations", "code-reference", "derived-mcq"],
                "source_ref": candidate["source_ref"],
                "quality_flag": "ok",
            }
        )

    payload = {
        "metadata": {
            "generator": "scripts/publish_laws_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(DATA_DIR / SOURCE_NAME),
            "promotion_strategy": "Derived MCQs from structured law/code references",
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
    print(publish_laws_mcqs())


if __name__ == "__main__":
    main()
