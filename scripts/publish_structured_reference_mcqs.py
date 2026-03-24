from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "backend" / "data"
STAGING_REVIEW_DIR = DATA_DIR / "staging" / "review"
PUBLISHED_DIR = DATA_DIR / "published"
RAW_REFERENCE_NAME = "reference_materials_generated.json"
OUTPUT_NAME = "structured_reference_mcq_curated.json"

ALLOWED_CONNECTORS = {"of", "and", "to", "for", "in", "with", "on", "or", "the"}
BAD_STARTS = {
    "about",
    "during",
    "sometime",
    "should",
    "allow",
    "take",
    "injure",
    "advertise",
    "devices",
    "each",
    "all",
    "no",
    "suitable",
    "used",
    "made",
    "thickness",
    "remarkably",
    "provide",
    "plumbing",
    "joints",
    "request",
    "set",
    "available",
    "lightweight",
    "figures",
}
BAD_TOKENS = {
    "happens",
    "process",
    "flow",
    "used",
    "made",
    "provide",
    "provides",
    "providing",
    "allow",
    "allows",
    "allowing",
    "shall",
    "should",
    "is",
    "are",
}
BAD_DEFINITION_STARTS = {"and", "or", "for", "with", "to", "of", "by", "in", "from"}
FAMILY_LIMITS = {"plumbing-code-terms": 40}
FAMILY_PRIORITY = {
    "accessibility": 5,
    "plumbing-materials": 5,
    "practical-tools": 5,
    "water-supply": 5,
    "plumbing-code-terms": 3,
}
ANSWER_BLOCKLIST = {
    "installed at",
    "wrenches",
    "wells",
    "primary branch",
    "maximum service temperature 180 °f",
    "bending pinone",
}


@dataclass(frozen=True, slots=True)
class FlashcardSourceConfig:
    source_name: str
    family: str
    topic: str
    subtopic: str
    tags: tuple[str, ...]


FLASHCARD_SOURCES: tuple[FlashcardSourceConfig, ...] = (
    FlashcardSourceConfig(
        source_name="spdi__water-supply-distribution__review__candidate__v1.json",
        family="water-supply",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Water Supply & Distribution",
        tags=("water-supply", "distribution", "definition-match", "derived-mcq"),
    ),
    FlashcardSourceConfig(
        source_name="spdi__plumbing-materials__review__candidate__v1.json",
        family="plumbing-materials",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Plumbing Materials",
        tags=("plumbing-materials", "definition-match", "derived-mcq"),
    ),
    FlashcardSourceConfig(
        source_name="terms-numbers__practical-problem-terms__review__candidate__v1.json",
        family="practical-tools",
        topic="Practical Problems and Experiences",
        subtopic="Tools & Practical Terms",
        tags=("practical", "tools", "definition-match", "derived-mcq"),
    ),
    FlashcardSourceConfig(
        source_name="terms-numbers__code-summary__review__candidate__v1.json",
        family="plumbing-code-terms",
        topic="Plumbing Code",
        subtopic="Code Summary Terms",
        tags=("plumbing-code", "terms", "definition-match", "derived-mcq"),
    ),
)

ACCESSIBILITY_SOURCE_REFS = {
    "3. Accessibility Law.pdf | Toilets & Baths",
    "3. Accessibility Law.pdf | Ramps",
    "3. Accessibility Law.pdf | Pathways, Sidewalks & Walkways",
    "3. Accessibility Law.pdf | Signages",
}


def _normalize_text(value: Any) -> str:
    text = str(value or "")
    text = re.sub(r"([A-Za-z])-\s*([A-Za-z])", r"\1\2", text)
    return " ".join(text.split())


def _alpha_ratio(text: str) -> float:
    if not text:
        return 0.0
    return sum(character.isalpha() for character in text) / len(text)


def _clean_answer(text: str) -> str:
    normalized = _normalize_text(text)
    if ":" in normalized:
        normalized = normalized.rsplit(":", 1)[-1].strip()
    normalized = re.sub(r"([A-Za-z0-9)])([=+])([A-Za-z])", r"\1 \2 \3", normalized)
    dash_parts = re.split(r"\s*(?:[=+]|[–—-])\s+", normalized, maxsplit=1)
    if len(dash_parts) == 2:
        left, right = dash_parts[0].strip(), dash_parts[1].strip()
        right_first = re.sub(r"[^A-Za-z]+", "", right.split(" ", 1)[0]).lower() if right else ""
        if not right or right_first in BAD_STARTS or right_first in BAD_TOKENS or right[:1].islower():
            normalized = left
        else:
            normalized = f"{left} {right}"
    normalized = re.sub(r"^\d+[.)]\s*", "", normalized)
    normalized = normalized.strip(" ,.;:–—-▪•")
    parenthetical = re.fullmatch(r"\((.+)\)", normalized)
    if parenthetical:
        normalized = parenthetical.group(1).strip()
    return normalized


