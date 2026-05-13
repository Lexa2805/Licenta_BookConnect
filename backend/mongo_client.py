from functools import lru_cache

from bson import ObjectId
from bson.errors import InvalidId
from django.conf import settings
from pymongo import MongoClient


@lru_cache(maxsize=1)
def get_mongo_client():
    return MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)


def get_mongo_db():
    return get_mongo_client()[settings.MONGO_DB]


def get_collection(name):
    return get_mongo_db()[name]


def to_object_id(value):
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        return None


def serialize_document(document):
    if not document:
        return None

    data = dict(document)
    object_id = data.get("_id")
    if object_id is not None:
        string_id = str(object_id)
        data["_id"] = string_id
        data["id"] = string_id

    for key, value in list(data.items()):
        if hasattr(value, "isoformat"):
            data[key] = value.isoformat()

    return data
