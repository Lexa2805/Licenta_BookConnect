# Licenta_BookConnect/apps.py
from django.apps import AppConfig
from mongoengine import connect
from django.conf import settings

class BooksConfig(AppConfig):
    """Inițializează conexiunea MongoEngine la pornirea aplicației Django."""
    name = "books"

    def ready(self) -> None:
        connect(
            db=settings.MONGO_DB,
            host=settings.MONGO_URI,
            uuidRepresentation="standard",
        )