def _clean_definition(text: str) -> str:
    normalized = _normalize_text(text).replace("▪", " ")
    normalized = re.sub(r"^[a-z]\s+(?=[A-Za-z])", "", normalized)
    normalized = normalized.lstrip(" ,.;:–—-▪•")
    return _normalize_text(normalized)


def _extract_flashcard_answer(front: str) -> str:
    text = _normalize_text(front)
    text_lower = text.lower()
    prefixes = ("what is the equivalent of ", "what is the ", "what is ")
    for prefix in prefixes:
        if text_lower.startswith(prefix):
            return _clean_answer(text[len(prefix) :].strip(" ?"))
    return ""


def _extract_prompt_definition(prompt: str) -> str:
    text = _normalize_text(prompt)
    marker = "Which term matches this description:"
    if text.startswith(marker):
        return _clean_definition(text[len(marker) :].strip(" :-"))
    return ""


def _looks_like_term(answer: str) -> bool:
    if not answer or len(answer) < 2 or len(answer) > 48:
        return False
    if answer.lower() in ANSWER_BLOCKLIST:
        return False
    if answer[0].isdigit():
        return False
    if any(character in answer for character in "[]{}?=+"):
        return False
    if "__" in answer:
        return False

    tokens = [token for token in re.split(r"\s+", answer) if token]
    if len(tokens) > 6:
        return False

    first_token = re.sub(r"[^A-Za-z]+", "", tokens[0]).lower()
    if first_token in BAD_STARTS:
        return False

    title_like_tokens = 0
    non_connector_tokens = 0
    for token in tokens:
        bare = re.sub(r"[^A-Za-z0-9.&()/+-]+", "", token)
        if not bare:
            continue
        token_lower = bare.lower().strip("./")
        if token_lower in BAD_TOKENS:
            return False
        if token_lower in ALLOWED_CONNECTORS:
            continue

        non_connector_tokens += 1
        if bare.isupper() or bare[:1].isupper() or any(character.isdigit() for character in bare):
            title_like_tokens += 1

    if non_connector_tokens == 0:
        return False
    return title_like_tokens / non_connector_tokens >= 0.7


def _looks_like_definition(definition: str) -> bool:
    if not definition:
        return False
    if len(definition) < 24 or len(definition) > 260:
        return False
    if definition.endswith("?"):
        return False
    if "Page " in definition:
        return False
    if len(definition.split()) < 5:
        return False
    if _alpha_ratio(definition) < 0.58:
        return False

    first_token = definition.split(" ", 1)[0].strip(",.;:-").lower()
    if first_token in BAD_DEFINITION_STARTS:
        return False
    return True


def _looks_like_code_summary_term(answer: str) -> bool:
    lawish = any(word in answer for word in ("Act", "Code", "Ordinance", "NAMPAP"))
    proper_name = bool(re.fullmatch(r"[A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,3}", answer))
    if lawish or proper_name:
        return True
    if len(answer.split()) < 2:
        return False
    blocked_fragments = (
        "Summary",
        "Natural Resources",
        "Lead to Cast Iron",
        "Quality of Materials",
        "Vent of",
    )
    return not any(fragment in answer for fragment in blocked_fragments)


