#!/usr/bin/env python3
"""
Import questions from JSON files into the question bank.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def validate_question(question: dict[str, Any]) -> list[str]:
    """Validate a question object and return list of errors."""
    errors = []
    
    required_fields = ["id", "topic", "prompt", "choices", "answer_key"]
    for field in required_fields:
        if field not in question:
            errors.append(f"Missing required field: {field}")
    
    if "choices" in question:
        if not isinstance(question["choices"], list):
            errors.append("'choices' must be an array")
        elif len(question["choices"]) < 2:
            errors.append("Must have at least 2 choices")
        else:
            labels = [c.get("label") for c in question["choices"]]
            if question.get("answer_key") not in labels:
                errors.append(f"Answer key '{question.get('answer_key')}' not found in choices")
    
    return errors


def merge_questions(existing: list[dict], new: list[dict]) -> tuple[list[dict], int, int]:
    """Merge new questions into existing list.
    
    Returns:
        Tuple of (merged list, added count, updated count)
    """
    existing_ids = {q["id"]: i for i, q in enumerate(existing)}
    merged = existing.copy()
    added = 0
    updated = 0
    
    for question in new:
        qid = question.get("id")
        if qid in existing_ids:
            # Update existing
            merged[existing_ids[qid]] = question
            updated += 1
        else:
            # Add new
            merged.append(question)
            added += 1
    
    return merged, added, updated


def main():
    parser = argparse.ArgumentParser(description="Import questions into PlumberPass")
    parser.add_argument("--file", "-f", required=True, help="JSON file to import")
    parser.add_argument("--output", "-o", default="backend/data/seed.json",
                        help="Output file (default: backend/data/seed.json)")
    parser.add_argument("--validate-only", "-v", action="store_true",
                        help="Only validate, don't import")
    
    args = parser.parse_args()
    
    # Load import file
    import_path = Path(args.file)
    if not import_path.exists():
        print(f"❌ File not found: {import_path}")
        sys.exit(1)
    
    print(f"📖 Loading {import_path}...")
    try:
        with open(import_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(1)
    
    # Handle both array and object with "questions" key
    if isinstance(data, dict) and "questions" in data:
        questions = data["questions"]
    elif isinstance(data, list):
        questions = data
    else:
        print("❌ Invalid format: expected array or object with 'questions' key")
        sys.exit(1)
    
    print(f"📝 Found {len(questions)} questions")
    
    # Validate questions
    print("🔍 Validating...")
    all_valid = True
    for i, question in enumerate(questions):
        errors = validate_question(question)
        if errors:
            all_valid = False
            print(f"  ❌ Question {i+1} ({question.get('id', 'unknown')}):")
            for error in errors:
                print(f"     - {error}")
    
    if not all_valid:
        print("\n❌ Validation failed! Please fix errors and try again.")
        sys.exit(1)
    
    print(f"✓ All {len(questions)} questions valid")
    
    if args.validate_only:
        print("\n✓ Validation complete (no changes made)")
        sys.exit(0)
    
    # Load existing questions
    output_path = Path(args.output)
    existing = []
    if output_path.exists():
        print(f"📂 Loading existing questions from {output_path}...")
        with open(output_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
            if isinstance(existing_data, dict) and "questions" in existing_data:
                existing = existing_data["questions"]
            elif isinstance(existing_data, list):
                existing = existing_data
    
    # Merge questions
    print("🔄 Merging questions...")
    merged, added, updated = merge_questions(existing, questions)
    
    # Save output
    output_data = {
        "metadata": {
            "version": "1.0",
            "total_questions": len(merged),
            "last_updated": "2025-01-15T00:00:00Z"
        },
        "questions": merged
    }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Import complete!")
    print(f"  Added: {added}")
    print(f"  Updated: {updated}")
    print(f"  Total: {len(merged)}")
    print(f"  Output: {output_path}")


if __name__ == "__main__":
    main()
