import json
import re
from datetime import datetime, timedelta, timezone

from mongo_client import get_collection, serialize_document, to_object_id
from pymongo import ReturnDocument


BOOKS = "library_books"
USER_LIBRARY = "user_library"
BOOKMARKS = "bookmarks"
READING_SESSIONS = "reading_sessions"


def _now():
    return datetime.now(timezone.utc)


def _as_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).lower() in {"1", "true", "yes", "on"}


def _as_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _as_genres(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if not value:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _serialize_book(document):
    data = serialize_document(document)
    if data is None:
        return None

    data.setdefault("description", "")
    data.setdefault("category", "")
    data.setdefault("genres", [])
    data.setdefault("language", "English")
    data.setdefault("pages", 0)
    data.setdefault("year_published", None)
    data.setdefault("is_free", True)
    data.setdefault("is_featured", False)
    data.setdefault("epub_url", "")
    data.setdefault("cover_url", "")
    data.setdefault("cover_path", None)
    data.setdefault("cover_public_id", None)
    data.setdefault("pdf_url", "")
    data.setdefault("pdf_path", None)
    data.setdefault("pdf_public_id", None)
    data["cover_image"] = data.get("cover_url") or None
    data["pdf_file"] = data.get("pdf_url") or None
    data["cover"] = data.get("cover_url") or ""
    data["pdf"] = data.get("pdf_url") or ""
    return data


def list_books(params=None):
    params = params or {}
    query = {}

    search = params.get("search")
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        query["$or"] = [{"title": pattern}, {"author": pattern}, {"description": pattern}]

    genre = params.get("genre")
    if genre:
        query["genres"] = {"$in": [genre]}

    if str(params.get("featured")).lower() == "true":
        query["is_featured"] = True
    if str(params.get("is_free")).lower() == "true":
        query["is_free"] = True

    cursor = get_collection(BOOKS).find(query).sort("created_at", -1)
    return [_serialize_book(document) for document in cursor]


def get_book(book_id):
    object_id = to_object_id(book_id)
    if object_id is None:
        return None
    return _serialize_book(get_collection(BOOKS).find_one({"_id": object_id}))


def _book_document(data, cover_info=None, pdf_info=None, existing=None):
    existing = existing or {}
    cover_url = data.get("cover_url")
    pdf_url = data.get("pdf_url")
    if cover_info:
        cover_url = cover_info["url"]
    if pdf_info:
        pdf_url = pdf_info["url"]

    return {
        "title": data.get("title", existing.get("title", "")),
        "author": data.get("author", existing.get("author", "")),
        "description": data.get("description", existing.get("description", "")) or "",
        "category": data.get("category", existing.get("category", "")) or "",
        "genres": _as_genres(data.get("genres", existing.get("genres", []))),
        "pdf_url": pdf_url if pdf_url is not None else existing.get("pdf_url", ""),
        "pdf_path": pdf_info["path"] if pdf_info else existing.get("pdf_path"),
        "pdf_public_id": None if pdf_info else existing.get("pdf_public_id"),
        "cover_url": cover_url if cover_url is not None else existing.get("cover_url", ""),
        "cover_path": cover_info["path"] if cover_info else existing.get("cover_path"),
        "cover_public_id": None if cover_info else existing.get("cover_public_id"),
        "epub_url": data.get("epub_url", existing.get("epub_url", "")) or "",
        "language": data.get("language", existing.get("language", "English")) or "English",
        "pages": _as_int(data.get("pages", existing.get("pages", 0)), 0),
        "year_published": (
            _as_int(data.get("year_published"), None)
            if data.get("year_published") not in (None, "")
            else existing.get("year_published")
        ),
        "is_free": _as_bool(data.get("is_free"), existing.get("is_free", True)),
        "is_featured": _as_bool(data.get("is_featured"), existing.get("is_featured", False)),
    }


def create_book(data, cover_info=None, pdf_info=None):
    now = _now()
    document = _book_document(data, cover_info=cover_info, pdf_info=pdf_info)
    document["created_at"] = now
    document["updated_at"] = now
    result = get_collection(BOOKS).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_book(document), result.inserted_id


def update_book(book_id, data, cover_info=None, pdf_info=None):
    object_id = to_object_id(book_id)
    if object_id is None:
        return None
    existing = get_collection(BOOKS).find_one({"_id": object_id})
    if not existing:
        return None
    updates = _book_document(data, cover_info=cover_info, pdf_info=pdf_info, existing=existing)
    updates["updated_at"] = _now()
    document = get_collection(BOOKS).find_one_and_update(
        {"_id": object_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize_book(document)


def delete_book(book_id):
    object_id = to_object_id(book_id)
    if object_id is None:
        return False
    result = get_collection(BOOKS).delete_one({"_id": object_id})
    if result.deleted_count:
        get_collection(USER_LIBRARY).delete_many({"book_id": str(book_id)})
        get_collection(BOOKMARKS).delete_many({"book": str(book_id)})
        get_collection(READING_SESSIONS).delete_many({"book": str(book_id)})
    return bool(result.deleted_count)


def toggle_featured(book_id):
    book = get_book(book_id)
    if not book:
        return None
    return update_book(book_id, {"is_featured": not book.get("is_featured", False)})


def _serialize_library_entry(document):
    data = serialize_document(document)
    if data is None:
        return None
    data["book"] = get_book(data.get("book_id")) or {"id": data.get("book_id")}
    return data


def list_user_library(user_id=None, status=None, favorites=False):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    if favorites:
        query["is_favorite"] = True
    cursor = get_collection(USER_LIBRARY).find(query).sort("updated_at", -1)
    return [_serialize_library_entry(document) for document in cursor]


def get_user_library_entry(entry_id):
    object_id = to_object_id(entry_id)
    if object_id is None:
        return None
    return _serialize_library_entry(get_collection(USER_LIBRARY).find_one({"_id": object_id}))


def create_user_library_entry(data):
    user_id = data.get("user_id")
    book_id = str(data.get("book_id") or data.get("book") or "")
    existing = get_collection(USER_LIBRARY).find_one({"user_id": user_id, "book_id": book_id})
    if existing:
        return _serialize_library_entry(existing), False

    now = _now()
    document = {
        "user_id": user_id,
        "book_id": book_id,
        "status": data.get("status") or "WANT_TO_READ",
        "is_favorite": _as_bool(data.get("is_favorite"), False),
        "current_page": _as_int(data.get("current_page"), 0),
        "rating": data.get("rating"),
        "notes": data.get("notes") or "",
        "added_at": now,
        "updated_at": now,
    }
    result = get_collection(USER_LIBRARY).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_library_entry(document), True


def update_user_library_entry(entry_id, data):
    object_id = to_object_id(entry_id)
    if object_id is None:
        return None
    updates = {}
    for field in ("status", "notes"):
        if field in data:
            updates[field] = data.get(field)
    for field in ("is_favorite",):
        if field in data:
            updates[field] = _as_bool(data.get(field), False)
    for field in ("current_page", "rating"):
        if field in data:
            updates[field] = _as_int(data.get(field), 0)
    updates["updated_at"] = _now()
    document = get_collection(USER_LIBRARY).find_one_and_update(
        {"_id": object_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize_library_entry(document)


def delete_user_library_entry(entry_id):
    object_id = to_object_id(entry_id)
    if object_id is None:
        return False
    return bool(get_collection(USER_LIBRARY).delete_one({"_id": object_id}).deleted_count)


def list_bookmarks(user_id=None, book_id=None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if book_id:
        query["book"] = str(book_id)
    cursor = get_collection(BOOKMARKS).find(query).sort([("page_number", 1), ("created_at", -1)])
    return [serialize_document(document) for document in cursor]


def create_bookmark(data):
    vibe_card_stickers = data.get("vibe_card_stickers") or []
    if not isinstance(vibe_card_stickers, list):
        vibe_card_stickers = []

    document = {
        "user_id": data.get("user_id"),
        "book": str(data.get("book") or data.get("book_id") or ""),
        "page_number": _as_int(data.get("page_number"), 1),
        "paragraph_text": data.get("paragraph_text") or "",
        "note": data.get("note") or "",
        "color": data.get("color") or "yellow",
        "vibe_card_image_url": data.get("vibe_card_image_url") or "",
        "vibe_card_prompt": data.get("vibe_card_prompt") or "",
        "vibe_card_caption": data.get("vibe_card_caption") or "",
        "vibe_card_theme": data.get("vibe_card_theme") or "",
        "vibe_card_mood": data.get("vibe_card_mood") or "",
        "vibe_card_stickers": vibe_card_stickers,
        "created_at": _now(),
    }
    result = get_collection(BOOKMARKS).insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_document(document), result.inserted_id


def delete_bookmark(bookmark_id):
    object_id = to_object_id(bookmark_id)
    if object_id is None:
        return False
    return bool(get_collection(BOOKMARKS).delete_one({"_id": object_id}).deleted_count)


def create_reading_session(data):
    now = _now()
    document = {
        "user_id": data.get("user_id"),
        "book": str(data.get("book") or data.get("book_id") or ""),
        "started_at": now,
        "ended_at": None,
        "pages_read": 0,
        "start_page": _as_int(data.get("start_page"), 0),
        "end_page": _as_int(data.get("end_page"), 0),
    }
    result = get_collection(READING_SESSIONS).insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_document(document), result.inserted_id


def end_reading_session(session_id, end_page):
    object_id = to_object_id(session_id)
    if object_id is None:
        return None
    session = get_collection(READING_SESSIONS).find_one({"_id": object_id})
    if not session:
        return None
    end_page_int = _as_int(end_page, session.get("start_page", 0))
    updates = {
        "ended_at": _now(),
        "end_page": end_page_int,
        "pages_read": max(0, end_page_int - session.get("start_page", 0)),
    }
    document = get_collection(READING_SESSIONS).find_one_and_update(
        {"_id": object_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    entry = get_collection(USER_LIBRARY).find_one(
        {"user_id": document.get("user_id"), "book_id": document.get("book")}
    )
    if entry:
        update_user_library_entry(entry["_id"], {"current_page": end_page_int})
    return serialize_document(document)


def reading_streak(user_id):
    cursor = get_collection(READING_SESSIONS).find({"user_id": user_id}, {"started_at": 1})
    days = {document["started_at"].date() for document in cursor if document.get("started_at")}
    today = datetime.now(timezone.utc).date()
    cursor_day = today
    if cursor_day not in days and (today - timedelta(days=1)) in days:
        cursor_day = today - timedelta(days=1)

    streak_days = 0
    while cursor_day in days:
        streak_days += 1
        cursor_day = cursor_day - timedelta(days=1)

    return {
        "streak_days": streak_days,
        "active_today": today in days,
        "last_read_date": max(days).isoformat() if days else None,
        "tracked_days": len(days),
    }
