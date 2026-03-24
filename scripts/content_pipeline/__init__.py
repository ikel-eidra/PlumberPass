from .fact_source_converter import (
    ConversionResult,
    FactCandidate,
    PageText,
    convert_reference_pdf,
    convert_text_lines,
    extract_pdf_pages,
)
from .mcq_source_converter import convert_pdf_to_json, convert_question_bank_pdf
from .pdf_text import (
    PdfPageText,
    QuestionPageGroup,
    extract_pdf_page_texts,
    group_question_pages,
    normalize_whitespace,
    squash_text,
)

__all__ = [
    "ConversionResult",
    "FactCandidate",
    "PageText",
    "PdfPageText",
    "QuestionPageGroup",
    "convert_pdf_to_json",
    "convert_question_bank_pdf",
    "convert_reference_pdf",
    "convert_text_lines",
    "extract_pdf_pages",
    "extract_pdf_page_texts",
    "group_question_pages",
    "normalize_whitespace",
    "squash_text",
]
