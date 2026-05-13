from datetime import datetime, timezone

from mongo_client import get_collection, serialize_document, to_object_id
from pymongo import ReturnDocument


GROUPS = "chat_groups"
MEMBERS = "chat_group_members"
MESSAGES = "chat_messages"


def _now():
    return datetime.now(timezone.utc)


def _as_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).lower() in {"1", "true", "yes", "on"}


def _as_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _serialize_member(document):
    data = serialize_document(document)
    if data is None:
        return None
    data.setdefault("group", data.get("group_id"))
    return data


def _message_preview(message):
    content = (message.get("content") or "").strip()
    if content:
        return content[:50] + ("..." if len(content) > 50 else "")

    if message.get("attachment_url") or message.get("attachment"):
        attachment_type = message.get("attachment_type") or ""
        if attachment_type.startswith("image/"):
            return "Shared a photo"
        attachment_name = message.get("attachment_name") or ""
        if attachment_name:
            return f"Shared {attachment_name[:40]}"
        return "Shared an attachment"

    return ""


def _serialize_message(document):
    data = serialize_document(document)
    if data is None:
        return None
    data.setdefault("group", data.get("group_id"))
    data.setdefault("receiver_id", None)
    data.setdefault("receiver_name", None)
    data.setdefault("content", "")
    data.setdefault("attachment", data.get("attachment_path"))
    data.setdefault("attachment_url", None)
    data.setdefault("attachment_name", "")
    data.setdefault("attachment_type", "")
    data.setdefault("attachment_size", None)
    data.setdefault("is_read", False)
    return data


def _serialize_group(document, include_members=True):
    data = serialize_document(document)
    if data is None:
        return None

    group_id = data["id"]
    member_docs = list(get_collection(MEMBERS).find({"group_id": group_id}).sort("joined_at", 1))
    data["member_count"] = len(member_docs)
    if include_members:
        data["members"] = [_serialize_member(member) for member in member_docs]

    last_message = get_collection(MESSAGES).find_one({"group_id": group_id}, sort=[("timestamp", -1)])
    if last_message:
        data["last_message"] = _message_preview(last_message)
        timestamp = last_message.get("timestamp")
        data["last_message_time"] = timestamp.isoformat() if hasattr(timestamp, "isoformat") else timestamp

    return data


def list_groups():
    cursor = get_collection(GROUPS).find({}).sort("created_at", -1)
    return [_serialize_group(group) for group in cursor]


def get_group(group_id):
    object_id = to_object_id(group_id)
    if object_id is None:
        return None
    group = get_collection(GROUPS).find_one({"_id": object_id})
    return _serialize_group(group) if group else None


def create_group(data):
    now = _now()
    document = {
        "name": data.get("name") or "",
        "description": data.get("description") or "",
        "created_by": data.get("created_by") or "",
        "created_at": now,
    }
    result = get_collection(GROUPS).insert_one(document)
    document["_id"] = result.inserted_id
    group_id = str(result.inserted_id)
    if document["created_by"]:
        join_group(group_id, document["created_by"])
    return _serialize_group(document), result.inserted_id


def update_group(group_id, data):
    object_id = to_object_id(group_id)
    if object_id is None:
        return None
    updates = {}
    for field in ("name", "description", "created_by"):
        if field in data:
            updates[field] = data.get(field) or ""
    if not updates:
        return get_group(group_id)
    group = get_collection(GROUPS).find_one_and_update(
        {"_id": object_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize_group(group) if group else None


def delete_group(group_id):
    object_id = to_object_id(group_id)
    if object_id is None:
        return False
    result = get_collection(GROUPS).delete_one({"_id": object_id})
    if result.deleted_count:
        get_collection(MEMBERS).delete_many({"group_id": str(group_id)})
        get_collection(MESSAGES).delete_many({"group_id": str(group_id)})
    return bool(result.deleted_count)


def list_my_groups(user_id):
    memberships = list(get_collection(MEMBERS).find({"user_id": user_id}).sort("joined_at", -1))
    groups = []
    for membership in memberships:
        group = get_group(membership.get("group_id"))
        if group:
            group["is_member"] = True
            groups.append(group)
    groups.sort(key=lambda item: item.get("last_message_time") or item.get("created_at") or "", reverse=True)
    return groups


def join_group(group_id, user_id):
    existing = get_collection(MEMBERS).find_one({"group_id": str(group_id), "user_id": user_id})
    if existing:
        return _serialize_member(existing), False

    document = {
        "group_id": str(group_id),
        "group": str(group_id),
        "user_id": user_id,
        "joined_at": _now(),
    }
    result = get_collection(MEMBERS).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_member(document), True


def leave_group(group_id, user_id):
    result = get_collection(MEMBERS).delete_one({"group_id": str(group_id), "user_id": user_id})
    return bool(result.deleted_count)


def list_members(group_id):
    cursor = get_collection(MEMBERS).find({"group_id": str(group_id)}).sort("joined_at", 1)
    return [_serialize_member(member) for member in cursor]


def list_messages(group_id=None, receiver_id=None, sender_id=None):
    query = {}
    if group_id:
        query["group_id"] = str(group_id)
    elif receiver_id and sender_id:
        query = {
            "group_id": None,
            "$or": [
                {"sender_id": sender_id, "receiver_id": receiver_id},
                {"sender_id": receiver_id, "receiver_id": sender_id},
            ],
        }
    cursor = get_collection(MESSAGES).find(query).sort("timestamp", 1)
    return [_serialize_message(message) for message in cursor]


def create_message(data, attachment_info=None):
    group_id = data.get("group") or data.get("group_id")
    document = {
        "sender_id": data.get("sender_id") or "anonymous_sender",
        "sender_name": data.get("sender_name") or "Anonymous",
        "group_id": str(group_id) if group_id else None,
        "group": str(group_id) if group_id else None,
        "receiver_id": data.get("receiver_id") or None,
        "receiver_name": data.get("receiver_name") or None,
        "content": data.get("content") or "",
        "attachment_path": attachment_info["path"] if attachment_info else None,
        "attachment": attachment_info["path"] if attachment_info else None,
        "attachment_url": attachment_info["url"] if attachment_info else None,
        "attachment_name": (
            data.get("attachment_name")
            or (attachment_info["original_filename"] if attachment_info else "")
        ),
        "attachment_type": (
            data.get("attachment_type")
            or (attachment_info["content_type"] if attachment_info else "")
        ),
        "attachment_size": _as_int(
            data.get("attachment_size"),
            attachment_info["size"] if attachment_info else None,
        ),
        "timestamp": _now(),
        "is_read": _as_bool(data.get("is_read"), False),
    }
    result = get_collection(MESSAGES).insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_message(document), result.inserted_id


def list_conversations(user_id):
    cursor = get_collection(MESSAGES).find(
        {
            "group_id": None,
            "$or": [{"sender_id": user_id}, {"receiver_id": user_id}],
        }
    ).sort("timestamp", -1)

    conversations = {}
    for message in cursor:
        if message.get("sender_id") == user_id:
            other_id = message.get("receiver_id")
            other_name = message.get("receiver_name") or "Unknown"
        else:
            other_id = message.get("sender_id")
            other_name = message.get("sender_name") or "Unknown"

        if other_id and other_id not in conversations:
            timestamp = message.get("timestamp")
            conversations[other_id] = {
                "id": other_id,
                "participant_id": other_id,
                "participant_name": other_name,
                "last_message": _message_preview(message),
                "last_message_time": timestamp.isoformat() if hasattr(timestamp, "isoformat") else timestamp,
                "unread_count": 0,
            }

    return list(conversations.values())
