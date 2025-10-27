from mongoengine import Document, StringField, BooleanField, ListField, DictField
from werkzeug.security import generate_password_hash, check_password_hash


class Users(Document):
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(default="reader", choices=["reader", "author", "admin"])
    is_active = BooleanField(default=True)

    createdAt = StringField()
    purchasedBooks = ListField()
    chatRooms = ListField()
    uploadedManuscripts = ListField()
    profile = DictField()
    favorites = ListField()
    wallet = DictField()

    meta = {
        "collection": "users",
        "strict": False,
    }

    def set_password(self, raw_password: str) -> None:
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password, raw_password)
