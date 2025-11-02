from typing import List, Optional, Dict
from datetime import datetime
from mongoengine import Document, EmbeddedDocument, fields


class Price(EmbeddedDocument):
    """Embedded document care descrie prețul unei cărți."""

    amount: float = fields.FloatField(required=True)
    currency: str = fields.StringField(default="RON")


class Book(Document):
    """
    Document MongoDB pentru cărți.

    Reține informații de bază (titlu, autori, genuri), date media (copertă, fișiere),
    informații comerciale (preț) și statistici (vizualizări, lecturi).
    """

    meta = {
        "collection": "books",
        "strict": False,
    }

    title: str = fields.StringField(required=True)
    authors: List[str] = fields.ListField(fields.StringField(), default=list)
    genres: List[str] = fields.ListField(fields.StringField(), default=list)
    description: Optional[str] = fields.StringField()
    cover_url: Optional[str] = fields.URLField()
    file_urls: Dict[str, str] = fields.DictField()
    price: Optional[Price] = fields.EmbeddedDocumentField(
        Price,
        required=False,
        null=True,
    )
    is_free: bool = fields.BooleanField(default=True)
    published_at: datetime = fields.DateTimeField(default=datetime.utcnow)
    stats: Dict[str, int] = fields.DictField(default={"views": 0, "reads": 0})
    owner_user_id: Optional[str] = fields.StringField()