def _load_payload(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _quality_score(candidate: dict[str, Any]) -> tuple[int, int, int]:
    definition = candidate["definition"]
    answer = candidate["answer"]
    return (
        abs(110 - len(definition)),
        len(answer.split()),
        len(answer),
    )


def _collect_flashcard_candidates() -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for config in FLASHCARD_SOURCES:
        payload = _load_payload(STAGING_REVIEW_DIR / config.source_name)
        for item in payload.get("flashcards", []):
            answer = _extract_flashcard_answer(str(item.get("front") or ""))
            definition = _clean_definition(str(item.get("back") or ""))
            if not _looks_like_term(answer) or not _looks_like_definition(definition):
                continue
            if config.family == "plumbing-code-terms" and not _looks_like_code_summary_term(answer):
                continue

            source_id = _normalize_text(item.get("id"))
            candidates.append(
                {
                    "source_id": source_id,
                    "family": config.family,
                    "answer": answer,
                    "definition": definition,
                    "topic": config.topic,
                    "subtopic": config.subtopic,
                    "tags": list(config.tags),
                    "source_ref": _normalize_text(item.get("source_ref")),
                    "explanation_short": _clean_definition(item.get("explanation_short")) or answer,
                    "explanation_long": _clean_definition(item.get("explanation_long")) or definition,
                }
            )
    return candidates


def _collect_accessibility_candidates() -> list[dict[str, Any]]:
    payload = _load_payload(DATA_DIR / RAW_REFERENCE_NAME)
    candidates: list[dict[str, Any]] = []
    for item in payload.get("identification", []):
        source_ref = _normalize_text(item.get("source_ref"))
        if source_ref not in ACCESSIBILITY_SOURCE_REFS:
            continue

        accepted_answers = item.get("accepted_answers") or []
        if len(accepted_answers) != 1:
            continue

        answer = _clean_answer(_normalize_text(accepted_answers[0]))
        definition = _extract_prompt_definition(str(item.get("prompt") or ""))
        if not _looks_like_term(answer) or not _looks_like_definition(definition):
            continue

        candidates.append(
            {
                "source_id": _normalize_text(item.get("id")),
                "family": "accessibility",
                "answer": answer,
                "definition": definition,
                "topic": "Sanitation, Plumbing Design and Installation",
                "subtopic": "Accessibility Law",
                "tags": ["accessibility", "definition-match", "derived-mcq"],
                "source_ref": source_ref,
                "explanation_short": _clean_definition(item.get("explanation_short")) or answer,
                "explanation_long": _clean_definition(item.get("explanation_long")) or definition,
            }
        )
    return candidates


def _dedupe_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        key = candidate["answer"].lower()
        existing = deduped.get(key)
        if existing is None:
            deduped[key] = candidate
            continue
        current_rank = (FAMILY_PRIORITY.get(candidate["family"], 0), tuple(-score for score in _quality_score(candidate)))
        existing_rank = (FAMILY_PRIORITY.get(existing["family"], 0), tuple(-score for score in _quality_score(existing)))
        if current_rank > existing_rank:
            deduped[key] = candidate

    family_map: dict[str, list[dict[str, Any]]] = {}
    for candidate in deduped.values():
        family_map.setdefault(candidate["family"], []).append(candidate)

    ordered: list[dict[str, Any]] = []
    for family in sorted(family_map):
        family_candidates = family_map[family]
        family_candidates.sort(key=lambda candidate: (_quality_score(candidate), candidate["answer"].lower()))
        limit = FAMILY_LIMITS.get(family)
        if limit is not None:
            family_candidates = family_candidates[:limit]
        ordered.extend(family_candidates)
    return ordered


def _distractor_sort_key(current: dict[str, Any], candidate: dict[str, Any]) -> tuple[int, int, str]:
    current_answer = current["answer"]
    candidate_answer = candidate["answer"]
    same_initial_bonus = 0 if current_answer[:1].lower() == candidate_answer[:1].lower() else 1
    word_count_distance = abs(len(current_answer.split()) - len(candidate_answer.split()))
    length_distance = abs(len(current_answer) - len(candidate_answer))
    stable_tiebreaker = hashlib.sha1(candidate["source_id"].encode("utf-8")).hexdigest()
    return (same_initial_bonus, word_count_distance * 10 + length_distance, stable_tiebreaker)


def _pick_distractors(current: dict[str, Any], family_pool: list[dict[str, Any]]) -> list[str] | None:
    current_answer = current["answer"].lower()
    eligible = [
        candidate
        for candidate in family_pool
        if candidate["source_id"] != current["source_id"]
        and candidate["answer"].lower() != current_answer
        and current_answer not in candidate["answer"].lower()
        and candidate["answer"].lower() not in current_answer
    ]
    if len(eligible) < 3:
        return None

    eligible.sort(key=lambda candidate: _distractor_sort_key(current, candidate))
    return [candidate["answer"] for candidate in eligible[:3]]


def _build_question(current: dict[str, Any], family_pool: list[dict[str, Any]]) -> dict[str, Any] | None:
    distractors = _pick_distractors(current, family_pool)
    if distractors is None:
        return None

    answer_slot = int(hashlib.sha1(current["source_id"].encode("utf-8")).hexdigest()[:2], 16) % 4
    option_texts = distractors.copy()
    option_texts.insert(answer_slot, current["answer"])
    labels = ["A", "B", "C", "D"]

    return {
        "id": f"structured-derived__{current['family']}__{current['source_id']}",
        "topic": current["topic"],
        "subtopic": current["subtopic"],
        "difficulty": "Medium" if len(current["definition"]) > 120 or len(current["answer"].split()) > 2 else "Easy",
        "prompt": f"Which term matches this definition? {current['definition']}",
        "choices": [{"label": label, "text": text} for label, text in zip(labels, option_texts)],
        "answer_key": labels[answer_slot],
        "explanation_short": current["explanation_short"],
        "explanation_long": current["explanation_long"],
        "tags": sorted(set([*current["tags"], current["family"]])),
        "source_ref": current["source_ref"] or current["family"],
        "quality_flag": "ok",
    }


def publish_structured_reference_mcqs() -> Path:
    candidates = _dedupe_candidates([
        *_collect_flashcard_candidates(),
        *_collect_accessibility_candidates(),
    ])
    family_map: dict[str, list[dict[str, Any]]] = {}
    for candidate in candidates:
        family_map.setdefault(candidate["family"], []).append(candidate)

    questions: list[dict[str, Any]] = []
    for candidate in candidates:
        family_pool = family_map.get(candidate["family"], [])
        question = _build_question(candidate, family_pool)
        if question is not None:
            questions.append(question)

    payload = {
        "metadata": {
            "generator": "scripts/publish_structured_reference_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_files": [config.source_name for config in FLASHCARD_SOURCES] + [RAW_REFERENCE_NAME],
            "promotion_strategy": "Derived MCQs from structured reference flashcards and identification prompts",
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
    print(publish_structured_reference_mcqs())


if __name__ == "__main__":
    main()
