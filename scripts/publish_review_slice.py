from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
STAGING_REVIEW_DIR = REPO_ROOT / "backend" / "data" / "staging" / "review"
PUBLISHED_DIR = REPO_ROOT / "backend" / "data" / "published"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _is_good_glossary_front(front: str) -> bool:
    if not front.startswith("What is ") or not front.endswith("?"):
        return False
    term = front[8:-1].strip()
    if len(term) < 2 or len(term) > 45:
        return False
    if len(term.split()) > 5:
        return False
    if any(character in term for character in ".;:!?="):
        return False
    return True


def _is_good_glossary_back(back: str) -> bool:
    text = " ".join(back.split())
    if len(text) < 18 or len(text) > 320:
        return False
    if text.endswith("?"):
        return False
    if text.lower().startswith(("what is ", "what term", "which term")):
        return False
    return True


def _is_good_identification(item: dict) -> bool:
    prompt = str(item.get("prompt") or "")
    accepted_answers = item.get("accepted_answers") or []
    if not prompt.startswith("What term matches this definition?"):
        return False
    if len(accepted_answers) != 1:
        return False

    answer = str(accepted_answers[0]).strip()
    if len(answer) < 2 or len(answer) > 45:
        return False
    if len(answer.split()) > 5:
        return False
    if any(character in answer for character in ".;:!?="):
        return False
    return True


def _is_good_reference_front(front: str) -> bool:
    text = " ".join(front.split())
    if len(text) < 8 or len(text) > 120:
        return False
    if not text.endswith("?"):
        return False
    if not text.lower().startswith(("what is ", "what is the ", "which ")):
        return False
    if re.fullmatch(r"what is \d[\d,\s:/-]*\?", text.lower()):
        return False
    return True


def _is_good_reference_back(back: str) -> bool:
    text = " ".join(back.split())
    if len(text) < 10 or len(text) > 320:
        return False
    if text.endswith("?"):
        return False
    return True


def _publish_reference_slice(source_name: str, output_name: str) -> Path:
    source_path = STAGING_REVIEW_DIR / source_name
    payload = _load_json(source_path)
    flashcards = [
        item
        for item in payload.get("flashcards", [])
        if _is_good_reference_front(str(item.get("front") or ""))
        and _is_good_reference_back(str(item.get("back") or ""))
    ]
    identification = [
        item for item in payload.get("identification", []) if _is_good_identification(item)
    ]

    published_payload = {
        "metadata": {
            "generator": "scripts/publish_review_slice.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(source_path),
            "promotion_strategy": "Filtered reference recall items only",
            "flashcard_count": len(flashcards),
            "identification_count": len(identification),
        },
        "questions": [],
        "flashcards": flashcards,
        "identification": identification,
    }

    PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PUBLISHED_DIR / output_name
    output_path.write_text(
        json.dumps(published_payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return output_path


def publish_aspe_glossary() -> Path:
    source_path = STAGING_REVIEW_DIR / "terms-numbers__aspe-terminology__review__candidate__v1.json"
    payload = _load_json(source_path)
    flashcards = [
        item
        for item in payload.get("flashcards", [])
        if _is_good_glossary_front(str(item.get("front") or ""))
        and _is_good_glossary_back(str(item.get("back") or ""))
    ]
    identification = [
        item for item in payload.get("identification", []) if _is_good_identification(item)
    ]

    published_payload = {
        "metadata": {
            "generator": "scripts/publish_review_slice.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "source_file": str(source_path),
            "source_slug": "terms-numbers__aspe-terminology",
            "promotion_strategy": "Filtered glossary definitions only",
            "flashcard_count": len(flashcards),
            "identification_count": len(identification),
        },
        "questions": [],
        "flashcards": flashcards,
        "identification": identification,
    }

    PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PUBLISHED_DIR / "aspe_glossary_curated.json"
    output_path.write_text(
        json.dumps(published_payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return output_path


def main() -> None:
    output_paths = [
      publish_aspe_glossary(),
      _publish_reference_slice(
          "tables__astm-nfpa__review__candidate__v1.json",
          "astm_nfpa_curated.json",
      ),
      _publish_reference_slice(
          "tables__plumbing-tools-reference__review__candidate__v1.json",
          "plumbing_tools_curated.json",
      ),
      _publish_reference_slice(
          "spdi__accessibility-law__review__candidate__v1.json",
          "accessibility_law_curated.json",
      ),
    ]
    for output_path in output_paths:
        print(output_path)


if __name__ == "__main__":
    main()
