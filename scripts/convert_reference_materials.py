#!/usr/bin/env python3
from __future__ import annotations

import json
import random
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT_DIR = Path(__file__).resolve().parents[1]
MATERIALS_DIR = ROOT_DIR.parent / "materials"
OUTPUT_PATH = ROOT_DIR / "backend" / "data" / "reference_materials_generated.json"
OCR_QUEUE_PATH = ROOT_DIR / "backend" / "data" / "reference_materials_ocr_queue.json"

TEXT_NATIVE_FILES = {
    "aspe_terminology": MATERIALS_DIR
    / "TERMS & NUMBERS-20260126T193044Z-3-001"
    / "ASPE PLUMBING TERMINOLOGY.pdf",
    "astm_nfpa": MATERIALS_DIR
    / "TABLES-20260126T193053Z-3-001"
    / "1. ASTM-NFPA.pdf",
    "laws_profession": MATERIALS_DIR
    / "TABLES-20260126T193053Z-3-001"
    / "2. LAWS, RULES AND REGULATIONS AFFECTING THE PLUMBING PROFESSION.pdf",
    "plumbing_tools": MATERIALS_DIR
    / "TABLES-20260126T193053Z-3-001"
    / "4. PLUMBING TOOLS ALL REFERENCE.pdf",
    "useful_conversions": MATERIALS_DIR
    / "TABLES-20260126T193053Z-3-001"
    / "5. USEFUL CONVERSIONS.pdf",
    "water_supply": MATERIALS_DIR
    / "SPDI-20260126T193056Z-3-001"
    / "1. Water Supply & Distribution Principles.pdf",
    "plumbing_materials": MATERIALS_DIR
    / "SPDI-20260126T193056Z-3-001"
    / "2. Plumbing Materials.pdf",
    "accessibility_law": MATERIALS_DIR
    / "SPDI-20260126T193056Z-3-001"
    / "3. Accessibility Law.pdf",
}

OCR_QUEUE = [
    MATERIALS_DIR / "TERMS & NUMBERS-20260126T193044Z-3-001" / "IMPORTANT NUMBERS.pdf",
    MATERIALS_DIR / "TERMS & NUMBERS-20260126T193044Z-3-001" / "PLUMBING CODE SUMMARY.pdf",
    MATERIALS_DIR / "TERMS & NUMBERS-20260126T193044Z-3-001" / "PRACTICAL PROBLEM TERMS.pdf",
    MATERIALS_DIR / "TABLES-20260126T193053Z-3-001" / "3. PLUMBING TABLES by JAM.pdf",
]

HEADER_TOKENS = {
    "RJES",
    "MASTER",
    "PLUMBER",
    "LICENSURE",
    "EXAM",
    "REVIEW",
    "ASPE",
    "PLUMBING",
    "TERMINOLOGY",
    "Source:",
    "Page",
    "No",
}

BULLET_PREFIXES = ("o ", "? ", "* ", "o", "?", "*")


@dataclass
class Fact:
    id: str
    question: str
    answer: str
    topic: str
    subtopic: str
    group_key: str
    source_ref: str
    explanation: str
    tags: list[str]
    difficulty: int
    accepted_answers: list[str]
    quality_flag: str = "probable"


@dataclass
class StyledWord:
    text: str
    fontname: str
    size: float
    x0: float
    x1: float
    top: float


