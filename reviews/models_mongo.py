from datetime import datetime
from typing import Optional
from mongoengine import Document, fields

class Review(Document):
    """Recenzie pentru o carte."""
    meta = {"collection": "reviews", "strict": False}

    book_id: str = fields.StringField(required=True)
    user_id: str = fields.StringField(required=True)
    rating: int = fields.IntField(min_value=1, max_value=5, required=True)
    body: Optional[str] = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.utcnow)