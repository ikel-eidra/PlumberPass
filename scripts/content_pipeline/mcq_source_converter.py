from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import pdfplumber

try:
    from .pdf_text import (
        PdfPageText,
        QuestionPageGroup,
        extract_pdf_page_texts,
        group_question_pages,
        normalize_whitespace,
        squash_text,
    )
except ImportError:  # pragma: no cover - script execution fallback
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from pdf_text import (  # type: ignore
        PdfPageText,
        QuestionPageGroup,
        extract_pdf_page_texts,
        group_question_pages,
        normalize_whitespace,
        squash_text,
    )

CHOICE_RE = re.compile(r"^[\.\-\*]?\s*([A-E])(?:[\.\):\-]?\s*)?(.*)$", re.IGNORECASE)
QUESTION_RE = re.compile(r"\bQUESTION\s*#\s*(\d+)\b", re.IGNORECASE)
EXPLICIT_ANSWER_RE = re.compile(
    r"\b(?:answer|correct answer|key|answer key|correct)\s*[:\-]?\s*([A-E])\b",
    re.IGNORECASE,
)
CORRECT_IS_RE = re.compile(
    r"\b(?:the\s+)?correct\s+answer\s+(?:is|was|should be)\s*([A-E])\b",
    re.IGNORECASE,
)
LETTER_EXPLANATION_RE = re.compile(r"(?m)^\s*([A-E])[\.\)]\s*(.+)$", re.IGNORECASE)

EVIDENCE_KEYWORDS = (
    "aspe",
    "rnpcp",
    "pde",
    "audel",
    "astm",
    "nfpa",
    "ra ",
    "chapter",
    "table",
    "according to",
    "should be",
    "means",
    "refers to",
    "is correct",
)

BOILERPLATE_KEYWORDS = (
    "educational consultancy",
    "master plumber licensure exam review",
    "advance q&a",
    "question #",
    "week ",
    "rjes",
    "engr.",
    "no part of this module",
)

UNLABELED_CHOICE_RE = re.compile(r"^[\.\-\*]\s+(.+)$")
STACKED_CHOICE_RE = re.compile(r"^\(?([A-D]|8|0)\)?[\.\)]?\s*(.*)$", re.IGNORECASE)
STACKED_PROMPT_BLOCKLIST = (
    "vice president",
    "copyright",
    "published simultaneously",
    "contents",
    "foreword",
    "acknowledgments",
    "about the authors",
    "introduction",
    "application for",
)


@dataclass(slots=True)
class ParsedQuestionPage:
    question_number: int | None
    prompt_lines: list[str]
    choices: dict[str, str]
    explanation_lines: list[str]


@dataclass(slots=True)
class CandidateQuestion:
    id: str
    topic: str
    subtopic: str
    difficulty: str
    prompt: str
    choices: list[dict[str, str]]
    answer_key: str | None
    explanation_short: str
    explanation_long: str
    tags: list[str]
    source_ref: str
    quality_flag: str
    source_pages: list[int]
    extraction_methods: list[str]
    confidence_notes: list[str]

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _is_boilerplate(line: str) -> bool:
    normalized = squash_text(line).lower()
    if not normalized:
        return True
    return any(keyword in normalized for keyword in BOILERPLATE_KEYWORDS)


def _clean_line(line: str) -> str:
    return normalize_whitespace(line).strip()


def _clean_prompt(text: str) -> str:
    lines = [_clean_line(line) for line in text.splitlines()]
    filtered = [line for line in lines if line and not _is_boilerplate(line)]
    prompt = squash_text(" ".join(filtered))
    prompt = prompt.replace("_", " ").strip()
    return re.sub(r"\s+", " ", prompt)


