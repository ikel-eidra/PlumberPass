from __future__ import annotations

import hashlib
import os
import re
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable, Sequence

import fitz
import pytesseract
from PIL import Image
import io


DEFAULT_TESSERACT_PATHS = [
    os.environ.get("TESSERACT_CMD", ""),
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

NOISE_PATTERNS = (
    r"^page\s+\d+",
    r"^source:",
    r"^master plumber licensure exam review",
    r"^no part of this module",
    r"^rjes educational consultancy",
    r"^engr\.",
    r"^w e e k\s+\d+",
    r"^question\s*#\d+",
)

STOPWORDS = {
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
}


@dataclass(slots=True)
class PageText:
    page_number: int
    text: str
    source_file: str


@dataclass(slots=True)
class FactCandidate:
    topic: str
    subtopic: str
    fact_type: str
    page_number: int
    prompt: str
    answer: str
    accepted_answers: list[str] = field(default_factory=list)
    explanation_short: str = ""
    explanation_long: str = ""
    tags: list[str] = field(default_factory=list)
    difficulty: int = 2
    source_ref: str = ""
    quality_flag: str = "review"
    confidence: float = 0.0


@dataclass(slots=True)
class ConversionResult:
    flashcards: list[dict]
    identification: list[dict]
    candidates: list[FactCandidate]


def _resolve_tesseract_cmd() -> str | None:
    for candidate in DEFAULT_TESSERACT_PATHS:
        if candidate and Path(candidate).exists():
            return candidate
    return None


def _normalize_text(value: str) -> str:
    value = value.replace("\x00", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\s+\n", "\n", value)
    return value.strip()


def _clean_line(line: str) -> str:
    line = _normalize_text(line)
    line = re.sub(r"^[\u2022\-–—*•o]+", "", line).strip()
    line = re.sub(r"^\d+\s*$", "", line).strip()
    return line


def _slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def _titleize(value: str) -> str:
    words = re.split(r"[\s_/\\-]+", value)
    return " ".join(word.capitalize() for word in words if word)


def _noise_line(line: str) -> bool:
    lowered = line.strip().lower()
    if not lowered:
        return True
    if re.match(r"^[a-d]\s*\.", lowered):
        return True
    if re.match(r"^question\s*#\s*\d+", lowered):
        return True
    return any(re.search(pattern, lowered) for pattern in NOISE_PATTERNS)


def _is_heading(line: str) -> bool:
    if not line or len(line) > 90:
        return False
    if line.endswith((".", "?", "!", ";", ":")):
        return False
    words = line.split()
    if len(words) > 10:
        return False

    alpha = [char for char in line if char.isalpha()]
    if not alpha:
        return False
    upper_ratio = sum(char.isupper() for char in alpha) / len(alpha)
    if upper_ratio >= 0.72:
        return True

    title_case_ratio = sum(word[:1].isupper() for word in words if word)
    return len(words) <= 6 and title_case_ratio >= max(2, len(words) - 1)


def _merge_wrapped_lines(lines: Sequence[str]) -> list[str]:
    merged: list[str] = []
    buffer: list[str] = []

    def flush() -> None:
        if buffer:
            merged.append(" ".join(buffer).strip())
            buffer.clear()

    for raw_line in lines:
        line = _clean_line(raw_line)
        if not line or _noise_line(line):
            flush()
            continue
        if _is_heading(line):
            flush()
            merged.append(line)
            continue

        if buffer:
            prev = buffer[-1]
            if (
                prev.endswith((":", "=", "-", "/"))
                or prev.lower().endswith(("and", "or", "of", "to", "for"))
                or len(prev.split()) < 4
                and len(line.split()) <= 6
                and not line[0].isupper()
            ):
                buffer.append(line)
                continue

        if buffer and not re.search(r"[.!?;:]$", buffer[-1]) and not line[:1].isupper():
            buffer.append(line)
        else:
            flush()
            buffer.append(line)

    flush()
    return merged


def _extract_pdfplumber_text(pdf_path: Path) -> list[PageText]:
    pages: list[PageText] = []
    doc = fitz.open(pdf_path)
    tesseract_cmd = _resolve_tesseract_cmd()
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        text = _normalize_text(page.get_text("text") or "")
        if len(text.split()) < 25 and tesseract_cmd:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image = Image.open(io.BytesIO(pix.tobytes("png")))
            text = _normalize_text(pytesseract.image_to_string(image))
        pages.append(
            PageText(
                page_number=page_index + 1,
                text=text,
                source_file=pdf_path.name,
            )
        )

    return pages


def extract_pdf_pages(pdf_path: str | Path) -> list[PageText]:
    return _extract_pdfplumber_text(Path(pdf_path))


def _section_name_from_heading(line: str) -> str:
    cleaned = line.strip().strip(":")
    cleaned = re.sub(r"^chapter\s+\d+\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^section\s+\d+(\.\d+)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("&", "and")
    return _titleize(cleaned)


def _looks_like_value_only(line: str) -> bool:
    if len(line.split()) > 6:
        return False
    if re.fullmatch(r"[\d.,/\-\sA-Za-z()]+", line) is None:
        return False
    if any(word in line.lower() for word in ("permit", "law", "definition", "means")):
        return False
    return True


def _looks_like_definition_line(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in (" means ", " is ", " are ", " refers to ", " denotes "))


def _looks_like_term_phrase(text: str) -> bool:
    text = text.strip().strip("-:")
    if not text:
        return False
    words = text.split()
    if not words or len(words) > 8:
        return False
    first = words[0].strip("()[],.:;")
    if first.lower() in STOPWORDS:
        return False
    if first.isupper():
        return True
    if any(char.isdigit() for char in first):
        return True
    return first[:1].isupper()


def _normalize_term_definition_pair(term: str, definition: str) -> tuple[str, str] | None:
    term_clean = _clean_line(term)
    definition_clean = _clean_line(definition)
    if not term_clean or not definition_clean:
        return None
    if not _looks_like_term_phrase(term_clean):
        return None

    term_tokens = [token.strip("()[],.:;") for token in term_clean.split() if token.strip("()[],.:;")]
    definition_tokens = definition_clean.split()
    if len(term_tokens) > 7 or len(definition_tokens) < 3 or len(definition_tokens) > 80:
        return None

    if len(term_tokens) >= 3 and term_tokens[-1].lower() == term_tokens[-2].lower():
        trimmed_term = " ".join(term_tokens[:-1]).strip()
        if trimmed_term and _looks_like_term_phrase(trimmed_term):
            term_clean = trimmed_term
            term_tokens = [token.strip("()[],.:;") for token in term_clean.split() if token.strip("()[],.:;")]

    term_lower = [token.lower() for token in term_tokens]
    definition_lower = [token.strip("()[],.:;").lower() for token in definition_tokens]

    for overlap in range(min(len(term_lower), len(definition_lower)), 0, -1):
        if definition_lower[:overlap] == term_lower[-overlap:]:
            trimmed = " ".join(definition_tokens[overlap:]).strip()
            if len(trimmed.split()) >= 3:
                definition_clean = trimmed
            break

    if (
        len(term_lower) >= 2
        and definition_tokens
        and definition_lower[0] == term_lower[-1]
        and len(definition_tokens) >= 3
    ):
        trimmed = " ".join(definition_tokens[1:]).strip()
        if len(trimmed.split()) >= 3:
            definition_clean = trimmed

    if not definition_clean or len(definition_clean.split()) < 3:
        return None
    if sum(char.isalpha() for char in definition_clean) < 12:
        return None
    if len(definition_clean.split()) > 60 and sum(char.isdigit() for char in definition_clean) > 12:
        return None

    return term_clean, definition_clean


def _trim_repeated_heading_tail(text: str) -> str:
    tokens = text.split()
    if len(tokens) >= 3:
        prev = tokens[-2].strip("()[],.:;").lower()
        last = tokens[-1].strip("()[],.:;").lower()
        if prev and last and prev == last:
            return " ".join(tokens[:-1]).strip(" -:")
    return text.strip(" -:")


def _looks_like_term_heading(text: str) -> bool:
    text = text.strip().strip("-:")
    if not text or len(text) > 80:
        return False
    if re.search(r"[.!?]$", text):
        return False
    words = text.split()
    if not words or len(words) > 10:
        return False
    alpha_words = [word for word in words if any(char.isalpha() for char in word)]
    if not alpha_words:
        return False
    score = sum(
        1
        for word in alpha_words
        if word[:1].isupper() or word.isupper() or any(char.isdigit() for char in word)
    )
    return score >= max(1, len(alpha_words) - 1)


def _split_term_definition(line: str) -> tuple[str, str] | None:
    tokens = line.split()
    if len(tokens) < 4:
        return None

    for split_at in range(1, min(len(tokens), 6)):
        next_token = tokens[split_at].lower().strip(".,:;")
        term = " ".join(tokens[:split_at]).strip(" -:")
        definition = " ".join(tokens[split_at:]).strip()
        if next_token in {"the", "a", "an", "this", "that"}:
            normalized = _normalize_term_definition_pair(term, definition)
            if normalized is not None and _looks_like_term_heading(normalized[0]):
                return normalized

    for split_at in range(2, min(len(tokens), 7)):
        next_token = tokens[split_at]
        if next_token.lower().strip(".,:;") in STOPWORDS:
            term = " ".join(tokens[:split_at]).strip(" -:")
            definition = " ".join(tokens[split_at:]).strip()
            normalized = _normalize_term_definition_pair(term, definition)
            if normalized is not None:
                return normalized

    for split_at in range(2, min(len(tokens), 7)):
        term = " ".join(tokens[:split_at]).strip(" -:")
        definition = " ".join(tokens[split_at:]).strip()
        if term and definition and _looks_like_term_phrase(term) and definition[:1].islower():
            normalized = _normalize_term_definition_pair(term, definition)
            if normalized is not None:
                return normalized

    if " - " in line:
        left, right = line.split(" - ", 1)
        normalized = _normalize_term_definition_pair(left, right)
        if normalized is not None:
            return normalized

    return None


def _split_equivalence(line: str) -> tuple[str, str] | None:
    if "=" not in line:
        return None
    left, right = line.split("=", 1)
    left = left.strip(" -:")
    right = right.strip(" -:")
    if not left or not right:
        return None
    return left, right


def _extract_short_answer(prompt_line: str, value_line: str) -> tuple[str, str] | None:
    if not _looks_like_value_only(value_line):
        return None
    if len(prompt_line.split()) < 4:
        return None
    prompt = prompt_line.rstrip(".")
    answer = value_line.strip().rstrip(".")
    return prompt, answer


def _split_embedded_definition_marker(line: str) -> tuple[str, str] | None:
    lowered = line.lower()
    markers = (" means ", " refers to ", " denotes ", " is ", " are ")
    for marker in markers:
        index = lowered.find(marker)
        if index == -1:
            continue
        left = line[:index].strip(" -:")
        right = line[index + len(marker) :].strip(" -:")
        if 1 <= len(left.split()) <= 6 and _looks_like_term_phrase(left):
            normalized = _normalize_term_definition_pair(left, right)
            if normalized is not None:
                return normalized
    return None


def _difficulty_from_text(prompt: str, answer: str, fact_type: str) -> int:
    text = f"{prompt} {answer}".lower()
    score = 1
    if len(text.split()) > 18 or len(answer.split()) > 10:
        score += 1
    if any(token in text for token in ("law", "chapter", "section", "table")):
        score += 1
    if any(token in text for token in ("=", "mm", "cm", "psi", "kpa", "atm", "gpm", "lit", "fu")):
        score += 1
    if fact_type == "law-summary":
        score += 1
    return max(1, min(5, score))


def _quality_flag(confidence: float) -> str:
    if confidence >= 0.92:
        return "probable"
    if confidence >= 0.78:
        return "review"
    return "candidate"


def _answer_aliases(answer: str) -> list[str]:
    aliases = [answer.strip()]
    if "(" in answer and ")" in answer:
        aliases.append(re.sub(r"\s*\([^)]*\)", "", answer).strip())
    if "/" in answer:
        aliases.extend([part.strip() for part in answer.split("/") if part.strip()])
    return [alias for alias in dict.fromkeys(aliases) if alias]


def _make_source_ref(pdf_name: str, page_number: int, section: str | None) -> str:
    if section:
        return f"{pdf_name} | p.{page_number} | {section}"
    return f"{pdf_name} | p.{page_number}"


def _make_id(kind: str, pdf_name: str, page_number: int, prompt: str, answer: str) -> str:
    payload = f"{kind}|{pdf_name}|{page_number}|{prompt}|{answer}".encode("utf-8")
    digest = hashlib.sha1(payload).hexdigest()[:12]
    return f"{kind[:2].lower()}-{digest}"


def _tags_for_fact(source_group: str, section: str | None, fact_type: str) -> list[str]:
    tags = [_slugify(source_group), _slugify(fact_type)]
    if section:
        tags.append(_slugify(section))
    return list(dict.fromkeys(tags))


def _build_flashcard(candidate: FactCandidate, pdf_name: str, page_number: int) -> dict:
    return {
        "id": _make_id("flashcard", pdf_name, page_number, candidate.prompt, candidate.answer),
        "topic": candidate.topic,
        "subtopic": candidate.subtopic,
        "front": candidate.prompt,
        "back": candidate.answer,
        "explanation_short": candidate.explanation_short or candidate.answer,
        "explanation_long": candidate.explanation_long or candidate.answer,
        "tags": candidate.tags,
        "difficulty": candidate.difficulty,
        "source_ref": candidate.source_ref,
        "quality_flag": candidate.quality_flag,
    }


def _build_identification(candidate: FactCandidate, pdf_name: str, page_number: int) -> dict:
    prompt = candidate.prompt
    accepted_answers = _answer_aliases(candidate.answer)
    explanation_short = candidate.explanation_short or candidate.answer
    explanation_long = candidate.explanation_long or candidate.answer

    if candidate.fact_type == "definition" and candidate.accepted_answers:
        prompt = f"What term matches this definition? {candidate.answer}"
        accepted_answers = candidate.accepted_answers
        explanation_short = candidate.accepted_answers[0]
        explanation_long = f"{candidate.accepted_answers[0]}: {candidate.answer}"

    return {
        "id": _make_id("identification", pdf_name, page_number, candidate.prompt, candidate.answer),
        "topic": candidate.topic,
        "subtopic": candidate.subtopic,
        "prompt": prompt,
        "accepted_answers": accepted_answers,
        "explanation_short": explanation_short,
        "explanation_long": explanation_long,
        "tags": candidate.tags,
        "difficulty": candidate.difficulty,
        "source_ref": candidate.source_ref,
        "quality_flag": candidate.quality_flag,
    }


def _fact_from_term_definition(
    term: str,
    definition: str,
    *,
    source_group: str,
    section: str | None,
    pdf_name: str,
    page_number: int,
    fact_type: str = "definition",
    confidence: float = 0.88,
) -> FactCandidate | None:
    normalized = _normalize_term_definition_pair(term, definition)
    if normalized is None:
        return None
    term, definition = normalized
    topic = source_group
    subtopic = section or _titleize(source_group)
    prompt = f"What is {term.strip().rstrip(':')}?"
    answer = definition.strip().rstrip(".")
    return FactCandidate(
        topic=topic,
        subtopic=subtopic,
        fact_type=fact_type,
        page_number=page_number,
        prompt=prompt,
        answer=answer,
        accepted_answers=_answer_aliases(term),
        explanation_short=answer[:180],
        explanation_long=answer,
        tags=_tags_for_fact(source_group, section, fact_type),
        difficulty=_difficulty_from_text(prompt, answer, fact_type),
        source_ref=_make_source_ref(pdf_name, page_number, section),
        quality_flag=_quality_flag(confidence),
        confidence=confidence,
    )


def _fact_from_equivalence(
    left: str,
    right: str,
    *,
    source_group: str,
    section: str | None,
    pdf_name: str,
    page_number: int,
    fact_type: str = "conversion",
    confidence: float = 0.94,
) -> FactCandidate:
    topic = source_group
    subtopic = section or _titleize(source_group)
    left_clean = left.strip().rstrip(".")
    right_clean = right.strip().rstrip(".")
    prompt = f"What is the equivalent of {left_clean}?"
    return FactCandidate(
        topic=topic,
        subtopic=subtopic,
        fact_type=fact_type,
        page_number=page_number,
        prompt=prompt,
        answer=right_clean,
        accepted_answers=_answer_aliases(right_clean),
        explanation_short=right_clean[:180],
        explanation_long=f"{left_clean} = {right_clean}",
        tags=_tags_for_fact(source_group, section, fact_type),
        difficulty=_difficulty_from_text(prompt, right_clean, fact_type),
        source_ref=_make_source_ref(pdf_name, page_number, section),
        quality_flag=_quality_flag(confidence),
        confidence=confidence,
    )


def _fact_from_prompt_answer(
    prompt: str,
    answer: str,
    *,
    source_group: str,
    section: str | None,
    pdf_name: str,
    page_number: int,
    fact_type: str = "reference",
    confidence: float = 0.82,
) -> FactCandidate:
    topic = source_group
    subtopic = section or _titleize(source_group)
    prompt_clean = prompt.strip().rstrip(".")
    answer_clean = answer.strip().rstrip(".")
    prompt_text = prompt_clean
    if not prompt_text.endswith("?"):
        prompt_text = f"What is {prompt_text}?"
    return FactCandidate(
        topic=topic,
        subtopic=subtopic,
        fact_type=fact_type,
        page_number=page_number,
        prompt=prompt_text,
        answer=answer_clean,
        accepted_answers=_answer_aliases(answer_clean),
        explanation_short=answer_clean[:180],
        explanation_long=answer_clean,
        tags=_tags_for_fact(source_group, section, fact_type),
        difficulty=_difficulty_from_text(prompt_text, answer_clean, fact_type),
        source_ref=_make_source_ref(pdf_name, page_number, section),
        quality_flag=_quality_flag(confidence),
        confidence=confidence,
    )


def _candidate_from_bullet(
    line: str,
    *,
    source_group: str,
    section: str | None,
    pdf_name: str,
    page_number: int,
) -> FactCandidate | None:
    cleaned = re.sub(r"^[\u2022\-–—*•o]+\s*", "", line).strip()
    if not cleaned:
        return None

    if " - " in cleaned:
        left, right = cleaned.split(" - ", 1)
        if len(left.split()) <= 10 and len(right.split()) >= 3:
            confidence = 0.9 if any(char.isdigit() for char in left) else 0.84
            candidate = _fact_from_term_definition(
                left,
                right,
                source_group=source_group,
                section=section,
                pdf_name=pdf_name,
                page_number=page_number,
                fact_type="law-summary" if any(token in left.lower() for token in ("ra", "act", "law", "code")) else "reference",
                confidence=confidence,
            )
            if candidate is not None:
                return candidate

    split = _split_term_definition(cleaned)
    if split:
        left, right = split
        candidate = _fact_from_term_definition(
            left,
            right,
            source_group=source_group,
            section=section,
            pdf_name=pdf_name,
            page_number=page_number,
            confidence=0.8,
        )
        if candidate is not None:
            return candidate

    split = _split_embedded_definition_marker(cleaned)
    if split:
        left, right = split
        candidate = _fact_from_term_definition(
            left,
            right,
            source_group=source_group,
            section=section,
            pdf_name=pdf_name,
            page_number=page_number,
            confidence=0.82,
        )
        if candidate is not None:
            return candidate

    split = _split_equivalence(cleaned)
    if split:
        left, right = split
        return _fact_from_equivalence(
            left,
            right,
            source_group=source_group,
            section=section,
            pdf_name=pdf_name,
            page_number=page_number,
        )

    return None


def _extract_candidates_from_lines(
    lines: Sequence[str],
    *,
    source_group: str,
    pdf_name: str,
    page_number: int,
) -> list[FactCandidate]:
    candidates: list[FactCandidate] = []
    current_section: str | None = None
    normalized_lines = _merge_wrapped_lines(lines)
    index = 0

    while index < len(normalized_lines):
        line = normalized_lines[index].strip()
        if not line:
            index += 1
            continue

        if _is_heading(line):
            current_section = _section_name_from_heading(line)
            index += 1
            continue

        if index + 1 < len(normalized_lines):
            next_line = normalized_lines[index + 1].strip()
            if (
                _looks_like_term_heading(line)
                and next_line
                and not _is_heading(next_line)
                and not _noise_line(next_line)
                and len(next_line.split()) >= 4
            ):
                term_line = _trim_repeated_heading_tail(line)
                candidate = _fact_from_term_definition(
                        term_line,
                        next_line,
                        source_group=source_group,
                        section=current_section,
                        pdf_name=pdf_name,
                        page_number=page_number,
                        fact_type="law-summary"
                        if any(token in line.lower() for token in ("ra", "act", "law", "code", "section"))
                        else "definition",
                        confidence=0.9,
                    )
                if candidate is not None:
                    candidates.append(candidate)
                index += 2
                continue

        if _looks_like_value_only(line) and index + 1 < len(normalized_lines):
            next_line = normalized_lines[index + 1].strip()
            if len(next_line.split()) >= 5 and not _is_heading(next_line):
                candidate = _extract_short_answer(next_line, line)
                if candidate:
                    prompt, answer = candidate
                    candidates.append(
                        _fact_from_prompt_answer(
                            prompt,
                            answer,
                            source_group=source_group,
                            section=current_section,
                            pdf_name=pdf_name,
                            page_number=page_number,
                            fact_type="reference",
                            confidence=0.83,
                        )
                    )
                    index += 2
                    continue

        bullet_candidate = _candidate_from_bullet(
            line,
            source_group=source_group,
            section=current_section,
            pdf_name=pdf_name,
            page_number=page_number,
        )
        if bullet_candidate is not None:
            candidates.append(bullet_candidate)
            index += 1
            continue

        split = _split_equivalence(line)
        if split:
            left, right = split
            candidates.append(
                _fact_from_equivalence(
                    left,
                    right,
                    source_group=source_group,
                    section=current_section,
                    pdf_name=pdf_name,
                    page_number=page_number,
                    confidence=0.95,
                )
            )
            index += 1
            continue

        split = _split_term_definition(line)
        if split:
            left, right = split
            candidate = _fact_from_term_definition(
                    left,
                    right,
                    source_group=source_group,
                    section=current_section,
                    pdf_name=pdf_name,
                    page_number=page_number,
                    confidence=0.85,
                )
            if candidate is not None:
                candidates.append(candidate)
            index += 1
            continue

        index += 1

    return candidates


def _dedupe_candidates(candidates: Iterable[FactCandidate]) -> list[FactCandidate]:
    best_by_key: dict[str, FactCandidate] = {}
    for candidate in candidates:
        key = _slugify(f"{candidate.topic}|{candidate.subtopic}|{candidate.prompt}|{candidate.answer}")
        existing = best_by_key.get(key)
        if existing is None or candidate.confidence > existing.confidence:
            best_by_key[key] = candidate
    return list(best_by_key.values())


def convert_text_lines(
    lines: Sequence[str],
    *,
    source_group: str,
    pdf_name: str,
    page_number: int,
) -> ConversionResult:
    candidates = _dedupe_candidates(
        _extract_candidates_from_lines(
            lines,
            source_group=source_group,
            pdf_name=pdf_name,
            page_number=page_number,
        )
    )
    flashcards = [
        _build_flashcard(candidate, pdf_name, candidate.page_number) for candidate in candidates
    ]
    identification = [
        _build_identification(candidate, pdf_name, candidate.page_number) for candidate in candidates
    ]
    return ConversionResult(flashcards=flashcards, identification=identification, candidates=candidates)


def convert_reference_pdf(
    pdf_path: str | Path,
    *,
    source_group: str | None = None,
) -> ConversionResult:
    path = Path(pdf_path)
    group = source_group or _titleize(path.parent.name)
    pages = extract_pdf_pages(path)
    candidates: list[FactCandidate] = []
    for page in pages:
        lines = [line for line in page.text.splitlines() if line.strip()]
        page_result = convert_text_lines(
            lines,
            source_group=group,
            pdf_name=path.name,
            page_number=page.page_number,
        )
        candidates.extend(page_result.candidates)

    deduped = _dedupe_candidates(candidates)
    flashcards = [
        _build_flashcard(candidate, path.name, candidate.page_number) for candidate in deduped
    ]
    identification = [
        _build_identification(candidate, path.name, candidate.page_number) for candidate in deduped
    ]
    return ConversionResult(flashcards=flashcards, identification=identification, candidates=deduped)


def result_to_dict(result: ConversionResult) -> dict:
    return {
        "flashcards": result.flashcards,
        "identification": result.identification,
        "candidates": [asdict(candidate) for candidate in result.candidates],
    }


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Convert reference PDFs into study items.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--source-group", default=None)
    args = parser.parse_args()

    output = result_to_dict(convert_reference_pdf(args.pdf, source_group=args.source_group))
    print(json.dumps(output, indent=2, ensure_ascii=True))
