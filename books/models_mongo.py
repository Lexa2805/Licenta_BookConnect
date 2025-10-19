from typing import List, Optional, Dict
from datetime import datetime
from mongoengine import Document, EmbeddedDocument, fields

class Price(EmbeddedDocument):
    """Prețul unei cărți digitale."""
    amount: float = fields.FloatField(required=True)
    currency: str = fields.StringField(default="RON")

class Book(Document):
    """Cartea digitală publicată pe platformă."""
    meta = {
        "collection": "books",
        "strict": False,   # <— permite câmpuri care NU sunt definite în model
    }

    title: str = fields.StringField(required=True)
    authors: list[str] = fields.ListField(fields.StringField(), default=list)
    genres: list[str] = fields.ListField(fields.StringField(), default=list)
    description: str | None = fields.StringField()
    cover_url: str | None = fields.URLField()
    file_urls: dict[str, str] = fields.DictField()
    price = fields.EmbeddedDocumentField(Price, required=False, null=True)
    is_free: bool = fields.BooleanField(default=True)
    published_at = fields.DateTimeField(default=datetime.utcnow)
    stats: dict[str, int] = fields.DictField(default={"views": 0, "reads": 0})
    owner_user_id: str | None = fields.StringField()

