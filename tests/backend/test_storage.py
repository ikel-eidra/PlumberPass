from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.storage import (  # noqa: E402
    load_mock_exam1_part_a,
    load_mock_exam1_part_b,
    load_questions,
    load_visual_review_items,
)


def test_study_bank_excludes_mock_exam_questions():
    study_ids = {question.id for question in load_questions()}
    mock_ids = {question.id for question in load_mock_exam1_part_a()} | {
        question.id for question in load_mock_exam1_part_b()
    }

    assert mock_ids
    assert study_ids.isdisjoint(mock_ids)


def test_study_bank_excludes_week_09_publish_candidate_noise():
    study_ids = {question.id for question in load_questions()}

    assert not any(question_id.startswith("advance-qa__week-09-") for question_id in study_ids)


def test_curated_batches_are_present_in_study_bank():
    study_ids = {question.id for question in load_questions()}

    assert "advance-qa__week-01-q013" in study_ids
    assert "advance-qa__week-10-q001" in study_ids


def test_derived_glossary_batch_is_present_in_study_bank():
    study_ids = {question.id for question in load_questions()}
    derived_ids = [question_id for question_id in study_ids if question_id.startswith("aspe-derived__")]
    expansion_ids = [
        question_id for question_id in study_ids if question_id.startswith("aspe-ref-derived__")
    ]
    astm_ids = [question_id for question_id in study_ids if question_id.startswith("astm-derived__")]
    structured_ids = [question_id for question_id in study_ids if question_id.startswith("structured-derived__")]
    laws_ids = [question_id for question_id in study_ids if question_id.startswith("laws-derived__")]
    conversion_ids = [
        question_id for question_id in study_ids if question_id.startswith("conversion-derived__")
    ]

    assert len(derived_ids) >= 150
    assert len(expansion_ids) >= 100
    assert len(astm_ids) >= 20
    assert len(structured_ids) >= 150
    assert len(laws_ids) >= 20
    assert len(conversion_ids) >= 9
    assert len(study_ids) >= 650
    assert "aspe-derived__id-5936fcef3450" in study_ids
    assert "aspe-ref-derived__refaspealarmid" in study_ids
    assert "astm-derived__ref-astm-b88-id" in study_ids
    assert "structured-derived__water-supply__fl-913c26262c98" in study_ids
    assert "structured-derived__plumbing-code-terms__fl-6b5d9bd10b76" in study_ids
    assert "laws-derived__ref-law-pd-1096-id" in study_ids
    assert "laws-derived__ref-law-bp-344-id" in study_ids
    assert "conversion-derived__ref-conv-1-atm-atmosphere-101-325-kpa-kilopascal-id" in study_ids


def test_visual_review_items_are_available():
    visual_items = load_visual_review_items()

    assert len(visual_items) >= 43
    assert any(item.id == "visual-design-vacuum-breaker" for item in visual_items)
    assert any(item.caption == "Figure 10-8 Gravity Sand Filter" for item in visual_items)
    assert any(item.id == "visual-week9-septic-tank-minimum-dimensions" for item in visual_items)
    assert any(item.id == "visual-code-air-gap" for item in visual_items)
    assert any(item.id == "visual-code-vent-stack-diagram" for item in visual_items)
    assert all(item.image_path.startswith("/visual-review/") for item in visual_items)
