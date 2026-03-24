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
OUTPUT_NAME = "astm_mcq_curated.json"
SOURCE_PREFIX = "1. ASTM-NFPA.pdf"
PROMPT_PREFIX = "Which ASTM standard covers this description:"


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").split())


def _extract_candidates() -> list[dict[str, Any]]:
    payload = json.loads((DATA_DIR / SOURCE_NAME).read_text(encoding="utf-8"))
    candidates: list[dict[str, Any]] = []

    for item in payload.get("identification", []):
        source_ref = _normalize_text(item.get("source_ref"))
        if not source_ref.startswith(SOURCE_PREFIX):
            continue

        accepted_answers = item.get("accepted_answers") or []
        if len(accepted_answers) != 1:
            continue

        answer = _normalize_text(accepted_answers[0]).upper()
        prompt = _normalize_text(item.get("prompt"))
        explanation = _normalize_text(item.get("explanation_long"))

        if not prompt.startswith(PROMPT_PREFIX):
            continue
        if not answer or len(answer) < 2 or len(answer) > 8:
            continue
        if not answer[0].isalpha() or not any(character.isdigit() for character in answer):
            continue

        description = prompt[len(PROMPT_PREFIX) :].strip(" :-")
        if len(description) < 20 or len(description) > 220:
            continue
        if "NFPA DESCRIPTION" in description.upper():
            continue
        if explanation and "NFPA DESCRIPTION" in explanation.upper():
            continue

        candidates.append(
            {
                "source_id": _normalize_text(item.get("id")),
                "answer": answer,
                "description": description,
                "source_ref": source_ref,
                "explanation_long": explanation or f"{answer}: {description}",
            }
        )

    deduped: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        key = candidate["answer"]
        existing = deduped.get(key)
        if existing is None or len(candidate["description"]) < len(existing["description"]):
            deduped[key] = candidate

    return sorted(deduped.values(), key=lambda candidate: candidate["answer"])


def _pick_distractors(current: dict[str, Any], candidates: list[dict[str, Any]]) -> list[str] | None:
    pool = [candidate["answer"] for candidate in candidates if candidate["answer"] != current["answer"]]
    if len(pool) < 3:
        return None

    current_prefix = current["answer"][0]
    same_prefix = [code for code in pool if code.startswith(current_prefix)]
    different_prefix = [code for code in pool if not code.startswith(current_prefix)]

    ordered = same_prefix + different_prefix
    ordered = sorted(
        ordered,
        key=lambda code: (
            abs(len(code) - len(current["answer"])),
            hashlib.sha1(code.encode("utf-8")).hexdigest(),
        ),
    )
    return ordered[:3]


def publish_astm_mcqs() -> Path:
    candidates = _extract_candidates()
    questions: list[dict[str, Any]] = []
    labels = ["A", "B", "C", "D"]

    for candidate in candidates:
        distractors = _pick_distractors(candidate, candidates)
        if distractors is None:
            continue

        answer_slot = int(hashlib.sha1(candidate["source_id"].encode("utf-8")).hexdigest()[:2], 16) % 4
        options = distractors.copy()
        options.insert(answer_slot, candidate["answer"])

        questions.append(
            {
                "id": f"astm-derived__{candidate['source_id']}",
                "topic": "Materials & Standards",
                "subtopic": "ASTM Standards",
                "difficulty": "Easy",
                "prompt": f"Which ASTM standard covers this description? {candidate['description']}",
                "choices": [
                    {"label": label, "text": text}
                    for label, text in zip(labels, options)
                ],
                "answer_key": labels[answer_slot],
                "explanation_short": f"{candidate['answer']} covers this ASTM specification.",
                "explanation_long": candidate["explanation_long"],
                "tags": ["astm", "standards", "definition-match", "derived-mcq"],
                "source_ref": candidate["source_ref"],
                "quality_flag": "ok",
            }
        )

    payload = {
        "metadata": {
            "generator": "scripts/publish_astm_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(DATA_DIR / SOURCE_NAME),
            "promotion_strategy": "Derived MCQs from ASTM standards reference items",
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
    print(publish_astm_mcqs())


if __name__ == "__main__":
    main()
