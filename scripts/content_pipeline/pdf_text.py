from __future__ import annotations

import io
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

QUESTION_MARKER_RE = re.compile(r"\bQUESTION\s*#\s*(\d+)\b", re.IGNORECASE)

DEFAULT_TESSERACT_PATHS = (
    Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
    Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
)


@dataclass(slots=True)
class PdfPageText:
    page_number: int
    text: str
    extraction_method: str


@dataclass(slots=True)
class QuestionPageGroup:
    question_number: int
    pages: list[PdfPageText]

    @property
    def page_numbers(self) -> list[int]:
        return [page.page_number for page in self.pages]

    @property
    def combined_text(self) -> str:
        return "\n".join(page.text for page in self.pages if page.text)


def normalize_whitespace(text: str) -> str:
    """Collapse noisy spacing while preserving paragraph breaks."""
    if not text:
        return ""

    normalized_lines: list[str] = []
    for raw_line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        line = _normalize_line_spacing(raw_line)
        if line:
            normalized_lines.append(line)
    return "\n".join(normalized_lines)


def squash_text(text: str) -> str:
    """Collapse all whitespace into single spaces."""
    return " ".join(normalize_whitespace(text).split())


def _normalize_line_spacing(line: str) -> str:
    """Repair letter-spaced OCR/PDF text without over-editing normal lines."""
    raw_tokens = line.strip().split()
    if not raw_tokens:
        return ""

    short_token_count = sum(1 for token in raw_tokens if len(token) <= 2)
    if short_token_count / len(raw_tokens) < 0.55:
        return " ".join(raw_tokens)

    rebuilt: list[str] = []
    buffer = ""

    def flush_buffer() -> None:
        nonlocal buffer
        if buffer:
            rebuilt.append(buffer)
            buffer = ""

    for token in raw_tokens:
        if token in {"_", "__", "___"}:
            continue
        if token in {"&", "/", "-"}:
            flush_buffer()
            rebuilt.append(token)
            continue
        if token in {".", ",", "?", "!", ";", ":"}:
            if rebuilt:
                rebuilt[-1] = f"{rebuilt[-1]}{token}"
            else:
                rebuilt.append(token)
            continue
        if token in {"(", "[", "{"}:
            flush_buffer()
            rebuilt.append(token)
            continue
        if token in {")", "]", "}"}:
            flush_buffer()
            if rebuilt:
                rebuilt[-1] = f"{rebuilt[-1]}{token}"
            else:
                rebuilt.append(token)
            continue

        if token.isalpha() and len(token) <= 2:
            buffer += token
            continue

        flush_buffer()
        rebuilt.append(token)

    flush_buffer()

    cleaned: list[str] = []
    for token in rebuilt:
        if not cleaned:
            cleaned.append(token)
            continue
        if token in {".", ",", "?", "!", ";", ":"}:
            cleaned[-1] = f"{cleaned[-1]}{token}"
        elif token in {")", "]", "}"}:
            cleaned[-1] = f"{cleaned[-1]}{token}"
        elif token in {"(", "[", "{"}:
            cleaned.append(token)
        elif cleaned[-1] in {"(", "[", "{"}:
            cleaned[-1] = f"{cleaned[-1]}{token}"
        else:
            cleaned.append(token)

    return " ".join(cleaned)


def resolve_tesseract_cmd() -> str | None:
    """Find a local Tesseract executable on Windows or PATH."""
    explicit = os.environ.get("TESSERACT_CMD")
    if explicit:
        candidate = Path(explicit)
        if candidate.exists():
            return str(candidate)

    found = shutil.which("tesseract")
    if found:
        return found

    for candidate in DEFAULT_TESSERACT_PATHS:
        if candidate.exists():
            return str(candidate)
    return None


def configure_tesseract() -> bool:
    """Set pytesseract's command when a local installation is available."""
    cmd = resolve_tesseract_cmd()
    if not cmd:
        return False
    pytesseract.pytesseract.tesseract_cmd = cmd
    return True


def load_pdf(pdf_path: str | Path) -> fitz.Document:
    return fitz.open(str(pdf_path))


def _render_page_for_ocr(page: fitz.Page, zoom: float = 2.0) -> Image.Image:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.open(io.BytesIO(pixmap.tobytes("png")))


def _direct_page_text(page: fitz.Page) -> str:
    return normalize_whitespace(page.get_text("text", sort=True) or "")


def _ocr_page_text(page: fitz.Page) -> str:
    image = _render_page_for_ocr(page)
    text = pytesseract.image_to_string(image)
    return normalize_whitespace(text)


