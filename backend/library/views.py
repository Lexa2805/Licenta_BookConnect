from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
from .models import LibraryBook, UserLibrary, Bookmark, ReadingSession
from .serializers import (
    LibraryBookSerializer, UserLibrarySerializer,
    BookmarkSerializer, ReadingSessionSerializer
)
from .forms import LibraryBookForm


# ---------------------------------------------------------------------------
# Template-based Book Management Views
# ---------------------------------------------------------------------------

def book_manage_list(request):
    """List all books with search; accessible at /manage/books/"""
    search = request.GET.get("q", "").strip()
    books = LibraryBook.objects.all()
    if search:
        books = books.filter(
            Q(title__icontains=search) | Q(author__icontains=search)
        )
    return render(request, "library/manage_list.html", {
        "books": books,
        "search": search,
        "total": LibraryBook.objects.count(),
    })


def book_manage_create(request):
    """Create a new book."""
    if request.method == "POST":
        form = LibraryBookForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "Book added successfully!")
            return redirect("book-manage-list")
    else:
        form = LibraryBookForm()
    return render(request, "library/manage_form.html", {
        "form": form,
        "action": "Add New Book",
        "submit_label": "Add Book",
    })


def book_manage_edit(request, pk):
    """Edit an existing book."""
    book = get_object_or_404(LibraryBook, pk=pk)
    if request.method == "POST":
        form = LibraryBookForm(request.POST, request.FILES, instance=book)
        if form.is_valid():
            form.save()
            messages.success(request, f'"{book.title}" updated successfully!')
            return redirect("book-manage-list")
    else:
        form = LibraryBookForm(instance=book)
    return render(request, "library/manage_form.html", {
        "form": form,
        "book": book,
        "action": f"Edit: {book.title}",
        "submit_label": "Save Changes",
    })


@require_POST
def book_manage_delete(request, pk):
    """Delete a book (POST only)."""
    book = get_object_or_404(LibraryBook, pk=pk)
    title = book.title
    book.delete()
    messages.success(request, f'"{title}" has been deleted.')
    return redirect("book-manage-list")


class LibraryBookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing library books (admin functionality).
    """
    queryset = LibraryBook.objects.all()
    serializer_class = LibraryBookSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = LibraryBook.objects.all()
        
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(author__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by genre (icontains works on SQLite; __contains only works on PostgreSQL)
        genre = self.request.query_params.get('genre')
        if genre:
            queryset = queryset.filter(genres__icontains=genre)
        
        # Filter by featured
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Filter by free
        is_free = self.request.query_params.get('is_free')
        if is_free == 'true':
            queryset = queryset.filter(is_free=True)
        
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of a book"""
        book = self.get_object()
        book.is_featured = not book.is_featured
        book.save()
        serializer = self.get_serializer(book)
        return Response(serializer.data)


class UserLibraryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user's personal library.
    """
    serializer_class = UserLibrarySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = UserLibrary.objects.all()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by status
        reading_status = self.request.query_params.get('status')
        if reading_status:
            queryset = queryset.filter(status=reading_status)
        
        # Filter favorites
        favorites = self.request.query_params.get('favorites')
        if favorites == 'true':
            queryset = queryset.filter(is_favorite=True)
        
        return queryset

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        book_id = request.data.get('book_id')
        
        # Check if already in library
        existing = UserLibrary.objects.filter(user_id=user_id, book_id=book_id).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status"""
        library_entry = self.get_object()
        library_entry.is_favorite = not library_entry.is_favorite
        library_entry.save()
        serializer = self.get_serializer(library_entry)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update reading progress"""
        library_entry = self.get_object()
        current_page = request.data.get('current_page', 0)
        library_entry.current_page = current_page
        
        # Auto-update status based on progress
        if library_entry.book.pages > 0:
            if current_page >= library_entry.book.pages:
                library_entry.status = 'FINISHED'
            elif current_page > 0:
                library_entry.status = 'READING'
        
        library_entry.save()
        serializer = self.get_serializer(library_entry)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a book"""
        library_entry = self.get_object()
        rating = request.data.get('rating')
        if rating and 1 <= rating <= 5:
            library_entry.rating = rating
            library_entry.save()
        serializer = self.get_serializer(library_entry)
        return Response(serializer.data)


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookmarks.
    """
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        queryset = Bookmark.objects.all()
        user_id = self.request.query_params.get('user_id')
        book_id = self.request.query_params.get('book_id')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset


class ReadingSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tracking reading sessions.
    """
    serializer_class = ReadingSessionSerializer

    def get_queryset(self):
        queryset = ReadingSession.objects.all()
        user_id = self.request.query_params.get('user_id')
        book_id = self.request.query_params.get('book_id')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a reading session"""
        session = self.get_object()
        session.ended_at = timezone.now()
        session.end_page = request.data.get('end_page', session.start_page)
        session.pages_read = session.end_page - session.start_page
        session.save()
        
        # Update user library progress
        user_library = UserLibrary.objects.filter(
            user_id=session.user_id, 
            book=session.book
        ).first()
        if user_library:
            user_library.current_page = session.end_page
            user_library.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='streak')
    def streak(self, request):
        """Return the user's current reading streak based on ReadingSession dates."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)

        # Collect unique calendar days with at least one session start.
        days = set(ReadingSession.objects.filter(user_id=user_id).dates('started_at', 'day'))
        today = timezone.localdate()

        # Streak counts consecutive days ending today; if not read today, allow ending yesterday.
        cursor = today
        if cursor not in days and (today - timedelta(days=1)) in days:
            cursor = today - timedelta(days=1)

        streak_days = 0
        while cursor in days:
            streak_days += 1
            cursor = cursor - timedelta(days=1)

        last_read_date = max(days).isoformat() if days else None

        return Response({
            'streak_days': streak_days,
            'active_today': today in days,
            'last_read_date': last_read_date,
            'tracked_days': len(days),
        })
