# PlumberPass Content Truth Map

Date updated: March 24, 2026

This document maps where live study truth comes from so content QA can target the right files.

## The gatekeeper

The authoritative content loader is:

- `backend/app/storage.py`

It decides:

- which JSON files are considered live
- which files are blacklisted
- how mixed schemas are normalized
- how duplicate question ids are resolved

## Live study-question truth

The current study-question pool is merged from:

### Active root sources

- `backend/data/seed.json`
- `backend/data/ALL_VERIFIED_QUESTIONS.json`
- `backend/data/advance_week1_clean.json`
- `backend/data/notebooklm_batch1.json`
- `backend/data/notebooklm_batch2.json`
- `backend/data/notebooklm_batch3.json`
- `backend/data/notebooklm_batch4.json`

### Active published sources

- `backend/data/published/advance_qa_curated_batch1.json`
- `backend/data/published/advance_qa_curated_batch2.json`
- `backend/data/published/aspe_glossary_mcq_curated.json`
- `backend/data/published/aspe_reference_mcq_curated_batch2.json`
- `backend/data/published/astm_mcq_curated.json`
- `backend/data/published/laws_reference_mcq_curated.json`
- `backend/data/published/structured_reference_mcq_curated.json`
- `backend/data/published/useful_conversions_mcq_curated.json`

## Live flashcard truth

Primary live flashcard sources:

- `backend/data/notebooklm_batch1.json`
- `backend/data/notebooklm_batch2.json`
- `backend/data/notebooklm_batch3.json`
- `backend/data/notebooklm_batch4.json`
- `backend/data/published/accessibility_law_curated.json`
- `backend/data/published/aspe_glossary_curated.json`
- `backend/data/published/astm_nfpa_curated.json`
- `backend/data/published/plumbing_tools_curated.json`

## Live identification truth

Primary live identification sources:

- `backend/data/notebooklm_batch1.json`
- `backend/data/notebooklm_batch2.json`
- `backend/data/notebooklm_batch3.json`
- `backend/data/notebooklm_batch4.json`
- `backend/data/published/aspe_glossary_curated.json`
- `backend/data/published/astm_nfpa_curated.json`
- `backend/data/published/plumbing_tools_curated.json`

## Live visual-review truth

Primary live visual sources:

- `backend/data/published/visual_review_curated.json`
- `backend/data/published/visual_review_items.json`

Visual items are deduped by caption-like key in `storage.py`, with the richer item variant preferred.

## Mock-exam truth

Mock exam banks are isolated from the regular study queue:

- `backend/data/mock_exam1_part_a.json`
- `backend/data/mock_exam1_part_b.json`

Loader functions:

- `load_mock_exam1_part_a()`
- `load_mock_exam1_part_b()`

Tests already enforce that mock questions do not leak into the regular study bank.

## Blacklisted or non-live content

These are explicitly kept out of the regular study queue in `storage.py`:

- `advance_week1.json`
- `master_question_bank.json`
- `materials_publish_candidates.json`
- `mock_exam1_part_a.json`
- `mock_exam1_part_b.json`
- `reference_materials_generated.json`
- `reference_materials_ocr_queue.json`

## Answer-key truth hierarchy

When duplicate question ids exist, `storage.py` prefers the version with:

1. stronger `quality_flag`
2. longer explanation payload
3. longer prompt payload

Quality ranking currently favors:

- `verified`
- `ok` / `probable`
- default/unknown
- `review`
- `draft` / `uncertain`
- `manual_review`

## Mock blueprint truth

The official exam blueprint and exam-cycle labels are configured in:

- `frontend/src/config/examBlueprint.ts`

This drives the app’s current PRC-facing weighting and countdown presentation.

## Content QA priority order

1. `backend/data/advance_week1_clean.json`
2. `backend/data/ALL_VERIFIED_QUESTIONS.json`
3. `backend/data/notebooklm_batch*.json`
4. `backend/data/published/advance_qa_curated_batch*.json`
5. `backend/data/published/*_mcq_curated.json`
6. visual references in `backend/data/published/visual_review*.json`

## Mixed-truth / caution zones

- NotebookLM batches are live and should be treated as curated-but-still-audit-worthy.
- Root legacy verified files still contribute to the merged bank and should eventually be consolidated into cleaner published packs.
- OCR-heavy source dumps are intentionally excluded and should stay excluded until explicitly re-curated.