def _should_use_ocr(direct_text: str, *, min_chars: int = 40, min_words: int = 6) -> bool:
    if not direct_text:
        return True
    alpha_chars = sum(1 for char in direct_text if char.isalpha())
    words = len(direct_text.split())
    squashed_tokens = re.findall(
        r"\b[a-z]{12,}\b|\b[A-Z][a-z]{11,}\b|\b[a-z]+[A-Z][A-Za-z]*\b|\b[A-Z][a-z]+[A-Z][A-Za-z]*\b",
        direct_text,
    )
    return alpha_chars < min_chars or words < min_words or len(squashed_tokens) >= 1


def _alpha_count(text: str) -> int:
    return sum(1 for char in text if char.isalpha())


def _squashed_token_count(text: str) -> int:
    penalties = 0
    penalties += len(re.findall(r"\b[a-z]{12,}\b", text))
    penalties += len(re.findall(r"\b[a-z]+[A-Z][A-Za-z]*\b", text))
    penalties += len(re.findall(r"\b[A-Z][a-z]+[A-Z][A-Za-z]*\b", text))
    return penalties


def _should_prefer_ocr(direct_text: str, ocr_text: str) -> bool:
    if not ocr_text:
        return False
    if not direct_text:
        return True

    direct_alpha = _alpha_count(direct_text)
    ocr_alpha = _alpha_count(ocr_text)
    direct_words = len(direct_text.split())
    ocr_words = len(ocr_text.split())
    direct_penalty = _squashed_token_count(direct_text)
    ocr_penalty = _squashed_token_count(ocr_text)

    if ocr_alpha >= max(40, int(direct_alpha * 1.1)):
        return True
    if ocr_words >= max(8, int(direct_words * 1.1)):
        return True
    if direct_penalty > ocr_penalty and ocr_alpha >= max(24, int(direct_alpha * 0.45)):
        return True
    return False


def extract_pdf_page_texts(
    pdf_path: str | Path,
    *,
    ocr_fallback: bool = True,
    min_chars_for_direct_text: int = 40,
    min_words_for_direct_text: int = 6,
) -> list[PdfPageText]:
    """Extract page text using direct extraction first, OCR as a fallback."""
    configure_tesseract()
    document = load_pdf(pdf_path)
    pages: list[PdfPageText] = []

    try:
        for index in range(len(document)):
            page = document.load_page(index)
            direct_text = _direct_page_text(page)
            extraction_method = "direct"
            text = direct_text

            if ocr_fallback and _should_use_ocr(
                direct_text,
                min_chars=min_chars_for_direct_text,
                min_words=min_words_for_direct_text,
            ):
                try:
                    ocr_text = _ocr_page_text(page)
                except Exception:
                    ocr_text = ""
                if _should_prefer_ocr(direct_text, ocr_text):
                    text = ocr_text
                    extraction_method = "ocr"
                elif ocr_text and not direct_text:
                    text = ocr_text
                    extraction_method = "ocr"
                elif direct_text and ocr_text:
                    text = direct_text
                    extraction_method = "hybrid"

            text = _preserve_question_marker(direct_text, text)

            pages.append(
                PdfPageText(
                    page_number=index + 1,
                    text=text,
                    extraction_method=extraction_method,
                )
            )
    finally:
        document.close()

    return pages


def extract_question_markers(text: str) -> list[int]:
    return [int(match) for match in QUESTION_MARKER_RE.findall(text or "")]


def _preserve_question_marker(direct_text: str, extracted_text: str) -> str:
    if extract_question_markers(extracted_text):
        return extracted_text
    marker = QUESTION_MARKER_RE.search(direct_text or "")
    if not marker:
        return extracted_text
    header = marker.group(0).upper()
    if not extracted_text:
        return header
    return f"{header}\n{extracted_text}"


def group_question_pages(pages: Sequence[PdfPageText]) -> list[QuestionPageGroup]:
    """Group consecutive pages that belong to the same repeated QUESTION #n block."""
    groups: list[QuestionPageGroup] = []
    current: QuestionPageGroup | None = None

    for page in pages:
        markers = extract_question_markers(page.text)
        question_number = markers[0] if markers else None

        if question_number is None:
            if current is not None:
                current.pages.append(page)
            continue

        if current is None:
            current = QuestionPageGroup(question_number=question_number, pages=[page])
            continue

        if question_number == current.question_number:
            current.pages.append(page)
            continue

        groups.append(current)
        current = QuestionPageGroup(question_number=question_number, pages=[page])

    if current is not None:
        groups.append(current)

    return groups


def iter_question_groups(pdf_path: str | Path) -> list[QuestionPageGroup]:
    return group_question_pages(extract_pdf_page_texts(pdf_path))


def page_texts(groups: Iterable[QuestionPageGroup]) -> list[str]:
    return [group.combined_text for group in groups]
