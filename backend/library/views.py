import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.http import require_POST
from .forms import LibraryBookForm
from . import mongo_service
from upload_storage import save_uploaded_file


logger = logging.getLogger(__name__)


class FileRef:
    def __init__(self, url=None, path=None):
        self.url = url
        self.name = path or ""

    def __bool__(self):
        return bool(self.url or self.name)


class TemplateBook:
    def __init__(self, data):
        self.data = data
        for key, value in data.items():
            setattr(self, key, value)
        self.pk = data.get("id")
        self.cover_image = FileRef(data.get("cover_url"), data.get("cover_path"))
        self.pdf_file = FileRef(data.get("pdf_url"), data.get("pdf_path"))


def _log_request_payload(prefix, request):
    files = {
        name: {
            "name": uploaded_file.name,
            "size": uploaded_file.size,
            "content_type": getattr(uploaded_file, "content_type", ""),
        }
        for name, uploaded_file in request.FILES.items()
    }
    data = getattr(request, "data", {})
    logger.info("%s fields=%s files=%s", prefix, list(request.POST.keys()) or list(data.keys()), files)


def _save_library_uploads(request):
    cover_info = None
    pdf_info = None
    cover_file = request.FILES.get("cover_image")
    pdf_file = request.FILES.get("pdf_file")
    if cover_file:
        cover_info = save_uploaded_file(cover_file, "library/covers", request)
        logger.info("library.book saved_cover_path=%s", cover_info["path"])
    if pdf_file:
        pdf_info = save_uploaded_file(pdf_file, "library/pdfs", request)
        logger.info("library.book saved_pdf_path=%s", pdf_info["path"])
    return cover_info, pdf_info


# ---------------------------------------------------------------------------
# Template-based Book Management Views
# ---------------------------------------------------------------------------

def book_manage_list(request):
    """List all books with search; accessible at /manage/books/"""
    search = request.GET.get("q", "").strip()
    books = [TemplateBook(book) for book in mongo_service.list_books({"search": search} if search else {})]
    return render(request, "library/manage_list.html", {
        "books": books,
        "search": search,
        "total": len(mongo_service.list_books()),
    })


def book_manage_create(request):
    """Create a new book."""
    if request.method == "POST":
        form = LibraryBookForm(request.POST, request.FILES)
        if form.is_valid():
            _log_request_payload("library.manage.create", request)
            cover_info, pdf_info = _save_library_uploads(request)
            book, inserted_id = mongo_service.create_book(form.cleaned_data, cover_info=cover_info, pdf_info=pdf_info)
            logger.info("library.manage.create inserted_mongodb_id=%s", inserted_id)
            messages.success(request, "Book added successfully!")
            return redirect("library_manage:list")
    else:
        form = LibraryBookForm()
    return render(request, "library/manage_form.html", {
        "form": form,
        "action": "Add New Book",
        "submit_label": "Add Book",
    })


def book_manage_edit(request, pk):
    """Edit an existing book."""
    book = mongo_service.get_book(pk)
    if not book:
        messages.error(request, "Book not found.")
        return redirect("library_manage:list")
    if request.method == "POST":
        form = LibraryBookForm(request.POST, request.FILES)
        if form.is_valid():
            _log_request_payload("library.manage.update", request)
            cover_info, pdf_info = _save_library_uploads(request)
            mongo_service.update_book(pk, form.cleaned_data, cover_info=cover_info, pdf_info=pdf_info)
            messages.success(request, f'"{book.get("title")}" updated successfully!')
            return redirect("library_manage:list")
    else:
        form = LibraryBookForm(initial=book)
    return render(request, "library/manage_form.html", {
        "form": form,
        "book": TemplateBook(book),
        "action": f"Edit: {book.get('title')}",
        "submit_label": "Save Changes",
    })


@require_POST
def book_manage_delete(request, pk):
    """Delete a book (POST only)."""
    book = mongo_service.get_book(pk)
    if not book:
        messages.error(request, "Book not found.")
        return redirect("library_manage:list")
    title = book.get("title")
    mongo_service.delete_book(pk)
    messages.success(request, f'"{title}" has been deleted.')
    return redirect("library_manage:list")


