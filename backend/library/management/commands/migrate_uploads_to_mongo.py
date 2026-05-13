from pathlib import PurePosixPath

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.utils import timezone

from library.models import LibraryBook
from manuscripts.models import Manuscript
from marketplace.models import Listing
from mongo_client import get_collection


MANUSCRIPT_SOURCE = "sqlite:manuscripts.Manuscript"
LISTING_SOURCE = "sqlite:marketplace.Listing"
LIBRARY_BOOK_SOURCE = "sqlite:library.LibraryBook"


class Command(BaseCommand):
    help = "Copy existing SQLite upload records into MongoDB upload collections."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            default="http://127.0.0.1:8000",
            help="Base URL used to turn relative media URLs into absolute URLs.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be copied without inserting MongoDB documents.",
        )

    def handle(self, *args, **options):
        base_url = options["base_url"].rstrip("/")
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run enabled: no MongoDB documents will be inserted."))

        manuscript_count = self.migrate_manuscripts(base_url, dry_run)
        listing_count = self.migrate_listings(base_url, dry_run)
        library_book_count = self.migrate_library_books(base_url, dry_run)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("SQLite upload migration complete."))
        self.stdout.write(f"manuscripts copied: {manuscript_count}")
        self.stdout.write(f"marketplace_listings copied: {listing_count}")
        self.stdout.write(f"library_books copied: {library_book_count}")

    def migrate_manuscripts(self, base_url, dry_run):
        collection = get_collection("manuscripts")
        copied = 0

        for manuscript in Manuscript.objects.all().iterator():
            if self.exists(collection, MANUSCRIPT_SOURCE, manuscript.pk):
                continue

            file_info = self.file_info(manuscript.file, base_url, f"Manuscript {manuscript.pk} file")
            now = timezone.now()
            document = {
                "title": manuscript.title,
                "content": manuscript.content or "",
                "author_id": str(manuscript.author_id or ""),
                "author_name": str(getattr(manuscript, "author_name", "") or ""),
                "status": manuscript.status or "DRAFT",
                "file_url": file_info["url"],
                "file_path": file_info["path"],
                "original_filename": file_info["original_filename"],
                "file_type": file_info["content_type"],
                "file_size": file_info["size"],
                "file_public_id": None,
                "created_at": manuscript.created_at or now,
                "updated_at": manuscript.updated_at or manuscript.created_at or now,
                "legacy_source": MANUSCRIPT_SOURCE,
                "legacy_sqlite_id": str(manuscript.pk),
            }

            if not dry_run:
                collection.insert_one(document)
            copied += 1

        return copied

    def migrate_listings(self, base_url, dry_run):
        collection = get_collection("marketplace_listings")
        copied = 0

        for listing in Listing.objects.all().iterator():
            if self.exists(collection, LISTING_SOURCE, listing.pk):
                continue

            image_info = self.file_info(listing.image, base_url, f"Listing {listing.pk} image")
            now = timezone.now()
            document = {
                "title": listing.title,
                "author": listing.author or "Unknown Author",
                "description": listing.description or "",
                "genre": listing.genre or "OTHER",
                "language": listing.language or "RO",
                "pages": int(listing.pages or 0),
                "price": float(listing.price or 0),
                "condition": listing.condition or "GOOD",
                "seller_id": str(listing.seller_id or ""),
                "seller_name": listing.seller_name or "Anonymous Seller",
                "status": listing.status or "LISTED",
                "image_url": image_info["url"],
                "image_path": image_info["path"],
                "image_public_id": None,
                "created_at": listing.created_at or now,
                "updated_at": listing.updated_at or listing.created_at or now,
                "legacy_source": LISTING_SOURCE,
                "legacy_sqlite_id": str(listing.pk),
            }

            if not dry_run:
                collection.insert_one(document)
            copied += 1

        return copied

    def migrate_library_books(self, base_url, dry_run):
        collection = get_collection("library_books")
        copied = 0

        for book in LibraryBook.objects.all().iterator():
            if self.exists(collection, LIBRARY_BOOK_SOURCE, book.pk):
                continue

            cover_info = self.file_info(book.cover_image, base_url, f"LibraryBook {book.pk} cover")
            pdf_info = self.file_info(book.pdf_file, base_url, f"LibraryBook {book.pk} PDF")
            now = timezone.now()
            document = {
                "title": book.title,
                "author": book.author,
                "description": book.description or "",
                "category": str(getattr(book, "category", "") or ""),
                "genres": book.genres if isinstance(book.genres, list) else [],
                "pdf_url": pdf_info["url"] or book.pdf_url or "",
                "pdf_path": pdf_info["path"],
                "pdf_public_id": None,
                "cover_url": cover_info["url"] or book.cover_url or "",
                "cover_path": cover_info["path"],
                "cover_public_id": None,
                "epub_url": book.epub_url or "",
                "language": book.language or "English",
                "pages": int(book.pages or 0),
                "year_published": book.year_published,
                "is_free": bool(book.is_free),
                "is_featured": bool(book.is_featured),
                "created_at": book.created_at or now,
                "updated_at": book.updated_at or book.created_at or now,
                "legacy_source": LIBRARY_BOOK_SOURCE,
                "legacy_sqlite_id": str(book.pk),
            }

            if not dry_run:
                collection.insert_one(document)
            copied += 1

        return copied

    def exists(self, collection, source, sqlite_id):
        return collection.find_one(
            {
                "legacy_source": source,
                "legacy_sqlite_id": str(sqlite_id),
            },
            {"_id": 1},
        ) is not None

    def file_info(self, field_file, base_url, label):
        if not field_file or not getattr(field_file, "name", ""):
            return {
                "path": None,
                "url": None,
                "original_filename": "",
                "content_type": "",
                "size": 0,
            }

        storage_path = field_file.name
        url = self.absolute_url(self.safe_file_url(field_file), base_url)
        exists = default_storage.exists(storage_path)
        if not exists:
            self.stdout.write(self.style.WARNING(f"Warning: missing local file for {label}: {storage_path}"))

        return {
            "path": storage_path,
            "url": url,
            "original_filename": PurePosixPath(storage_path).name,
            "content_type": self.guess_content_type(storage_path),
            "size": self.safe_file_size(storage_path) if exists else 0,
        }

    def safe_file_url(self, field_file):
        try:
            return field_file.url
        except ValueError:
            return None

    def absolute_url(self, url, base_url):
        if not url:
            return None
        if url.startswith(("http://", "https://")):
            return url
        if url.startswith("/"):
            return f"{base_url}{url}"
        media_url = settings.MEDIA_URL if settings.MEDIA_URL.startswith("/") else f"/{settings.MEDIA_URL}"
        return f"{base_url}{media_url.rstrip('/')}/{url}"

    def safe_file_size(self, storage_path):
        try:
            return default_storage.size(storage_path)
        except OSError:
            return 0

    def guess_content_type(self, storage_path):
        extension = PurePosixPath(storage_path).suffix.lower()
        return {
            ".pdf": "application/pdf",
            ".txt": "text/plain",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }.get(extension, "")