def _parse_question_page(text: str) -> ParsedQuestionPage:
    lines = [_clean_line(line) for line in normalize_whitespace(text).splitlines()]
    lines = [line for line in lines if line]

    question_number: int | None = None
    prompt_lines: list[str] = []
    explanation_lines: list[str] = []
    choices: dict[str, str] = {}
    current_choice: str | None = None
    seen_choices = False

    for line in lines:
        marker = QUESTION_RE.search(line)
        if marker and question_number is None:
            question_number = int(marker.group(1))
            continue

        choice_match = CHOICE_RE.match(line)
        if choice_match and _is_probable_choice_line(choice_match.group(1), choice_match.group(2), line):
            seen_choices = True
            current_choice = choice_match.group(1).upper()
            choice_text = choice_match.group(2).strip()
            if choice_text:
                existing = choices.get(current_choice, "")
                choices[current_choice] = " ".join(part for part in [existing, choice_text] if part).strip()
            else:
                choices.setdefault(current_choice, "")
            continue

        if seen_choices and current_choice and line and not _is_boilerplate(line):
            if line.startswith("(") or line.endswith(")") or len(line.split()) > 2:
                explanation_lines.append(line)
                continue
            if len(line) <= 3 and line.upper() in {"A", "B", "C", "D", "E"}:
                explanation_lines.append(line)
                continue
            existing = choices.get(current_choice, "")
            if (
                existing
                and len(line) <= 120
                and not QUESTION_RE.search(line)
                and (
                    line[:1].islower()
                    or line.startswith(("(", "/", "-"))
                    or existing.endswith(("/", "-", "(", ","))
                    or len(existing.split()) < 3
                )
            ):
                choices[current_choice] = f"{existing} {line}".strip()
                continue

        if seen_choices:
            explanation_lines.append(line)
        else:
            prompt_lines.append(line)

    if not choices:
        recovered_prompt_lines, recovered_choices, recovered_explanations = _recover_unlabeled_choices(lines)
        if recovered_choices:
            prompt_lines = recovered_prompt_lines or prompt_lines
            choices = recovered_choices
            explanation_lines.extend(recovered_explanations)

    return ParsedQuestionPage(
        question_number=question_number,
        prompt_lines=prompt_lines,
        choices=choices,
        explanation_lines=explanation_lines,
    )


def _recover_unlabeled_choices(lines: list[str]) -> tuple[list[str], dict[str, str], list[str]]:
    prompt_lines: list[str] = []
    explanation_lines: list[str] = []
    bullet_choices: list[str] = []
    seen_choice_block = False

    for line in lines:
        bullet_match = UNLABELED_CHOICE_RE.match(line)
        if bullet_match:
            seen_choice_block = True
            bullet_choices.append(bullet_match.group(1).strip())
            continue
        if seen_choice_block and not QUESTION_RE.search(line):
            explanation_lines.append(line)
            continue
        if not QUESTION_RE.search(line):
            prompt_lines.append(line)

    labeled_choices = _label_recovered_choices(bullet_choices)
    if labeled_choices:
        return prompt_lines, labeled_choices, explanation_lines

    joined_text = squash_text(" ".join(line for line in lines if not QUESTION_RE.search(line)))
    if not joined_text:
        return prompt_lines, {}, explanation_lines

    fragments = [fragment.strip() for fragment in re.split(r"\s+\.\s+", joined_text) if fragment.strip()]
    if len(fragments) < 3:
        return prompt_lines, {}, explanation_lines

    prompt = fragments[0]
    inline_choices = fragments[1:]
    if len(inline_choices) < 2:
        return prompt_lines, {}, explanation_lines

    labeled_choices = _label_recovered_choices(inline_choices[:5])
    if not labeled_choices:
        return prompt_lines, {}, explanation_lines

    overflow = inline_choices[len(labeled_choices) :]
    cleaned_overflow = [squash_text(part).strip() for part in overflow if squash_text(part).strip()]
    return [prompt], labeled_choices, cleaned_overflow


def _label_recovered_choices(choice_texts: list[str]) -> dict[str, str]:
    cleaned_choices: list[str] = []
    for choice_text in choice_texts:
        cleaned = _clean_recovered_choice(choice_text)
        if cleaned:
            cleaned_choices.append(cleaned)

    if len(cleaned_choices) < 2:
        return {}

    labels = ["A", "B", "C", "D", "E"]
    return {
        label: cleaned_choices[index]
        for index, label in enumerate(labels[: len(cleaned_choices)])
    }