class LibraryBookViewSet(viewsets.ViewSet):
    """
    ViewSet for managing library books (admin functionality).
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        return Response(mongo_service.list_books(request.query_params))

    def retrieve(self, request, pk=None):
        book = mongo_service.get_book(pk)
        if not book:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(book)

    def create(self, request):
        _log_request_payload("library.book.create", request)
        if not request.data.get("title") or not request.data.get("author"):
            errors = {'detail': 'Title and author are required.'}
            logger.warning("library.book.create validation_errors=%s", errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            cover_info, pdf_info = _save_library_uploads(request)
            book, inserted_id = mongo_service.create_book(request.data, cover_info=cover_info, pdf_info=pdf_info)
            logger.info("library.book.create inserted_mongodb_id=%s", inserted_id)
            return Response(book, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("library.book.create validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to save library book in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    def _update(self, request, pk=None):
        _log_request_payload("library.book.update", request)
        try:
            cover_info, pdf_info = _save_library_uploads(request)
            book = mongo_service.update_book(pk, request.data, cover_info=cover_info, pdf_info=pdf_info)
            if not book:
                return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(book)
        except Exception as exc:
            logger.exception("library.book.update validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to update library book in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None):
        if not mongo_service.delete_book(pk):
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of a book"""
        book = mongo_service.toggle_featured(pk)
        if not book:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(book)


class UserLibraryViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user's personal library.
    """
    parser_classes = [FormParser, JSONParser]

    def list(self, request):
        return Response(
            mongo_service.list_user_library(
                user_id=request.query_params.get('user_id'),
                status=request.query_params.get('status'),
                favorites=request.query_params.get('favorites') == 'true',
            )
        )

    def retrieve(self, request, pk=None):
        entry = mongo_service.get_user_library_entry(pk)
        if not entry:
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(entry)

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        book_id = request.data.get('book_id')

        if not user_id or not book_id:
            return Response({'detail': 'user_id and book_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        entry, created = mongo_service.create_user_library_entry(request.data)
        return Response(entry, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def partial_update(self, request, pk=None):
        entry = mongo_service.update_user_library_entry(pk, request.data)
        if not entry:
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(entry)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def destroy(self, request, pk=None):
        if not mongo_service.delete_user_library_entry(pk):
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status"""
        entry = mongo_service.get_user_library_entry(pk)
        if not entry:
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(mongo_service.update_user_library_entry(pk, {'is_favorite': not entry.get('is_favorite')}))

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update reading progress"""
        current_page = request.data.get('current_page', 0)
        entry = mongo_service.get_user_library_entry(pk)
        if not entry:
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        status_update = entry.get('status')
        pages = entry.get('book', {}).get('pages') or 0
        try:
            current_page_int = int(current_page)
        except (TypeError, ValueError):
            current_page_int = 0
        if pages and current_page_int >= pages:
            status_update = 'FINISHED'
        elif current_page_int > 0:
            status_update = 'READING'
        return Response(mongo_service.update_user_library_entry(pk, {
            'current_page': current_page_int,
            'status': status_update,
        }))

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a book"""
        rating = request.data.get('rating')
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            rating = None
        if rating is None or not 1 <= rating <= 5:
            return Response({'detail': 'rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
        entry = mongo_service.update_user_library_entry(pk, {'rating': rating})
        if not entry:
            return Response({'detail': 'Library entry not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(entry)


class BookmarkViewSet(viewsets.ViewSet):
    """
    ViewSet for managing bookmarks.
    """
    parser_classes = [FormParser, JSONParser]

    def list(self, request):
        return Response(
            mongo_service.list_bookmarks(
                user_id=request.query_params.get('user_id'),
                book_id=request.query_params.get('book_id'),
            )
        )

    def create(self, request):
        bookmark, inserted_id = mongo_service.create_bookmark(request.data)
        logger.info("library.bookmark.create inserted_mongodb_id=%s", inserted_id)
        return Response(bookmark, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        if not mongo_service.delete_bookmark(pk):
            return Response({'detail': 'Bookmark not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReadingSessionViewSet(viewsets.ViewSet):
    """
    ViewSet for tracking reading sessions.
    """
    parser_classes = [FormParser, JSONParser]

    def create(self, request):
        session, inserted_id = mongo_service.create_reading_session(request.data)
        logger.info("library.reading_session.create inserted_mongodb_id=%s", inserted_id)
        return Response(session, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a reading session"""
        session = mongo_service.end_reading_session(pk, request.data.get('end_page'))
        if not session:
            return Response({'detail': 'Reading session not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(session)

    @action(detail=False, methods=['get'], url_path='streak')
    def streak(self, request):
        """Return the user's current reading streak based on ReadingSession dates."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(mongo_service.reading_streak(user_id))

    @action(detail=False, methods=['get'], url_path='calendar')
    def calendar(self, request):
        """Return daily reading activity for the user's profile calendar."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(mongo_service.reading_calendar(user_id, request.query_params.get('days', 180)))
