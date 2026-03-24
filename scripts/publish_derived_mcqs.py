from __future__ import annotations

import hashlib
import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "backend" / "data"
PUBLISHED_DIR = REPO_ROOT / "backend" / "data" / "published"
SOURCE_NAME = "aspe_glossary_curated.json"
OUTPUT_NAME = "aspe_glossary_mcq_curated.json"
TARGET_COUNT = 180
PROMPT_PREFIX = "What term matches this definition?"
RAW_REFERENCE_NAME = "reference_materials_generated.json"
RAW_TERM_PROMPT_MARKER = "Which plumbing term matches this definition:"
EXPANSION_OUTPUT_NAME = "aspe_reference_mcq_curated_batch2.json"
EXPANSION_TARGET_COUNT = 120
FRAGMENT_STARTS = {
    "with",
    "and",
    "for",
    "from",
    "of",
    "to",
    "by",
    "in",
    "on",
    "at",
    "or",
    "used",
    "having",
    "r",
    "f",
}


def _normalize_text(value: Any) -> str:
    text = str(value or "")
    text = re.sub(r"([A-Za-z])-\s*([A-Za-z])", r"\1\2", text)
    return " ".join(text.split())


def _extract_definition(prompt: str, answer: str) -> str:
    text = _normalize_text(prompt)
    if not text.startswith(PROMPT_PREFIX):
        return ""
    definition = text[len(PROMPT_PREFIX) :].strip(" :-")
    if answer and definition.lower().startswith(answer.lower()):
        definition = definition[len(answer) :].lstrip(" :-,")
    if definition[:1].islower():
        definition = f"{definition[:1].upper()}{definition[1:]}"
    return definition


def _extract_raw_term_definition(prompt: str, answer: str) -> str:
    text = _normalize_text(prompt)
    marker_lower = RAW_TERM_PROMPT_MARKER.lower()
    text_lower = text.lower()
    if marker_lower not in text_lower:
        return ""
    start_index = text_lower.index(marker_lower) + len(marker_lower)
    definition = text[start_index:].strip(" :-")
    if answer and definition.lower().startswith(answer.lower()):
        definition = definition[len(answer) :].lstrip(" :-,")
    if definition[:1].islower():
        definition = f"{definition[:1].upper()}{definition[1:]}"
    return definition


def _alpha_ratio(text: str) -> float:
    if not text:
        return 0.0
    alpha_count = sum(character.isalpha() for character in text)
    return alpha_count / len(text)


def _is_publish_safe_candidate(item: dict[str, Any]) -> bool:
    accepted_answers = item.get("accepted_answers") or []
    if len(accepted_answers) != 1:
        return False

    answer = _normalize_text(accepted_answers[0])
    definition = _extract_definition(str(item.get("prompt") or ""), answer)

    if not answer or not definition:
        return False
    if len(answer) < 2 or len(answer) > 48:
        return False
    if len(answer.split()) > 5:
        return False
    if any(character in answer for character in ";:!?=/\\[]{}"):
        return False
    if len(definition) < 25 or len(definition) > 220:
        return False
    if len(definition.split()) < 4:
        return False
    if definition.endswith("?"):
        return False
    first_token = definition.split(" ", 1)[0].strip(",.:;").lower()
    if len(first_token) == 1 and first_token.isalpha():
        return False
    if first_token in FRAGMENT_STARTS:
        return False
    if _alpha_ratio(definition) < 0.6:
        return False
    return True


def _quality_score(candidate: dict[str, Any]) -> tuple[int, int, int, int]:
    definition = candidate["definition"]
    answer = candidate["answer"]
    ideal_definition_length = abs(110 - len(definition))
    digit_penalty = sum(character.isdigit() for character in definition)
    lowercase_start_penalty = 0 if definition[:1].isupper() else 1
    answer_word_penalty = len(answer.split())
    return (
        ideal_definition_length,
        digit_penalty,
        lowercase_start_penalty,
        answer_word_penalty,
    )