def clean_text(value: str) -> str:
    value = value.replace("\u2013", "-").replace("\u2014", "-").replace("\u00a0", " ")
    value = value.replace("?", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip(" -")


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", clean_text(value).lower())
    return cleaned.strip("-") or "item"


def load_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def read_lines(path: Path) -> list[str]:
    return [clean_text(line) for line in load_pdf_text(path).splitlines() if clean_text(line)]


def is_bold(fontname: str) -> bool:
    return "Bold" in fontname or "bold" in fontname


def is_header_or_footer(text: str) -> bool:
    if not text:
        return True
    if text in HEADER_TOKENS:
        return True
    if text.startswith("RJES") or text.startswith("No part of this module"):
        return True
    if text.startswith("Chapter ") or text.endswith("Page 1 of 24"):
        return True
    if re.fullmatch(r"\d+", text):
        return True
    return False


def extract_styled_lines(path: Path) -> list[list[StyledWord]]:
    styled_lines: list[list[StyledWord]] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            words = page.extract_words(
                use_text_flow=True,
                keep_blank_chars=False,
                extra_attrs=["fontname", "size"],
            )
            buckets: dict[int, list[StyledWord]] = defaultdict(list)
            for word in words:
                top_key = int(round(word["top"] / 3.0))
                buckets[top_key].append(
                    StyledWord(
                        text=word["text"],
                        fontname=word["fontname"],
                        size=float(word["size"]),
                        x0=float(word["x0"]),
                        x1=float(word["x1"]),
                        top=float(word["top"]),
                    )
                )
            for _, line_words in sorted(buckets.items(), key=lambda item: min(word.top for word in item[1])):
                styled_lines.append(sorted(line_words, key=lambda word: word.x0))
    return styled_lines


def extract_bold_lead_entries(path: Path) -> list[tuple[str, str]]:
    entries: list[tuple[str, str]] = []
    current_term = ""
    current_definition: list[str] = []

    for line_words in extract_styled_lines(path):
        texts = [clean_text(word.text) for word in line_words if clean_text(word.text)]
        if not texts:
            continue

        joined_text = clean_text(" ".join(texts))
        if is_header_or_footer(joined_text):
            continue

        lead_words: list[str] = []
        body_words: list[str] = []
        still_lead = True

        for word in line_words:
            text = clean_text(word.text)
            if not text:
                continue
            if still_lead and is_bold(word.fontname) and 10.0 <= word.size <= 15.5:
                lead_words.append(text)
                continue
            still_lead = False
            body_words.append(text)

        lead_text = clean_text(" ".join(lead_words))
        body_text = clean_text(" ".join(body_words))

        if lead_text and not lead_text.isupper():
            if current_term and current_definition:
                entries.append((clean_text(current_term), clean_text(" ".join(current_definition))))
            current_term = lead_text.rstrip(":")
            current_definition = [body_text] if body_text else []
            continue

        if current_term and joined_text:
            current_definition.append(joined_text)

    if current_term and current_definition:
        entries.append((clean_text(current_term), clean_text(" ".join(current_definition))))

    return entries


def make_fact(
    prefix: str,
    seed: str,
    question: str,
    answer: str,
    topic: str,
    subtopic: str,
    group_key: str,
    source_ref: str,
    explanation: str,
    tags: list[str],
    difficulty: int = 2,
    accepted_answers: list[str] | None = None,
) -> Fact:
    unique_seed = slugify(seed)
    clean_answer = clean_text(answer)
    return Fact(
        id=f"{prefix}-{unique_seed}",
        question=clean_text(question),
        answer=clean_answer,
        topic=clean_text(topic),
        subtopic=clean_text(subtopic),
        group_key=clean_text(group_key),
        source_ref=clean_text(source_ref),
        explanation=clean_text(explanation) or clean_answer,
        tags=[slugify(tag) for tag in tags if clean_text(tag)],
        difficulty=difficulty,
        accepted_answers=accepted_answers or [clean_answer],
    )


def parse_aspe_terminology(path: Path) -> list[Fact]:
    facts: list[Fact] = []
    for term, definition in extract_bold_lead_entries(path):
        if len(term) < 3 or len(definition) < 12:
            continue
        facts.append(
            make_fact(
                prefix="ref-aspe",
                seed=term,
                question=f"Which plumbing term matches this definition: {definition}",
                answer=term,
                topic="Terminology & Definitions",
                subtopic="ASPE Plumbing Terminology",
                group_key="aspe-terminology",
                source_ref=f"{path.name} | {term}",
                explanation=f"{term}: {definition}",
                tags=["aspe", "terminology", "definition"],
                difficulty=2,
                accepted_answers=[term],
            )
        )
    return facts


def detect_heading(line: str) -> str | None:
    if not line or len(line) < 4:
        return None
    if line.startswith("("):
        return None
    if line.startswith("RJES") or line.startswith("MASTER PLUMBER"):
        return None
    if re.fullmatch(r"[A-Z0-9 /&\-\(\)\.,]{4,}", line):
        return line
    return None


def parse_spdi_outline(path: Path, topic: str) -> list[Fact]:
    facts: list[Fact] = []
    lines = read_lines(path)
    heading = path.stem
    source_prefix = path.name

    for line in lines:
        heading_candidate = detect_heading(line)
        if heading_candidate and heading_candidate not in {"RJES", "SPDI"}:
            heading = heading_candidate.title()
            continue

        if line.startswith(("MASTER PLUMBER", "RJES", "No part of this module")):
            continue

        normalized = line
        if normalized.startswith(BULLET_PREFIXES):
            normalized = normalized.lstrip("o?* ").strip()

        term_match = re.match(r"^([A-Z][A-Z0-9 /&\-\(\)\.]{1,80})\s*[-:]\s+(.+)$", normalized)
        if term_match:
            answer = clean_text(term_match.group(1))
            definition = clean_text(term_match.group(2))
            if len(definition) > 8:
                facts.append(
                    make_fact(
                        prefix=f"ref-{slugify(path.stem)}",
                        seed=answer,
                        question=f"Which term matches this description: {definition}",
                        answer=answer,
                        topic=topic,
                        subtopic=heading,
                        group_key=f"{slugify(path.stem)}-terms",
                        source_ref=f"{source_prefix} | {heading}",
                        explanation=f"{answer}: {definition}",
                        tags=[topic, heading, "definition"],
                        difficulty=2,
                        accepted_answers=[answer],
                    )
                )
                continue

        value_match = re.match(r"^(MIN\.|MAX\.|HEIGHT|WIDTH|DIAMETER|LENGTH|DIMENSION|AREA|DENSITY|SPECIFIC GRAVITY|MOLECULAR WEIGHT|SPECIFIC HEAT CAPACITY|LATENT HEAT OF VAPORIZATION|LATENT HEAT OF FUSION|REFRACTIVE INDEX OF WATER|VISCOSITY|SURFACE TENSION|BOILING POINT)\s*:?(.+)$", normalized, re.IGNORECASE)
        if value_match:
            key = clean_text(value_match.group(1))
            value = clean_text(value_match.group(2))
            if value:
                facts.append(
                    make_fact(
                        prefix=f"ref-{slugify(path.stem)}",
                        seed=f"{heading}-{key}-{value}",
                        question=f"What is the {key.lower()} for {heading.lower()}?",
                        answer=value,
                        topic=topic,
                        subtopic=heading,
                        group_key=f"{slugify(path.stem)}-{slugify(heading)}-values",
                        source_ref=f"{source_prefix} | {heading}",
                        explanation=f"{heading}: {key} = {value}",
                        tags=[topic, heading, key],
                        difficulty=3,
                        accepted_answers=[value, value.replace(" ", "")],
                    )
                )
                continue

        numbered_match = re.match(r"^\d+\.\s*([A-Za-z][A-Za-z0-9 /&\-\(\)\.]{2,80})\s*[-:]\s+(.+)$", normalized)
        if numbered_match:
            answer = clean_text(numbered_match.group(1))
            detail = clean_text(numbered_match.group(2))
            facts.append(
                make_fact(
                    prefix=f"ref-{slugify(path.stem)}",
                    seed=f"{heading}-{answer}",
                    question=f"Which {heading.rstrip('s').lower()} matches this description: {detail}",
                    answer=answer,
                    topic=topic,
                    subtopic=heading,
                    group_key=f"{slugify(path.stem)}-{slugify(heading)}-types",
                    source_ref=f"{source_prefix} | {heading}",
                    explanation=f"{answer}: {detail}",
                    tags=[topic, heading, "classification"],
                    difficulty=2,
                    accepted_answers=[answer],
                )
            )

    return facts


def parse_astm_nfpa(path: Path) -> list[Fact]:
    facts: list[Fact] = []
    lines = read_lines(path)
    current_code = ""
    current_description: list[str] = []

    for line in lines:
        if line.startswith("ASTM DESCRIPTION") or line in {"A", "F"}:
            continue
        if re.fullmatch(r"[A-Z]\d{2,4}", line) or re.match(r"^[A-Z]\d{2,4}\s+", line):
            if current_code and current_description:
                description = clean_text(" ".join(current_description))
                facts.append(
                    make_fact(
                        prefix="ref-astm",
                        seed=current_code,
                        question=f"Which ASTM standard covers this description: {description}",
                        answer=current_code,
                        topic="Codes & Standards",
                        subtopic="ASTM / NFPA",
                        group_key="astm-codes",
                        source_ref=f"{path.name} | {current_code}",
                        explanation=f"{current_code}: {description}",
                        tags=["astm", "standards"],
                        difficulty=3,
                        accepted_answers=[current_code],
                    )
                )
            parts = line.split(maxsplit=1)
            current_code = clean_text(parts[0])
            current_description = [clean_text(parts[1]) if len(parts) > 1 else ""]
            continue

        if current_code:
            current_description.append(line)

    if current_code and current_description:
        description = clean_text(" ".join(current_description))
        facts.append(
            make_fact(
                prefix="ref-astm",
                seed=current_code,
                question=f"Which ASTM standard covers this description: {description}",
                answer=current_code,
                topic="Codes & Standards",
                subtopic="ASTM / NFPA",
                group_key="astm-codes",
                source_ref=f"{path.name} | {current_code}",
                explanation=f"{current_code}: {description}",
                tags=["astm", "standards"],
                difficulty=3,
                accepted_answers=[current_code],
            )
        )

    return facts


def parse_laws(path: Path) -> list[Fact]:
    facts: list[Fact] = []
    for line in read_lines(path):
        match = re.match(r"^(.+?)\s+((?:PD|RA|BP|LOI)\s*\d+)\s*(.*)$", line)
        if not match:
            continue
        name = clean_text(match.group(1))
        code = clean_text(match.group(2))
        date = clean_text(match.group(3))
        explanation = f"{name} is {code}"
        if date:
            explanation += f", signed {date}"
        facts.append(
            make_fact(
                prefix="ref-law",
                seed=code,
                question=f"Which law or code corresponds to: {name}?",
                answer=code,
                topic="Laws & Regulations",
                subtopic="Plumbing Profession",
                group_key="laws-codes",
                source_ref=f"{path.name} | {code}",
                explanation=explanation,
                tags=["law", "regulation", "plumbing-profession"],
                difficulty=2,
                accepted_answers=[code, code.replace(" ", "")],
            )
        )
    return facts


def parse_tools(path: Path) -> list[Fact]:
    facts: list[Fact] = []
    lines = read_lines(path)
    current_name = ""
    current_description: list[str] = []

    def flush() -> None:
        nonlocal current_name, current_description
        if current_name and current_description:
            description = clean_text(" ".join(current_description))
            facts.append(
                make_fact(
                    prefix="ref-tool",
                    seed=current_name,
                    question=f"Which plumbing tool matches this description: {description}",
                    answer=current_name,
                    topic="Tools & Equipment",
                    subtopic="Plumbing Tools",
                    group_key="plumbing-tools",
                    source_ref=f"{path.name} | {current_name}",
                    explanation=f"{current_name}: {description}",
                    tags=["tool", "equipment", "plumbing"],
                    difficulty=2,
                    accepted_answers=[current_name],
                )
            )
        current_name = ""
        current_description = []

    for line in lines:
        if line == "PLUMBING TOOLS" or line.startswith("Testing Tools"):
            continue
        tokens = line.split()
        split_index = None
        for index, token in enumerate(tokens):
            if token and token[0].islower():
                split_index = index
                break
        if split_index and split_index > 0:
            flush()
            current_name = clean_text(" ".join(tokens[:split_index]).rstrip("`"))
            current_description = [clean_text(" ".join(tokens[split_index:]))]
            continue
        if current_name:
            current_description.append(line)

    flush()
    return facts


def parse_conversions(path: Path) -> list[Fact]:
    facts: list[Fact] = []
    lines = read_lines(path)
    base_label = ""

    for line in lines:
        if "=" in line:
            left, right = line.split("=", maxsplit=1)
            base_label = clean_text(left)
            value = clean_text(right)
            facts.append(
                make_fact(
                    prefix="ref-conv",
                    seed=f"{base_label}-{value}",
                    question=f"What is the equivalent of {base_label}?",
                    answer=value,
                    topic="Plumbing Arithmetic",
                    subtopic="Conversions",
                    group_key=f"conversion-{slugify(base_label)}",
                    source_ref=f"{path.name} | {base_label}",
                    explanation=f"{base_label} = {value}",
                    tags=["conversion", "plumbing-arithmetic"],
                    difficulty=2,
                    accepted_answers=[value, value.replace(" ", "")],
                )
            )
            continue
        if base_label:
            value = clean_text(line)
            if not value or not re.match(r"^[0-9]", value):
                base_label = ""
                continue
            facts.append(
                make_fact(
                    prefix="ref-conv",
                    seed=f"{base_label}-{value}",
                    question=f"What is the equivalent of {base_label}?",
                    answer=value,
                    topic="Plumbing Arithmetic",
                    subtopic="Conversions",
                    group_key=f"conversion-{slugify(base_label)}",
                    source_ref=f"{path.name} | {base_label}",
                    explanation=f"{base_label} = {value}",
                    tags=["conversion", "plumbing-arithmetic"],
                    difficulty=2,
                    accepted_answers=[value, value.replace(" ", "")],
                )
            )

    return facts


def dedupe_facts(facts: list[Fact]) -> list[Fact]:
    deduped: dict[tuple[str, str], Fact] = {}
    for fact in facts:
        key = (fact.question.lower(), fact.answer.lower())
        deduped[key] = fact
    cleaned: list[Fact] = []
    for fact in deduped.values():
        normalized_answer = fact.answer.lower()
        if normalized_answer in {"joint", "joints", "types", "materials", "accessories"}:
            continue
        if fact.subtopic.lower() == "(rnpcp)":
            continue
        if "which (rnpcp)" in fact.question.lower():
            continue
        if len(fact.answer.split()) > 9:
            continue
        if " - " in fact.answer or ": " in fact.answer:
            continue
        cleaned.append(fact)
    return cleaned


def build_flashcards(facts: list[Fact]) -> list[dict]:
    cards: list[dict] = []
    for fact in facts:
        cards.append(
            {
                "id": f"{fact.id}-fc",
                "topic": fact.topic,
                "subtopic": fact.subtopic,
                "front": fact.question,
                "back": fact.answer,
                "explanation_short": fact.answer,
                "explanation_long": fact.explanation,
                "tags": fact.tags,
                "difficulty": fact.difficulty,
                "source_ref": fact.source_ref,
                "quality_flag": fact.quality_flag,
            }
        )
    return cards


def build_identification(facts: list[Fact]) -> list[dict]:
    prompts: list[dict] = []
    for fact in facts:
        prompts.append(
            {
                "id": f"{fact.id}-id",
                "topic": fact.topic,
                "subtopic": fact.subtopic,
                "prompt": fact.question,
                "accepted_answers": fact.accepted_answers,
                "explanation_short": fact.answer,
                "explanation_long": fact.explanation,
                "tags": fact.tags,
                "difficulty": fact.difficulty,
                "source_ref": fact.source_ref,
                "quality_flag": fact.quality_flag,
            }
        )
    return prompts


def build_mcqs(facts: list[Fact]) -> list[dict]:
    groups: dict[str, list[Fact]] = defaultdict(list)
    for fact in facts:
        groups[fact.group_key].append(fact)

    mcqs: list[dict] = []
    labels = ["A", "B", "C", "D"]

    for fact in facts:
        distractor_pool = [
            candidate.answer
            for candidate in groups[fact.group_key]
            if candidate.answer.lower() != fact.answer.lower()
        ]
        unique_pool = sorted({answer for answer in distractor_pool if answer})
        if len(unique_pool) < 3:
            continue

        rng = random.Random(fact.id)
        distractors = rng.sample(unique_pool, 3)
        correct_index = rng.randrange(4)
        option_values = distractors.copy()
        option_values.insert(correct_index, fact.answer)

        mcqs.append(
            {
                "id": f"{fact.id}-mcq",
                "topic": fact.topic,
                "subtopic": fact.subtopic,
                "question_text": fact.question,
                "choices": [
                    {"label": label, "text": option_values[index]}
                    for index, label in enumerate(labels)
                ],
                "answer_key": labels[correct_index],
                "explanation_short": fact.answer,
                "explanation_long": fact.explanation,
                "tags": fact.tags,
                "difficulty": max(2, fact.difficulty),
                "source_ref": fact.source_ref,
                "quality_flag": fact.quality_flag,
            }
        )

    return mcqs


def main() -> None:
    all_facts: list[Fact] = []
    all_facts.extend(parse_aspe_terminology(TEXT_NATIVE_FILES["aspe_terminology"]))
    all_facts.extend(parse_astm_nfpa(TEXT_NATIVE_FILES["astm_nfpa"]))
    all_facts.extend(parse_laws(TEXT_NATIVE_FILES["laws_profession"]))
    all_facts.extend(parse_tools(TEXT_NATIVE_FILES["plumbing_tools"]))
    all_facts.extend(parse_conversions(TEXT_NATIVE_FILES["useful_conversions"]))
    all_facts.extend(parse_spdi_outline(TEXT_NATIVE_FILES["water_supply"], "Water Systems"))
    all_facts.extend(parse_spdi_outline(TEXT_NATIVE_FILES["plumbing_materials"], "Plumbing Materials"))
    all_facts.extend(parse_spdi_outline(TEXT_NATIVE_FILES["accessibility_law"], "Codes & Standards"))

    deduped_facts = dedupe_facts(all_facts)
    flashcards = build_flashcards(deduped_facts)
    identification = build_identification(deduped_facts)
    mcqs = build_mcqs(deduped_facts)

    output = {
        "metadata": {
            "version": "1.0",
            "generator": "scripts/convert_reference_materials.py",
            "source_scope": "text-native reference packets",
            "fact_count": len(deduped_facts),
            "flashcards": len(flashcards),
            "identification": len(identification),
            "mcqs": len(mcqs),
            "ocr_queue_count": len(OCR_QUEUE),
        },
        "flashcards": flashcards,
        "identification": identification,
        "mcqs": mcqs,
        "qa_summary": {
            "facts": len(deduped_facts),
            "notes": "Image-based packets were excluded from automatic conversion and placed in the OCR queue manifest.",
        },
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    ocr_manifest = {
        "metadata": {
            "generator": "scripts/convert_reference_materials.py",
            "status": "ocr_required",
            "files": len(OCR_QUEUE),
        },
        "files": [str(path) for path in OCR_QUEUE],
    }
    OCR_QUEUE_PATH.write_text(
        json.dumps(ocr_manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "fact_count": len(deduped_facts),
                "flashcards": len(flashcards),
                "identification": len(identification),
                "mcqs": len(mcqs),
                "output": str(OUTPUT_PATH),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
