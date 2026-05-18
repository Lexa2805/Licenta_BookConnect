from datetime import datetime, timezone

from mongo_client import get_collection, serialize_document, to_object_id
from pymongo import ReturnDocument


COLLECTION = "manuscripts"
FEEDBACK_COLLECTION = "manuscript_feedback"
USERS_COLLECTION = "users"


def _now():
    return datetime.now(timezone.utc)


def _user_display_name(author_id):
    object_id = to_object_id(author_id)
    if object_id is None:
        return ""

    user = get_collection(USERS_COLLECTION).find_one(
        {"_id": object_id},
        {"username": 1, "name": 1, "email": 1},
    )
    if not user:
        return ""

    return (
        (user.get("username") or "").strip()
        or (user.get("name") or "").strip()
        or (user.get("email") or "").split("@")[0].strip()
    )


def _serialize_manuscript(document, feedback=None):
    data = serialize_document(document)
    if data is None:
        return None
    data.setdefault("author_name", "")
    if not data.get("author_name"):
        data["author_name"] = _user_display_name(data.get("author_id"))
    data.setdefault("file_url", None)
    data.setdefault("file_path", None)
    data.setdefault("file", data.get("file_path"))
    data.setdefault("original_filename", "")
    data.setdefault("file_type", "")
    data.setdefault("file_size", 0)
    data.setdefault("file_public_id", None)
    data.setdefault("cover_url", "")
    data.setdefault("cover_prompt", "")
    data.setdefault("cover_tagline", "")
    data.setdefault("cover_palette", [])
    data["feedback"] = feedback if feedback is not None else []
    return data


def _serialize_feedback(document):
    data = serialize_document(document)
    if data is None:
        return None
    data.setdefault("selected_text", "")
    return data


def list_manuscripts(author_id=None):
    query = {"author_id": author_id} if author_id else {"status": "PUBLISHED"}
    cursor = get_collection(COLLECTION).find(query).sort("updated_at", -1)
    return [_serialize_manuscript(document) for document in cursor]


def get_manuscript(manuscript_id, author_id=None, require_published=False):
    object_id = to_object_id(manuscript_id)
    if object_id is None:
        return None

    query = {"_id": object_id}
    if author_id:
        query["author_id"] = author_id
    elif require_published:
        query["status"] = "PUBLISHED"

    document = get_collection(COLLECTION).find_one(query)
    if not document:
        return None

    feedback = list_feedback(manuscript_id) if document.get("status") == "PUBLISHED" else []
    return _serialize_manuscript(document, feedback=feedback)


def create_manuscript(data, file_info=None):
    now = _now()
    author_id = data.get("author_id") or "anonymous_author"
    author_name = data.get("author_name") or data.get("author") or _user_display_name(author_id)
    document = {
        "title": data.get("title") or "Untitled manuscript",
        "content": data.get("content") or "",
        "author_id": author_id,
        "author_name": author_name,
        "status": (data.get("status") or "DRAFT").upper(),
        "file_url": file_info["url"] if file_info else None,
        "file_path": file_info["path"] if file_info else None,
        "original_filename": file_info["original_filename"] if file_info else "",
        "file_type": file_info["content_type"] if file_info else "",
        "file_size": file_info["size"] if file_info else 0,
        "file_public_id": None,
        "cover_url": data.get("cover_url") or "",
        "cover_prompt": data.get("cover_prompt") or "",
        "cover_tagline": data.get("cover_tagline") or "",
        "cover_palette": data.get("cover_palette") or [],
        "created_at": now,
        "updated_at": now,
    }
    result = get_collection(COLLECTION).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_manuscript(document), result.inserted_id


def update_manuscript(manuscript_id, data, author_id=None, file_info=None):
    object_id = to_object_id(manuscript_id)
    if object_id is None:
        return None

    updates = {}
    for field in ("title", "content", "author_name", "cover_url", "cover_prompt", "cover_tagline"):
        if field in data:
            updates[field] = data.get(field) or ""
    if "cover_palette" in data:
        palette = data.get("cover_palette") or []
        updates["cover_palette"] = palette if isinstance(palette, list) else []
    if "status" in data:
        updates["status"] = (data.get("status") or "DRAFT").upper()
    if file_info:
        updates.update(
            {
                "file_url": file_info["url"],
                "file_path": file_info["path"],
                "original_filename": file_info["original_filename"],
                "file_type": file_info["content_type"],
                "file_size": file_info["size"],
                "file_public_id": None,
            }
        )
    updates["updated_at"] = _now()

    query = {"_id": object_id}
    if author_id:
        query["author_id"] = author_id

    document = get_collection(COLLECTION).find_one_and_update(
        query,
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize_manuscript(document) if document else None


def delete_manuscript(manuscript_id, author_id=None):
    object_id = to_object_id(manuscript_id)
    if object_id is None:
        return False
    query = {"_id": object_id}
    if author_id:
        query["author_id"] = author_id
    result = get_collection(COLLECTION).delete_one(query)
    if result.deleted_count:
        get_collection(FEEDBACK_COLLECTION).delete_many({"manuscript": str(manuscript_id)})
    return bool(result.deleted_count)


def list_feedback(manuscript_id):
    cursor = get_collection(FEEDBACK_COLLECTION).find({"manuscript": str(manuscript_id)}).sort("created_at", -1)
    return [_serialize_feedback(document) for document in cursor]


def create_feedback(manuscript_id, data):
    document = {
        "manuscript": str(manuscript_id),
        "user_id": data.get("user_id") or "anonymous_user",
        "user_name": data.get("user_name") or "Anonymous",
        "selected_text": data.get("selected_text") or "",
        "comment": data.get("comment") or "",
        "created_at": _now(),
    }
    result = get_collection(FEEDBACK_COLLECTION).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_feedback(document), result.inserted_id
