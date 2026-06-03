import pytest

from test_utils import FakeMongo


@pytest.fixture
def fake_library_mongo(monkeypatch):
    fake_mongo = FakeMongo()
    monkeypatch.setattr(
        "library.mongo_service.get_collection",
        fake_mongo.get_collection,
    )
    return fake_mongo


def test_sesiune_de_lectura_calculeaza_pages_read(api_client, fake_library_mongo):
    create_response = api_client.post(
        "/api/library/reading-sessions/",
        {
            "user_id": "reader-pytest-1",
            "book": "book-pytest-1",
            "start_page": 1,
        },
        format="json",
    )

    assert create_response.status_code == 201

    session_id = create_response.data["id"]
    end_response = api_client.post(
        f"/api/library/reading-sessions/{session_id}/end_session/",
        {"end_page": 50},
        format="json",
    )

    assert end_response.status_code == 200
    assert end_response.data["pages_read"] == 49
