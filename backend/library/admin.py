from django.contrib import admin
from .models import LibraryBook, UserLibrary, Bookmark, ReadingSession


@admin.register(LibraryBook)
class LibraryBookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'is_free', 'is_featured', 'pages', 'created_at']
    list_filter = ['is_free', 'is_featured', 'language']
    search_fields = ['title', 'author', 'description']
    list_editable = ['is_featured']


@admin.register(UserLibrary)
class UserLibraryAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'book', 'status', 'is_favorite', 'current_page', 'rating']
    list_filter = ['status', 'is_favorite']
    search_fields = ['user_id', 'book__title']


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'book', 'page_number', 'color', 'created_at']
    list_filter = ['color']
    search_fields = ['user_id', 'book__title', 'paragraph_text']


@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'book', 'started_at', 'ended_at', 'pages_read']
    list_filter = ['started_at']
    search_fields = ['user_id', 'book__title']