def _load_candidates() -> list[dict[str, Any]]:
    source_path = PUBLISHED_DIR / SOURCE_NAME
    payload = json.loads(source_path.read_text(encoding="utf-8"))
    candidates: list[dict[str, Any]] = []

    for item in payload.get("identification", []):
        if not _is_publish_safe_candidate(item):
            continue

        accepted_answers = item.get("accepted_answers") or []
        answer = _normalize_text(accepted_answers[0])
        definition = _extract_definition(str(item.get("prompt") or ""), answer)
        candidates.append(
            {
                "source_id": _normalize_text(item.get("id")),
                "answer": answer,
                "definition": definition,
                "explanation_short": _normalize_text(item.get("explanation_short")) or answer,
                "explanation_long": _normalize_text(item.get("explanation_long")) or definition,
                "source_ref": _normalize_text(item.get("source_ref")),
                "topic": _normalize_text(item.get("topic")) or "Terminology & Definitions",
                "subtopic": _normalize_text(item.get("subtopic")) or "ASPE Plumbing Terminology",
                "tags": [tag for tag in item.get("tags", []) if _normalize_text(tag)],
            }
        )

    candidates.sort(
        key=lambda candidate: (
            _quality_score(candidate),
            candidate["answer"].lower(),
            candidate["source_id"],
        )
    )
    return candidates


def _load_reference_expansion_candidates(excluded_terms: set[str]) -> list[dict[str, Any]]:
    source_path = DATA_DIR / RAW_REFERENCE_NAME
    payload = json.loads(source_path.read_text(encoding="utf-8"))
    candidates: list[dict[str, Any]] = []

    for item in payload.get("identification", []):
        source_ref = _normalize_text(item.get("source_ref"))
        if not source_ref.startswith("ASPE PLUMBING TERMINOLOGY.pdf"):
            continue

        accepted_answers = item.get("accepted_answers") or []
        if len(accepted_answers) != 1:
            continue

        answer = _normalize_text(accepted_answers[0])
        if answer.lower() in excluded_terms:
            continue

        definition = _extract_raw_term_definition(str(item.get("prompt") or ""), answer)
        if not answer or not definition:
            continue
        if len(answer) < 2 or len(answer) > 48:
            continue
        if len(answer.split()) > 5:
            continue
        if any(character in answer for character in ";:!?=/\\[]{}"):
            continue
        if len(definition) < 25 or len(definition) > 220:
            continue
        if len(definition.split()) < 4 or definition.endswith("?"):
            continue
        first_token = definition.split(" ", 1)[0].strip(",.:;").lower()
        if len(first_token) == 1 and first_token.isalpha():
            continue
        if first_token in FRAGMENT_STARTS:
            continue
        if _alpha_ratio(definition) < 0.6:
            continue

        candidates.append(
            {
                "source_id": _normalize_text(item.get("id")),
                "answer": answer,
                "definition": definition,
                "explanation_short": _normalize_text(item.get("explanation_short")) or answer,
                "explanation_long": _normalize_text(item.get("explanation_long")) or definition,
                "source_ref": source_ref,
                "topic": "Plumbing Terminology",
                "subtopic": "ASPE Definitions",
                "tags": ["aspe", "definition", "identification", "raw-reference"],
            }
        )

    deduped_by_term: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        answer_key = candidate["answer"].lower()
        existing = deduped_by_term.get(answer_key)
        if existing is None or _quality_score(candidate) < _quality_score(existing):
            deduped_by_term[answer_key] = candidate

    ordered_candidates = list(deduped_by_term.values())
    ordered_candidates.sort(
        key=lambda candidate: (
            _quality_score(candidate),
            candidate["answer"].lower(),
            candidate["source_id"],
        )
    )
    return ordered_candidates


def _select_candidates(candidates: list[dict[str, Any]], target_count: int) -> list[dict[str, Any]]:
    if len(candidates) <= target_count:
        return candidates

    selected: list[dict[str, Any]] = []
    used_indexes: set[int] = set()
    step = len(candidates) / target_count

    for index in range(target_count):
        pointer = int(index * step)
        while pointer in used_indexes and pointer < len(candidates) - 1:
            pointer += 1
        used_indexes.add(pointer)
        selected.append(candidates[pointer])

    return selected


def _distractor_sort_key(current: dict[str, Any], candidate: dict[str, Any]) -> tuple[int, int, str]:
    current_answer = current["answer"]
    candidate_answer = candidate["answer"]
    same_initial_bonus = 0 if current_answer[:1].lower() == candidate_answer[:1].lower() else 1
    word_count_distance = abs(len(current_answer.split()) - len(candidate_answer.split()))
    length_distance = abs(len(current_answer) - len(candidate_answer))
    stable_tiebreaker = hashlib.sha1(candidate["source_id"].encode("utf-8")).hexdigest()
    return (
        same_initial_bonus,
        word_count_distance * 10 + length_distance,
        stable_tiebreaker,
    )