def _clean_recovered_choice(text: str) -> str:
    cleaned = squash_text(text).strip(" .,-")
    cleaned = re.sub(r"^(?:RJES EDUCATIONAL CONSULTANCY)\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\b(?:Figure\b|Courtesy\b|Schedule\s*=|Depth of equivalent area|Width of Rectangular Gutter|standard conversion)\b.*$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip(" .,-")
    return cleaned


def _is_probable_choice_line(label: str, choice_text: str, raw_line: str) -> bool:
    """Reject sentence-like lines that happen to begin with a choice letter."""
    normalized = squash_text(raw_line)
    if not normalized:
        return False

    stripped = normalized.lstrip(".-* ")
    if not stripped:
        return False

    if not stripped.upper().startswith(label.upper()):
        return False

    remainder = choice_text.strip()
    if not remainder:
        return True

    first_char = remainder[0]
    if first_char.isupper() or first_char.isdigit() or first_char in "([{":
        return True
    if normalized[:2].upper() in {f"{label.upper()}.", f"{label.upper()})"}:
        return True
    return False


def _merge_choice_texts(existing: dict[str, str], incoming: dict[str, str]) -> dict[str, str]:
    merged = dict(existing)
    for label, text in incoming.items():
        cleaned = squash_text(text)
        if not cleaned:
            merged.setdefault(label, "")
            continue
        current = merged.get(label, "")
        if len(cleaned) > len(current):
            merged[label] = cleaned
        elif not current:
            merged[label] = cleaned
    return merged


def _choice_list(choices: dict[str, str]) -> list[dict[str, str]]:
    return [{"label": label, "text": squash_text(text)} for label, text in sorted(choices.items()) if text]


def _collect_explanations(parsed_pages: Iterable[ParsedQuestionPage]) -> str:
    lines: list[str] = []
    for parsed in parsed_pages:
        for line in parsed.explanation_lines:
            if not _is_boilerplate(line):
                lines.append(line)
    return "\n".join(lines)


def _score_answer_from_explanation(explanation: str) -> tuple[str | None, str, list[str]]:
    notes: list[str] = []
    if not explanation:
        return None, "review", ["No explanation text extracted"]

    explicit = EXPLICIT_ANSWER_RE.search(explanation) or CORRECT_IS_RE.search(explanation)
    if explicit:
        answer_key = explicit.group(1).upper()
        notes.append(f"Explicit answer signal: {answer_key}")
        return answer_key, "verified", notes

    scored_hits: list[tuple[int, str, str]] = []
    for match in LETTER_EXPLANATION_RE.finditer(explanation):
        label = match.group(1).upper()
        body = match.group(2).strip()
        score = 0
        lowered = body.lower()
        if any(keyword in lowered for keyword in EVIDENCE_KEYWORDS):
            score += 3
        if re.search(r"\b(?:RA|PD|BP)\s*\d+", body, re.IGNORECASE):
            score += 2
        if re.search(r"\bChapter\s+\d+", body, re.IGNORECASE):
            score += 1
        if re.search(r"\bTable\s+\w+", body, re.IGNORECASE):
            score += 1
        if len(body) > 12:
            score += 1
        if score:
            scored_hits.append((score, label, body))

    if scored_hits:
        scored_hits.sort(key=lambda item: (item[0], len(item[2])), reverse=True)
        best_score, best_label, best_body = scored_hits[0]
        confidence = "probable" if best_score >= 3 else "candidate"
        notes.append(f"Explanation line suggests {best_label}: {best_body[:120]}")
        return best_label, confidence, notes

    return None, "review", ["Could not confirm answer from explanation text"]


def _score_answer_from_choice_annotations(
    base_choices: dict[str, str], merged_choices: dict[str, str]
) -> tuple[str | None, str, list[str]]:
    annotated: list[tuple[int, str, str]] = []

    for label, merged_text in merged_choices.items():
        base_text = squash_text(base_choices.get(label, ""))
        merged_clean = squash_text(merged_text)
        extra_text = merged_clean
        if base_text and merged_clean.startswith(base_text):
            extra_text = merged_clean[len(base_text) :].strip(" -,:;")

        score = 0
        lowered = merged_clean.lower()
        if any(keyword in lowered for keyword in EVIDENCE_KEYWORDS):
            score += 3
        if re.search(r"\([^)]{6,}\)", merged_clean):
            score += 1
        if len(merged_clean) - len(base_text) > 10:
            score += 1
        if extra_text and extra_text != merged_clean:
            score += 1

        if score:
            annotated.append((score, label, extra_text or merged_clean))

    if len(annotated) == 1:
        score, label, evidence = annotated[0]
        if score < 3 and not re.search(r"\(|\b(?:ra|rnpcp|aspe|chapter|table)\b", evidence, re.IGNORECASE):
            return None, "review", ["Single annotated choice looked like a caption, not answer evidence"]
        confidence = "probable" if score >= 3 else "candidate"
        return label, confidence, [f"Only annotated choice: {label} -> {evidence[:120]}"]

    annotated_labels = {label for _, label, _ in annotated}
    if len(base_choices) >= 3 and len(annotated_labels) == len(base_choices) - 1:
        unannotated = [label for label in base_choices if label not in annotated_labels]
        if len(unannotated) == 1:
            label = unannotated[0]
            return label, "probable", [f"Only unannotated choice after explanation page: {label}"]

    return None, "review", ["Could not infer answer from annotated choices"]


def _guess_topic(prompt: str, explanation: str) -> str:
    haystack = f"{prompt} {explanation}".lower()
    rules = (
        ("Sanitary and Plumbing Systems", ("water", "sewage", "septic", "drain", "sanitation", "fixture unit")),
        ("Plumbing Materials and Specifications", ("pipe", "copper", "pvc", "galvanized", "material", "astm")),
        ("Codes and Standards", ("code", "chapter", "table", "rnpcp", "ra ", "bp ", "pd ", "nfpa", "ansi")),
        ("Plumbing Arithmetic", ("ft", "psi", "gpm", "lps", "conversion", "capacity", "volume", "pressure")),
        ("Fire Protection and Safety", ("fire", "sprinkler", "extinguisher", "gas")),
        ("Definitions and Terminology", ("means", "definition", "term", "called", "known as")),
    )
    for topic, keywords in rules:
        if any(keyword in haystack for keyword in keywords):
            return topic
    return "General Plumbing"


def _guess_subtopic(prompt: str, explanation: str) -> str:
    haystack = f"{prompt} {explanation}".lower()
    rules = (
        ("Water Supply", ("water supply", "water hammer", "distribution", "pump")),
        ("Drainage", ("drain", "septic", "waste", "soil stack", "vent")),
        ("Materials", ("pipe", "fittings", "copper", "pvc", "asbestos", "brass")),
        ("Laws and Codes", ("law", "code", "chapter", "ra ", "pd ", "bp ")),
        ("Conversions", ("conversion", "atm", "psi", "kpa", "gpm", "lps")),
        ("Terminology", ("definition", "term", "means", "called", "known as")),
    )
    for subtopic, keywords in rules:
        if any(keyword in haystack for keyword in keywords):
            return subtopic
    return "General"


def _guess_difficulty(prompt: str, explanation: str) -> str:
    text = f"{prompt} {explanation}"
    if len(text) > 320 or len(re.findall(r"\b\d+(\.\d+)?\b", text)) >= 4:
        return "Hard"
    if len(text) > 180 or "chapter" in text.lower() or "table" in text.lower():
        return "Medium"
    return "Easy"


def _build_source_ref(pdf_path: str | Path, question_number: int | None, page_numbers: list[int]) -> str:
    path = Path(pdf_path)
    page_label = "-".join(str(page) for page in page_numbers) if page_numbers else "unknown"
    q_label = f"Q#{question_number}" if question_number is not None else "Q#?"
    return f"{path.name} | {q_label} | pages {page_label}"


def _quality_flag(answer_key: str | None, answer_confidence: str, has_explanation: bool, used_ocr: bool) -> str:
    if answer_key is None:
        return "review" if not has_explanation else "candidate"
    if answer_confidence == "verified" and not used_ocr:
        return "verified"
    if answer_confidence in {"verified", "probable"}:
        return "probable"
    return "candidate"


def _dedupe_lines(lines: Iterable[str]) -> list[str]:
    deduped: list[str] = []
    previous = ""
    for raw_line in lines:
        cleaned = _clean_line(raw_line)
        if not cleaned or _is_boilerplate(cleaned):
            continue
        if cleaned == previous:
            continue
        deduped.append(cleaned)
        previous = cleaned
    return deduped


def _parse_slide_mcq_page(text: str) -> ParsedQuestionPage:
    lines = _dedupe_lines(normalize_whitespace(text).splitlines())
    prompt_lines: list[str] = []
    explanation_lines: list[str] = []
    choices: dict[str, str] = {}
    current_choice: str | None = None
    seen_choices = False

    for line in lines:
        choice_match = CHOICE_RE.match(line)
        if choice_match and _is_probable_choice_line(choice_match.group(1), choice_match.group(2), line):
            seen_choices = True
            current_choice = choice_match.group(1).upper()
            choice_text = squash_text(choice_match.group(2))
            if choice_text:
                choices[current_choice] = choice_text
            continue

        if seen_choices and current_choice:
            current = choices.get(current_choice, "")
            if current and len(line) <= 120 and not CHOICE_RE.match(line):
                choices[current_choice] = f"{current} {line}".strip()
                continue
            explanation_lines.append(line)
            continue

        prompt_lines.append(line)

    return ParsedQuestionPage(
        question_number=None,
        prompt_lines=prompt_lines,
        choices=choices,
        explanation_lines=explanation_lines,
    )


def _normalize_stacked_label(label: str) -> str | None:
    normalized = label.upper()
    if normalized == "8":
        return "B"
    if normalized == "0":
        return "D"
    if normalized in {"A", "B", "C", "D"}:
        return normalized
    return None


def _looks_like_new_stacked_prompt(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if STACKED_CHOICE_RE.match(stripped):
        return False
    if re.match(r"^\d+[\.\)]\s*", stripped):
        return True
    if len(stripped.split()) < 3:
        return False
    return stripped[:1].isupper() or stripped[:1].isdigit()


def _parse_stacked_mcq_entries(text: str) -> list[tuple[list[str], dict[str, str]]]:
    lines = _dedupe_lines(normalize_whitespace(text).splitlines())
    entries: list[tuple[list[str], dict[str, str]]] = []
    prompt_lines: list[str] = []
    choices: dict[str, str] = {}
    current_choice: str | None = None

    def flush() -> None:
        nonlocal prompt_lines, choices, current_choice
        if prompt_lines and len(choices) >= 2:
            entries.append((prompt_lines.copy(), dict(choices)))
        prompt_lines = []
        choices = {}
        current_choice = None

    for line in lines:
        if _is_boilerplate(line):
            continue

        choice_match = STACKED_CHOICE_RE.match(line)
        if choice_match:
            label = _normalize_stacked_label(choice_match.group(1))
            if not label:
                continue
            if label == "A" and choices and len(choices) >= 2:
                flush()
            current_choice = label
            choice_text = squash_text(choice_match.group(2))
            if choice_text:
                choices[label] = choice_text
            else:
                choices.setdefault(label, "")
            continue

        cleaned_line = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
        if current_choice and len(choices) >= 4 and _looks_like_new_stacked_prompt(cleaned_line):
            flush()

        if current_choice and choices:
            if current_choice in choices and choices[current_choice]:
                choices[current_choice] = f"{choices[current_choice]} {cleaned_line}".strip()
            else:
                choices[current_choice] = cleaned_line
            continue

        if cleaned_line:
            prompt_lines.append(cleaned_line)

    flush()
    return entries


def _convert_stacked_mcq_pdf(
    pdf_path: str | Path,
    *,
    ocr_fallback: bool,
    source_slug: str | None,
    topic_hint: str | None,
    subtopic_hint: str | None,
) -> list[dict[str, object]]:
    path = Path(pdf_path)
    page_texts = extract_pdf_page_texts(path, ocr_fallback=ocr_fallback)
    candidates: list[dict[str, object]] = []
    question_number = 1

    for page in page_texts:
        entries = _parse_stacked_mcq_entries(page.text)
        for prompt_lines, choices in entries:
            prompt = _clean_prompt("\n".join(prompt_lines))
            choice_list = _choice_list(choices)
            if not prompt or len(choice_list) < 2 or not _looks_like_stacked_prompt(prompt):
                continue

            candidate = CandidateQuestion(
                id=f"{(source_slug or path.stem.replace(' ', '_').lower())}-q{question_number:03d}",
                topic=topic_hint or _guess_topic(prompt, ""),
                subtopic=subtopic_hint or _guess_subtopic(prompt, ""),
                difficulty=_guess_difficulty(prompt, ""),
                prompt=prompt,
                choices=choice_list,
                answer_key=None,
                explanation_short="Answer key not recovered from stacked question source.",
                explanation_long="Answer key not recovered from stacked question source.",
                tags=["stacked-mcq", "review-required"],
                source_ref=_build_source_ref(path, question_number, [page.page_number]),
                quality_flag="review",
                source_pages=[page.page_number],
                extraction_methods=[page.extraction_method],
                confidence_notes=["Parsed from stacked MCQ layout without answer key recovery."],
            )
            candidates.append(candidate.to_dict())
            question_number += 1

    return candidates


def _looks_like_stacked_prompt(prompt: str) -> bool:
    normalized = squash_text(prompt).lower()
    if len(normalized.split()) < 4:
        return False
    if not normalized.endswith("?") and "?" not in normalized:
        return False
    if any(token in normalized for token in STACKED_PROMPT_BLOCKLIST):
        return False
    return True


def _color_is_red(value: object) -> bool:
    if not isinstance(value, tuple) or len(value) < 3:
        return False
    red, green, blue = value[:3]
    return red >= 0.9 and green <= 0.15 and blue <= 0.15


def _infer_arithmetic_answer(answer_page: pdfplumber.page.Page) -> str | None:
    words = answer_page.extract_words(extra_attrs=["top", "bottom"])
    choice_rows: dict[str, list[float]] = {}
    for word in words:
        text = str(word.get("text", "")).strip().upper()
        if text not in {"A.", "B.", "C.", "D.", "E."}:
            continue
        if (word.get("bottom", 0) - word.get("top", 0)) < 10:
            continue
        choice_rows.setdefault(text[0], []).append(float(word["top"]))

    if not choice_rows:
        return None

    for rect in answer_page.rects:
        if not _color_is_red(rect.get("non_stroking_color")):
            continue
        rect_top = float(rect.get("top", 0))
        rect_bottom = float(rect.get("bottom", 0))
        for label, tops in choice_rows.items():
            if any(rect_top <= top <= rect_bottom for top in tops):
                return label
    return None


def _convert_plumbing_arithmetic_pdf(
    pdf_path: str | Path,
    *,
    source_slug: str | None,
    topic_hint: str | None,
    subtopic_hint: str | None,
) -> list[dict[str, object]]:
    path = Path(pdf_path)
    page_texts = extract_pdf_page_texts(path, ocr_fallback=True)
    candidates: list[dict[str, object]] = []

    with pdfplumber.open(path) as pdf:
        question_number = 1
        index = 0
        while index + 1 < len(page_texts):
            question_page = _parse_slide_mcq_page(page_texts[index].text)
            answer_page = _parse_slide_mcq_page(page_texts[index + 1].text)

            if not question_page.prompt_lines or len(question_page.choices) < 2:
                index += 1
                continue

            prompt = _clean_prompt("\n".join(question_page.prompt_lines))
            if not prompt:
                index += 1
                continue

            merged_choices = _merge_choice_texts(question_page.choices, answer_page.choices)
            choice_list = _choice_list(merged_choices)
            if len(choice_list) < 2:
                index += 1
                continue

            answer_key = _infer_arithmetic_answer(pdf.pages[index + 1])
            source_pages = [page_texts[index].page_number, page_texts[index + 1].page_number]
            prompt_text = prompt.rstrip("?")
            explanation_short = (
                f"Detected from highlighted answer slide for {prompt_text}."
                if answer_key
                else "Answer highlight not detected automatically."
            )

            candidate = CandidateQuestion(
                id=f"{source_slug or path.stem.replace(' ', '_').lower()}-q{question_number:03d}",
                topic=topic_hint or "Plumbing Arithmetic",
                subtopic=subtopic_hint or "Terms",
                difficulty=_guess_difficulty(prompt, ""),
                prompt=prompt,
                choices=choice_list,
                answer_key=answer_key,
                explanation_short=explanation_short,
                explanation_long=explanation_short,
                tags=["plumbing-arithmetic", "ocr-slide-bank"],
                source_ref=_build_source_ref(path, question_number, source_pages),
                quality_flag="probable" if answer_key else "review",
                source_pages=source_pages,
                extraction_methods=[
                    page_texts[index].extraction_method,
                    page_texts[index + 1].extraction_method,
                ],
                confidence_notes=[
                    "Answer key inferred from red highlight rectangle on paired answer page."
                    if answer_key
                    else "No red highlight rectangle matched a choice row on the paired answer page."
                ],
            )
            candidates.append(candidate.to_dict())
            question_number += 1
            index += 2

    return candidates


def convert_question_bank_pdf(
    pdf_path: str | Path,
    *,
    ocr_fallback: bool = True,
    source_slug: str | None = None,
    topic_hint: str | None = None,
    subtopic_hint: str | None = None,
    material_group: str | None = None,
) -> list[dict[str, object]]:
    """Convert a direct question-bank PDF into MCQ candidate dictionaries."""
    if material_group == "plumbing-arithmetic":
        return _convert_plumbing_arithmetic_pdf(
            pdf_path,
            source_slug=source_slug,
            topic_hint=topic_hint,
            subtopic_hint=subtopic_hint,
        )

    page_texts = extract_pdf_page_texts(pdf_path, ocr_fallback=ocr_fallback)
    groups = group_question_pages(page_texts)
    candidates: list[dict[str, object]] = []

    for group in groups:
        parsed_pages = [_parse_question_page(page.text) for page in group.pages]
        question_pages = [parsed for parsed in parsed_pages if parsed.choices]
        if not question_pages:
            continue

        first_page = question_pages[0]
        prompt = _clean_prompt("\n".join(first_page.prompt_lines))
        choices = dict(first_page.choices)
        explanation = _collect_explanations(parsed_pages)

        for parsed in question_pages[1:]:
            choices = _merge_choice_texts(choices, parsed.choices)

        answer_key, answer_confidence, notes = _score_answer_from_explanation(explanation)
        if answer_key is None:
            answer_key, answer_confidence, choice_notes = _score_answer_from_choice_annotations(
                first_page.choices, choices
            )
            notes.extend(choice_notes)
        used_ocr = any(page.extraction_method in {"ocr", "hybrid"} for page in group.pages)
        quality_flag = _quality_flag(answer_key, answer_confidence, bool(explanation), used_ocr)

        candidate = CandidateQuestion(
            id=f"{(source_slug or Path(pdf_path).stem.replace(' ', '_').lower())}-q{group.question_number:03d}"
            if group.question_number is not None
            else f"{(source_slug or Path(pdf_path).stem.replace(' ', '_').lower())}-qunknown",
            topic=topic_hint or _guess_topic(prompt, explanation),
            subtopic=subtopic_hint or _guess_subtopic(prompt, explanation),
            difficulty=_guess_difficulty(prompt, explanation),
            prompt=prompt,
            choices=_choice_list(choices),
            answer_key=answer_key,
            explanation_short=squash_text(explanation.splitlines()[0]) if explanation else "",
            explanation_long=squash_text(explanation),
            tags=[],
            source_ref=_build_source_ref(pdf_path, group.question_number, group.page_numbers),
            quality_flag=quality_flag,
            source_pages=group.page_numbers,
            extraction_methods=[page.extraction_method for page in group.pages],
            confidence_notes=notes,
        )
        candidates.append(candidate.to_dict())

    if candidates:
        return candidates

    if source_slug in {"reference__plumbing-arithmetic-book", "reference__audel-questions-answers"}:
        return _convert_stacked_mcq_pdf(
            pdf_path,
            ocr_fallback=ocr_fallback,
            source_slug=source_slug,
            topic_hint=topic_hint,
            subtopic_hint=subtopic_hint,
        )

    return candidates


def convert_pdf_to_json(
    pdf_path: str | Path,
    *,
    ocr_fallback: bool = True,
) -> dict[str, object]:
    candidates = convert_question_bank_pdf(pdf_path, ocr_fallback=ocr_fallback)
    return {
        "metadata": {
            "source_file": Path(pdf_path).name,
            "total_items": len(candidates),
            "converter": "mcq_source_converter",
        },
        "questions": candidates,
    }


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Convert question-bank PDFs to MCQ candidate JSON.")
    parser.add_argument("pdf", type=Path, help="Path to the source PDF.")
    parser.add_argument("--no-ocr", action="store_true", help="Disable OCR fallback.")
    parser.add_argument("--output", type=Path, help="Optional output JSON file.")
    return parser


def main() -> int:
    parser = _build_arg_parser()
    args = parser.parse_args()
    payload = convert_pdf_to_json(args.pdf, ocr_fallback=not args.no_ocr)
    serialized = json.dumps(payload, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(serialized, encoding="utf-8")
    else:
        print(serialized)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
