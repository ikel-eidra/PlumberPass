from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.content_pipeline.catalog import MaterialSource, get_material_sources
from scripts.content_pipeline.fact_source_converter import convert_reference_pdf
from scripts.content_pipeline.mcq_source_converter import convert_question_bank_pdf


def _repo_root() -> Path:
    return REPO_ROOT


def _staging_root(repo_root: Path) -> Path:
    return repo_root / "backend" / "data" / "staging"


def _bucket_root(staging_root: Path, bucket: str) -> Path:
    path = staging_root / bucket
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sanitize_output(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "metadata": data.get("metadata", {}),
        "questions": data.get("questions", []),
        "flashcards": data.get("flashcards", []),
        "identification": data.get("identification", []),
    }


def _output_name(source: MaterialSource) -> str:
    kind = "mcq" if source.converter == "mcq" else "review"
    return f"{source.slug}__{kind}__candidate__v1.json"


def _quality_summary(items: list[dict[str, Any]]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for item in items:
        quality = str(item.get("quality_flag") or "unknown")
        summary[quality] = summary.get(quality, 0) + 1
    return summary


def _count_items(payload: dict[str, Any]) -> int:
    return len(payload["questions"]) + len(payload["flashcards"]) + len(payload["identification"])


def _quality_ratios(summary: dict[str, int]) -> dict[str, float]:
    total = sum(summary.values())
    if total <= 0:
        return {}
    return {key: round(value / total, 4) for key, value in summary.items()}


def _classify_output(source: MaterialSource, payload: dict[str, Any]) -> tuple[str, list[str]]:
    notes = source.notes.lower()
    total_items = _count_items(payload)
    summary = payload["metadata"].get("quality_summary", {})
    ratios = _quality_ratios(summary)
    verified_ratio = ratios.get("verified", 0.0)
    probable_ratio = ratios.get("probable", 0.0)
    candidate_ratio = ratios.get("candidate", 0.0)
    review_ratio = ratios.get("review", 0.0)
    confident_ratio = verified_ratio + probable_ratio

    reasons: list[str] = []
    if total_items == 0:
        reasons.append("No items were extracted")
        return "empty", reasons

    if "ocr-heavy" in notes or "ocr" in notes:
        reasons.append("Source notes mark this file as OCR-heavy")
        return "ocr_queue", reasons

    if source.converter == "mcq":
        if total_items >= 20 and review_ratio <= 0.2 and confident_ratio >= 0.35:
            reasons.append("MCQ bank has enough volume with limited review-only items")
            return "publish_candidate", reasons
        if total_items >= 20 and confident_ratio >= 0.5:
            reasons.append("MCQ bank has enough probable or verified answers to review next")
            return "review_queue", reasons
        reasons.append("MCQ bank still has too many unresolved answers")
        return "review_queue", reasons

    if confident_ratio >= 0.65 and review_ratio <= 0.25:
        reasons.append("Reference extraction is mostly high-confidence")
        return "publish_candidate", reasons
    if candidate_ratio + review_ratio >= 0.5:
        reasons.append("Reference extraction needs filtering before publication")
        return "review_queue", reasons

    reasons.append("Reference extraction needs manual assessment")
    return "review_queue", reasons


def _massage_questions(source: MaterialSource, questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in questions:
        copied = dict(item)
        copied.setdefault("tags", [])
        copied["tags"] = list(dict.fromkeys([*copied["tags"], source.material_group, source.slug]))
        if copied.get("topic") in {"General Plumbing", "Definitions and Terminology"}:
            copied["topic"] = source.topic_hint
        if copied.get("subtopic") in {"General", ""}:
            copied["subtopic"] = source.subtopic_hint
        normalized.append(copied)
    return normalized


def _massage_reference_items(
    source: MaterialSource, items: list[dict[str, Any]], *, item_type: str
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in items:
        copied = dict(item)
        copied["topic"] = source.topic_hint
        if copied.get("subtopic") in {"", source.topic_hint, source.material_group, source.material_group.title()}:
            copied["subtopic"] = source.subtopic_hint
        copied.setdefault("tags", [])
        copied["tags"] = list(dict.fromkeys([*copied["tags"], source.material_group, source.slug, item_type]))
        normalized.append(copied)
    return normalized


def _needs_ocr(source: MaterialSource) -> bool:
    notes = source.notes.lower()
    return source.material_group in {"advance-qa"} or "ocr-heavy" in notes or "ocr" in notes


def _convert_source(source: MaterialSource) -> dict[str, Any]:
    if source.converter == "mcq":
        questions = _massage_questions(
            source,
            convert_question_bank_pdf(
                pdf_path=source.source_path,
                ocr_fallback=_needs_ocr(source),
                source_slug=source.slug,
                topic_hint=source.topic_hint,
                subtopic_hint=source.subtopic_hint,
                material_group=source.material_group,
            ),
        )
        return {
            "metadata": {
                "quality_summary": _quality_summary(questions),
                "notes": [source.notes] if source.notes else [],
            },
            "questions": questions,
            "flashcards": [],
            "identification": [],
        }

    result = convert_reference_pdf(pdf_path=source.source_path, source_group=source.topic_hint)
    flashcards = _massage_reference_items(source, result.flashcards, item_type="flashcard")
    identification = _massage_reference_items(source, result.identification, item_type="identification")
    return {
        "metadata": {
            "quality_summary": _quality_summary(flashcards),
            "notes": [source.notes] if source.notes else [],
        },
        "questions": [],
        "flashcards": flashcards,
        "identification": identification,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert materials PDFs into staged reviewer items.")
    parser.add_argument(
        "--slug",
        action="append",
        default=[],
        help="Only convert the provided source slug. Can be repeated.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of sources processed.",
    )
    args = parser.parse_args()

    repo_root = _repo_root()
    staging_root = _staging_root(repo_root)
    staging_root.mkdir(parents=True, exist_ok=True)
    bucket_roots = {
        "publish_candidate": _bucket_root(staging_root, "published"),
        "review_queue": _bucket_root(staging_root, "review"),
        "ocr_queue": _bucket_root(staging_root, "ocr"),
        "empty": _bucket_root(staging_root, "empty"),
    }

    sources = get_material_sources(repo_root)
    if args.slug:
        selected = set(args.slug)
        sources = [source for source in sources if source.slug in selected]
    if args.limit is not None:
        sources = sources[: args.limit]

    manifest_entries: list[dict[str, Any]] = []
    manifests_by_bucket: dict[str, list[dict[str, Any]]] = {
        "publish_candidate": [],
        "review_queue": [],
        "ocr_queue": [],
        "empty": [],
    }
    for source in sources:
        converted = _convert_source(source)
        payload = _sanitize_output(converted)
        payload["metadata"] = {
            **payload["metadata"],
            "source_slug": source.slug,
            "source_file": str(source.source_path),
            "material_group": source.material_group,
            "converter": source.converter,
            "generated_at": datetime.now(UTC).isoformat(),
        }
        classification, reasons = _classify_output(source, payload)
        payload["metadata"]["classification"] = classification
        payload["metadata"]["classification_reasons"] = reasons

        output_path = bucket_roots[classification] / _output_name(source)
        output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

        entry = {
            "slug": source.slug,
            "converter": source.converter,
            "classification": classification,
            "classification_reasons": reasons,
            "source_file": str(source.source_path),
            "output_file": str(output_path),
            "question_count": len(payload["questions"]),
            "flashcard_count": len(payload["flashcards"]),
            "identification_count": len(payload["identification"]),
            "quality_summary": payload["metadata"].get("quality_summary", {}),
            "quality_ratios": _quality_ratios(payload["metadata"].get("quality_summary", {})),
            "notes": payload["metadata"].get("notes", []),
        }
        manifest_entries.append(entry)
        manifests_by_bucket[classification].append(entry)
        print(
            f"{source.slug}: bucket={classification} "
            f"questions={len(payload['questions'])} "
            f"flashcards={len(payload['flashcards'])} "
            f"identification={len(payload['identification'])}"
        )

    manifest = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source_count": len(manifest_entries),
        "entries": manifest_entries,
    }
    manifest_path = staging_root / "conversion_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    for bucket, entries in manifests_by_bucket.items():
        bucket_manifest = {
            "generated_at": datetime.now(UTC).isoformat(),
            "source_count": len(entries),
            "classification": bucket,
            "entries": entries,
        }
        bucket_manifest_path = staging_root / f"{bucket}_manifest.json"
        bucket_manifest_path.write_text(
            json.dumps(bucket_manifest, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
    print(f"Manifest written to {manifest_path}")


if __name__ == "__main__":
    main()