def _pick_distractors(
    current: dict[str, Any], candidate_pool: list[dict[str, Any]]
) -> list[str] | None:
    current_answer = current["answer"].lower()
    eligible = [
        candidate
        for candidate in candidate_pool
        if candidate["source_id"] != current["source_id"]
        and candidate["answer"].lower() != current_answer
        and current_answer not in candidate["answer"].lower()
        and candidate["answer"].lower() not in current_answer
    ]
    if len(eligible) < 3:
        return None

    eligible.sort(key=lambda candidate: _distractor_sort_key(current, candidate))
    return [candidate["answer"] for candidate in eligible[:3]]


def _build_question(current: dict[str, Any], candidate_pool: list[dict[str, Any]]) -> dict[str, Any] | None:
    distractors = _pick_distractors(current, candidate_pool)
    if distractors is None:
        return None

    slot_index = int(hashlib.sha1(current["source_id"].encode("utf-8")).hexdigest()[:2], 16) % 4
    answer_texts = distractors.copy()
    answer_texts.insert(slot_index, current["answer"])

    labels = ["A", "B", "C", "D"]
    choices = [{"label": label, "text": text} for label, text in zip(labels, answer_texts)]
    answer_key = labels[slot_index]
    difficulty = "Medium" if len(current["definition"]) > 120 or len(current["answer"].split()) > 2 else "Easy"

    return {
        "id": f"aspe-derived__{current['source_id']}",
        "topic": current["topic"],
        "subtopic": current["subtopic"],
        "difficulty": difficulty,
        "prompt": f"Which ASPE term matches this definition? {current['definition']}",
        "choices": choices,
        "answer_key": answer_key,
        "explanation_short": current["explanation_short"],
        "explanation_long": current["explanation_long"],
        "tags": sorted(set([*current["tags"], "aspe", "definition-match", "derived-mcq"])),
        "source_ref": current["source_ref"] or "ASPE glossary curated identification",
        "quality_flag": "ok",
    }


def publish_aspe_glossary_mcqs() -> Path:
    candidates = _load_candidates()
    selected_candidates = _select_candidates(candidates, TARGET_COUNT)
    questions: list[dict[str, Any]] = []

    for candidate in selected_candidates:
        question = _build_question(candidate, candidates)
        if question is not None:
            questions.append(question)

    payload = {
        "metadata": {
            "generator": "scripts/publish_derived_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(PUBLISHED_DIR / SOURCE_NAME),
            "promotion_strategy": "Derived MCQs from curated ASPE identification items",
            "candidate_count": len(candidates),
            "target_count": TARGET_COUNT,
            "question_count": len(questions),
        },
        "questions": questions,
        "flashcards": [],
        "identification": [],
    }

    output_path = PUBLISHED_DIR / OUTPUT_NAME
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path


def publish_aspe_reference_expansion() -> Path:
    existing_payload = json.loads((PUBLISHED_DIR / OUTPUT_NAME).read_text(encoding="utf-8"))
    excluded_terms = {
        next(choice["text"] for choice in question["choices"] if choice["label"] == question["answer_key"]).lower()
        for question in existing_payload.get("questions", [])
    }

    candidates = _load_reference_expansion_candidates(excluded_terms)
    selected_candidates = _select_candidates(candidates, EXPANSION_TARGET_COUNT)
    questions: list[dict[str, Any]] = []

    for candidate in selected_candidates:
        question = _build_question(candidate, candidates)
        if question is None:
            continue
        question["id"] = f"aspe-ref-derived__{candidate['source_id']}"
        question["source_ref"] = candidate["source_ref"] or "ASPE reference identification"
        questions.append(question)

    payload = {
        "metadata": {
            "generator": "scripts/publish_derived_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(DATA_DIR / RAW_REFERENCE_NAME),
            "promotion_strategy": "Derived MCQs from raw ASPE term-definition reference items",
            "candidate_count": len(candidates),
            "target_count": EXPANSION_TARGET_COUNT,
            "question_count": len(questions),
            "deduped_against": OUTPUT_NAME,
        },
        "questions": questions,
        "flashcards": [],
        "identification": [],
    }

    output_path = PUBLISHED_DIR / EXPANSION_OUTPUT_NAME
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path


def main() -> None:
    output_paths = [
        publish_aspe_glossary_mcqs(),
        publish_aspe_reference_expansion(),
    ]
    for output_path in output_paths:
        print(output_path)


if __name__ == "__main__":
    main()
