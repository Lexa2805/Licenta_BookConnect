import pytest

from test_utils import FakeMongo


@pytest.fixture
def fake_marketplace_mongo(monkeypatch):
    fake_mongo = FakeMongo()
    monkeypatch.setattr(
        "marketplace.mongo_service.get_collection",
        fake_mongo.get_collection,
    )
    return fake_mongo


def make_listing_payload(**overrides):
    payload = {
        "title": "Carte test pytest",
        "author": "Autor pytest",
        "description": "Descriere pentru listarea testata cu pytest",
        "genre": "OTHER",
        "language": "RO",
        "pages": 220,
        "price": "25.50",
        "condition": "GOOD",
        "seller_id": "seller-pytest-1",
        "seller_name": "Seller Pytest",
    }
    payload.update(overrides)
    return payload


def test_crearea_unei_listari_are_status_initial_listed(api_client, fake_marketplace_mongo):
    response = api_client.post(
        "/api/marketplace/listings/",
        make_listing_payload(),
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == "LISTED"
    assert response.data["seller_id"] == "seller-pytest-1"


def test_crearea_reviewurilor_actualizeaza_ratingul_mediu(api_client, fake_marketplace_mongo):
    listing_response = api_client.post(
        "/api/marketplace/listings/",
        make_listing_payload(title="Carte cu review-uri"),
        format="json",
    )
    listing_id = listing_response.data["id"]

    first_review = api_client.post(
        "/api/marketplace/reviews/",
        {
            "listing": listing_id,
            "user_id": "reader-1",
            "user_name": "Reader One",
            "rating": 5,
            "comment": "Foarte buna",
        },
        format="json",
    )
    second_review = api_client.post(
        "/api/marketplace/reviews/",
        {
            "listing": listing_id,
            "user_id": "reader-2",
            "user_name": "Reader Two",
            "rating": 3,
            "comment": "Buna, dar cu mici probleme",
        },
        format="json",
    )

    assert first_review.status_code == 201
    assert second_review.status_code == 201

    detail_response = api_client.get(f"/api/marketplace/listings/{listing_id}/")

    assert detail_response.status_code == 200
    assert detail_response.data["average_rating"] == pytest.approx(4.0)
    assert detail_response.data["review_count"] == 2
