from datetime import datetime, timezone

from mongo_client import get_collection, serialize_document, to_object_id
from pymongo import ReturnDocument
from upload_storage import cloudinary_image_url


LISTINGS = "marketplace_listings"
REVIEWS = "marketplace_reviews"
WISHLIST = "marketplace_wishlist"
PURCHASES = "marketplace_purchases"

GENRE_CHOICES = [
    ("FANTASY", "Fantasy"),
    ("SCIENCE_FICTION", "Science Fiction"),
    ("ROMANCE", "Romance"),
    ("THRILLER", "Thriller"),
    ("MYSTERY", "Mystery"),
    ("SELF_HELP", "Self-Help"),
    ("BUSINESS", "Business"),
    ("PROGRAMMING", "Programming"),
    ("CLASSIC", "Classic"),
    ("OTHER", "Other"),
]

LANGUAGE_CHOICES = [
    ("RO", "Romana"),
    ("EN", "English"),
    ("FR", "Francais"),
    ("DE", "Deutsch"),
    ("ES", "Espanol"),
    ("IT", "Italiano"),
    ("OTHER", "Other"),
]


def _now():
    return datetime.now(timezone.utc)


def _as_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _review_stats(listing_id):
    reviews = list_reviews(listing_id)
    count = len(reviews)
    average = sum(review.get("rating", 0) for review in reviews) / count if count else 0
    return reviews, average, count


def _serialize_listing(document, include_reviews=False):
    data = serialize_document(document)
    if data is None:
        return None

    reviews, average, count = _review_stats(data["id"])
    data.setdefault("genre", "OTHER")
    data.setdefault("language", "RO")
    data.setdefault("pages", 0)
    data.setdefault("status", "LISTED")
    data.setdefault("buyer_id", None)
    data.setdefault("buyer_name", None)
    data.setdefault("sold_at", None)
    data.setdefault("image_url", None)
    data.setdefault("image_path", None)
    data.setdefault("image_public_id", None)
    if data.get("image_public_id"):
        data["image_url"] = cloudinary_image_url(data["image_public_id"])
    data["image"] = data.get("image_url") or data.get("image_path")
    data["average_rating"] = average
    data["review_count"] = count
    if include_reviews:
        data["reviews"] = reviews
    return data


def list_listings(genre=None, seller_id=None):
    query = {}
    if genre:
        query["genre"] = genre
    if seller_id:
        query["seller_id"] = seller_id

    cursor = get_collection(LISTINGS).find(query).sort("created_at", -1)
    return [_serialize_listing(document) for document in cursor]


def get_listing(listing_id):
    object_id = to_object_id(listing_id)
    if object_id is None:
        return None
    document = get_collection(LISTINGS).find_one({"_id": object_id})
    return _serialize_listing(document, include_reviews=True) if document else None


def list_wishlist(user_id):
    wishlist_docs = list(get_collection(WISHLIST).find({"user_id": user_id}).sort("created_at", -1))
    listing_ids = [to_object_id(item.get("listing_id")) for item in wishlist_docs]
    listing_ids = [item for item in listing_ids if item is not None]
    if not listing_ids:
        return []

    documents = list(get_collection(LISTINGS).find({"_id": {"$in": listing_ids}}))
    listing_by_id = {str(document["_id"]): _serialize_listing(document) for document in documents}
    return [listing_by_id[item.get("listing_id")] for item in wishlist_docs if item.get("listing_id") in listing_by_id]


def is_wishlisted(user_id, listing_id):
    return bool(get_collection(WISHLIST).find_one({"user_id": user_id, "listing_id": str(listing_id)}))


def set_wishlist(user_id, listing_id, desired=None):
    listing = get_listing(listing_id)
    if not listing:
        return None

    query = {"user_id": user_id, "listing_id": str(listing_id)}
    exists = bool(get_collection(WISHLIST).find_one(query))
    should_add = (not exists) if desired is None else bool(desired)

    if should_add and not exists:
        get_collection(WISHLIST).insert_one({**query, "created_at": _now()})
    elif not should_add and exists:
        get_collection(WISHLIST).delete_one(query)

    return {
        "is_wishlisted": should_add,
        "listing": listing,
    }


