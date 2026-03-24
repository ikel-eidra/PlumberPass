from pathlib import Path
import sys

from fastapi.testclient import TestClient


sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.main import app  # noqa: E402


client = TestClient(app)


def test_health_endpoint_is_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_study_endpoints_return_live_content():
    items_response = client.get("/api/v1/study/items")
    topics_response = client.get("/api/v1/study/topics")
    questions_response = client.get("/api/v1/study/questions")
    flashcards_response = client.get("/api/v1/study/flashcards")
    identification_response = client.get("/api/v1/study/identification")
    visual_response = client.get("/api/v1/study/visual-review")

    assert items_response.status_code == 200
    assert topics_response.status_code == 200
    assert questions_response.status_code == 200
    assert flashcards_response.status_code == 200
    assert identification_response.status_code == 200
    assert visual_response.status_code == 200

    items_payload = items_response.json()
    questions_payload = questions_response.json()
    flashcards_payload = flashcards_response.json()
    identification_payload = identification_response.json()
    visual_payload = visual_response.json()
    topics_payload = topics_response.json()

    assert len(items_payload["questions"]) >= 650
    assert len(questions_payload) >= 650
    assert len(flashcards_payload) >= 600
    assert len(identification_payload) >= 500
    assert len(visual_payload) >= 43
    assert topics_payload
    assert any(topic["name"] == "Plumbing Code" for topic in topics_payload)
    assert any(item["id"] == "visual-code-air-gap" for item in visual_payload)


def test_mock_exam_endpoints_remain_separate():
    part_a_response = client.get("/api/v1/study/mock-exams/1/part-a")
    part_b_response = client.get("/api/v1/study/mock-exams/1/part-b")
    study_response = client.get("/api/v1/study/questions")

    assert part_a_response.status_code == 200
    assert part_b_response.status_code == 200
    assert study_response.status_code == 200

    mock_ids = {item["id"] for item in part_a_response.json()} | {
        item["id"] for item in part_b_response.json()
    }
    study_ids = {item["id"] for item in study_response.json()}

    assert len(part_a_response.json()) == 50
    assert len(part_b_response.json()) == 50
    assert mock_ids
    assert study_ids.isdisjoint(mock_ids)
