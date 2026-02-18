#!/usr/bin/env python3
"""
Merge original and Advance Week 1 questions
"""

import json
from pathlib import Path

# Load original questions
with open('seed.json', 'r', encoding='utf-8') as f:
    original = json.load(f)
    original_questions = original.get('questions', [])

# Load Week 1 verified questions
with open('questions_advance_week1_verified.json', 'r', encoding='utf-8') as f:
    week1 = json.load(f)
    week1_questions = week1.get('questions', [])

# Merge
all_questions = original_questions + week1_questions

# Save consolidated
output = {
    "metadata": {
        "total_questions": len(all_questions),
        "original_count": len(original_questions),
        "week1_count": len(week1_questions),
        "all_verified": True,
        "version": "1.0",
        "date": "2025-02-17"
    },
    "questions": all_questions
}

with open('ALL_VERIFIED_QUESTIONS.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Merged {len(original_questions)} + {len(week1_questions)} = {len(all_questions)} questions")
print("Saved to: ALL_VERIFIED_QUESTIONS.json")
