from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LibraryBookViewSet, UserLibraryViewSet, 
    BookmarkViewSet, ReadingSessionViewSet
)

router = DefaultRouter()
router.register(r'books', LibraryBookViewSet, basename='library-books')
router.register(r'user-library', UserLibraryViewSet, basename='user-library')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmarks')
router.register(r'reading-sessions', ReadingSessionViewSet, basename='reading-sessions')

urlpatterns = [
    path('', include(router.urls)),
]
