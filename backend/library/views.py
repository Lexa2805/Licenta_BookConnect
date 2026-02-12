from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from .models import LibraryBook, UserLibrary, Bookmark, ReadingSession
from .serializers import (
    LibraryBookSerializer, UserLibrarySerializer, 
    BookmarkSerializer, ReadingSessionSerializer
)


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
        
        # Filter by genre
        genre = self.request.query_params.get('genre')
        if genre:
            queryset = queryset.filter(genres__contains=genre)
        
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
        from django.utils import timezone
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