def create_listing(data, image_info=None):
    now = _now()
    document = {
        "title": data.get("title") or "",
        "author": data.get("author") or "Unknown Author",
        "description": data.get("description") or "",
        "genre": data.get("genre") or "OTHER",
        "language": data.get("language") or "RO",
        "pages": _as_int(data.get("pages"), 0),
        "price": _as_float(data.get("price"), 0.0),
        "condition": data.get("condition") or "GOOD",
        "seller_id": data.get("seller_id") or "anonymous_seller",
        "seller_name": data.get("seller_name") or "Anonymous Seller",
        "status": data.get("status") or "LISTED",
        "image_url": None if image_info and image_info.get("public_id") else image_info["url"] if image_info else None,
        "image_path": None if image_info and image_info.get("public_id") else image_info["path"] if image_info else None,
        "image_public_id": image_info.get("public_id") if image_info else None,
        "created_at": now,
        "updated_at": now,
    }
    result = get_collection(LISTINGS).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_listing(document, include_reviews=True), result.inserted_id


def update_listing(listing_id, data, image_info=None):
    object_id = to_object_id(listing_id)
    if object_id is None:
        return None

    updates = {}
    for field in (
        "title",
        "author",
        "description",
        "genre",
        "language",
        "condition",
        "seller_id",
        "seller_name",
        "status",
    ):
        if field in data:
            updates[field] = data.get(field)
    if "pages" in data:
        updates["pages"] = _as_int(data.get("pages"), 0)
    if "price" in data:
        updates["price"] = _as_float(data.get("price"), 0.0)
    if image_info:
        updates.update(
            {
                "image_url": None if image_info.get("public_id") else image_info["url"],
                "image_path": None if image_info.get("public_id") else image_info["path"],
                "image_public_id": image_info.get("public_id"),
            }
        )
    updates["updated_at"] = _now()

    document = get_collection(LISTINGS).find_one_and_update(
        {"_id": object_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize_listing(document, include_reviews=True) if document else None


def purchase_listing(listing_id, user_id, buyer_name=None):
    object_id = to_object_id(listing_id)
    if object_id is None:
        return None, "Listing not found."

    listing = get_collection(LISTINGS).find_one({"_id": object_id})
    if not listing:
        return None, "Listing not found."

    if listing.get("seller_id") == user_id:
        return None, "You cannot buy your own listing."

    if listing.get("status", "LISTED") != "LISTED":
        return None, "This listing is no longer available."

    now = _now()
    updates = {
        "status": "SOLD",
        "buyer_id": user_id,
        "buyer_name": buyer_name or "Anonymous Buyer",
        "sold_at": now,
        "updated_at": now,
    }
    document = get_collection(LISTINGS).find_one_and_update(
        {"_id": object_id, "status": "LISTED"},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not document:
        return None, "This listing is no longer available."

    get_collection(PURCHASES).insert_one(
        {
            "listing_id": str(listing_id),
            "buyer_id": user_id,
            "buyer_name": buyer_name or "Anonymous Buyer",
            "seller_id": document.get("seller_id"),
            "seller_name": document.get("seller_name"),
            "price": document.get("price", 0.0),
            "created_at": now,
        }
    )
    get_collection(WISHLIST).delete_one({"user_id": user_id, "listing_id": str(listing_id)})
    return _serialize_listing(document, include_reviews=True), None


def delete_listing(listing_id):
    object_id = to_object_id(listing_id)
    if object_id is None:
        return False
    result = get_collection(LISTINGS).delete_one({"_id": object_id})
    if result.deleted_count:
        get_collection(REVIEWS).delete_many({"listing": str(listing_id)})
        get_collection(WISHLIST).delete_many({"listing_id": str(listing_id)})
    return bool(result.deleted_count)


def list_reviews(listing_id=None):
    query = {"listing": str(listing_id)} if listing_id else {}
    cursor = get_collection(REVIEWS).find(query).sort("created_at", -1)
    return [serialize_document(document) for document in cursor]


def create_review(data):
    document = {
        "listing": str(data.get("listing") or data.get("listing_id") or ""),
        "user_id": data.get("user_id") or "anonymous_user",
        "user_name": data.get("user_name") or "Anonymous",
        "rating": _as_int(data.get("rating"), 5),
        "comment": data.get("comment") or "",
        "created_at": _now(),
    }
    result = get_collection(REVIEWS).insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_document(document), result.inserted_id
