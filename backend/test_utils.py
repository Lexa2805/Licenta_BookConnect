from copy import deepcopy
from datetime import datetime

from bson import ObjectId


class FakeInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class FakeCursor(list):
    def sort(self, field, direction):
        reverse = direction < 0

        def sort_key(document):
            value = document.get(field)
            if isinstance(value, datetime):
                return value.timestamp()
            return value or ""

        return FakeCursor(sorted(self, key=sort_key, reverse=reverse))


class FakeCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        stored = deepcopy(document)
        stored.setdefault("_id", ObjectId())
        self.documents.append(stored)
        return FakeInsertResult(stored["_id"])

    def find(self, query=None):
        query = query or {}
        return FakeCursor([deepcopy(document) for document in self.documents if self._matches(document, query)])

    def find_one(self, query):
        for document in self.documents:
            if self._matches(document, query):
                return deepcopy(document)
        return None

    def find_one_and_update(self, query, update, return_document=None):
        for document in self.documents:
            if self._matches(document, query):
                document.update(update.get("$set", {}))
                return deepcopy(document)
        return None

    def delete_one(self, query):
        for index, document in enumerate(self.documents):
            if self._matches(document, query):
                del self.documents[index]
                return FakeDeleteResult(1)
        return FakeDeleteResult(0)

    def delete_many(self, query):
        before = len(self.documents)
        self.documents = [document for document in self.documents if not self._matches(document, query)]
        return FakeDeleteResult(before - len(self.documents))

    def _matches(self, document, query):
        return all(self._matches_value(document.get(key), expected) for key, expected in query.items())

    def _matches_value(self, actual, expected):
        if isinstance(expected, dict) and "$in" in expected:
            return actual in expected["$in"]
        return actual == expected


class FakeMongo:
    def __init__(self):
        self.collections = {}

    def get_collection(self, name):
        if name not in self.collections:
            self.collections[name] = FakeCollection()
        return self.collections[name]
