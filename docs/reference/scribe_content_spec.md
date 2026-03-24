# Scribe (Cri) Content Spec

This document defines the JSON schema + folder layout for the Scribe content pipeline so
PlumberPass (and future apps) can ingest content consistently.

## 1) Repository layout (recommended)

```
content/
  batches/
    notebooklm_batch1.json
    notebooklm_batch2.json
    notebooklm_batch3.json
    notebooklm_batch4.json
    ...
  mock_exams/
    mock_exam1_part_a.json
    mock_exam1_part_b.json
    mock_exam2_part_a.json
    mock_exam2_part_b.json
    ...
  metadata/
    catalog.json
```

### Optional (raw sources)
Keep raw PDFs/docs in a separate repo or drive folder (not inside this repo).

## 2) Batch JSON schema (NotebookLM-style)

### File name
`notebooklm_batchX.json` (X = batch number)

### Root structure
```
{
  "flashcards": [Flashcard],
  "mcqs": [MCQ],
  "identification": [Identification],
  "qa_summary": QASummary
}
```

### Flashcard
```
{
  "id": "FC-<TOPIC>-###",
  "topic": "<string>",
  "subtopic": "<string>",
  "front": "<string>",
  "back": "<string>",
  "explanation_short": "<string>",
  "explanation_long": "<string>",
  "tags": ["<string>", "..."],
  "difficulty": <int>,
  "source_ref": "<string>",
  "quality_flag": "OK" | "REVIEW" | "FLAG"
}
```

### MCQ
```
{
  "id": "MCQ-<TOPIC>-###",
  "topic": "<string>",
  "subtopic": "<string>",
  "question_text": "<string>",
  "choices": {
    "A": "<string>",
    "B": "<string>",
    "C": "<string>",
    "D": "<string>",
    "E": "<string>"
  },
  "answer_key": "A" | "B" | "C" | "D" | "E",
  "explanation_short": "<string>",
  "explanation_long": "<string>",
  "tags": ["<string>", "..."],
  "difficulty": <int>,
  "source_ref": "<string>",
  "quality_flag": "OK" | "REVIEW" | "FLAG"
}
```

### Identification
```
{
  "id": "ID-<TOPIC>-###",
  "topic": "<string>",
  "subtopic": "<string>",
  "prompt": "<string>",
  "accepted_answers": ["<string>", "..."],
  "explanation_short": "<string>",
  "explanation_long": "<string>",
  "tags": ["<string>", "..."],
  "difficulty": <int>,
  "source_ref": "<string>",
  "quality_flag": "OK" | "REVIEW" | "FLAG"
}
```

### QA Summary
```
{
  "batch": <int>,
  "total_items": <int>,
  "flashcards": <int>,
  "mcq": <int>,
  "identification": <int>,
  "notes": ["<string>", "..."]
}
```

## 3) Mock Exam JSON schema

### File name
`mock_examX_part_[a|b].json` (X = exam number)

### Root structure
Array of questions:
```
[
  MockQuestion,
  ...
]
```

### MockQuestion
```
{
  "QID": "MOCK<exam#>-###",
  "Topic": "<string>",
  "Subtopic": "<string>",
  "QuestionText": "<string>",
  "Choices": {
    "A": "<string>",
    "B": "<string>",
    "C": "<string>",
    "D": "<string>",
    "E": "<string>"
  },
  "AnswerKey": "A" | "B" | "C" | "D" | "E",
  "ExplanationShort": "<string>",
  "ExplanationLong": "<string>",
  "Difficulty": <int>,
  "SourceRef": "<string>",
  "QualityFlag": "OK" | "REVIEW" | "FLAG"
}
```

## 4) catalog.json (optional)

Use this to advertise available content to clients.
```
{
  "batches": [
    {"id": 1, "file": "batches/notebooklm_batch1.json"},
    {"id": 2, "file": "batches/notebooklm_batch2.json"}
  ],
  "mock_exams": [
    {"id": 1, "parts": ["mock_exams/mock_exam1_part_a.json", "mock_exams/mock_exam1_part_b.json"]}
  ]
}
```

## 5) Notes
- Keep JSON keys exactly as shown (case-sensitive).
- Prefer A–E choices, but A–D is acceptable if the source only has four.
- Use consistent IDs (FC-/MCQ-/ID-/MOCK) to prevent collisions.
