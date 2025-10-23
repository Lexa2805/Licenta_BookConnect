from django.apps import AppConfig

class BooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "books"

    def ready(self):
        from django.conf import settings
        from mongoengine import connect

        uri = getattr(settings, "MONGO_URI", "mongodb://localhost:27017")
        db  = getattr(settings, "MONGO_DB",  "WebAppDB")
        connect(host=uri, db=db)  # alias-ul default e ok
