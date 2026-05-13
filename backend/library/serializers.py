import json

from rest_framework import serializers
from .models import LibraryBook, UserLibrary, Bookmark, ReadingSession


class LibraryBookSerializer(serializers.ModelSerializer):
    # Computed fields that return the actual URL (file or URL)
    cover = serializers.SerializerMethodField()
    pdf = serializers.SerializerMethodField()
    
    class Meta:
        model = LibraryBook
        fields = ['id', 'title', 'author', 'description', 'cover_url', 'cover_image',
                  'pdf_url', 'pdf_file', 'epub_url', 'genres', 'language', 'pages',
                  'year_published', 'is_free', 'is_featured', 'created_at', 'updated_at',
                  'cover', 'pdf']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        mutable_data = data.copy()
        genres = mutable_data.get('genres')
        if isinstance(genres, str):
            try:
                parsed_genres = json.loads(genres)
            except json.JSONDecodeError:
                parsed_genres = [genre.strip() for genre in genres.split(',') if genre.strip()]
            if isinstance(parsed_genres, list):
                mutable_data['genres'] = parsed_genres
        return super().to_internal_value(mutable_data)
    
    def get_cover(self, obj):
        """Returns the cover URL - either from uploaded file or URL field"""
        request = self.context.get('request')
        if obj.cover_image:
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return obj.cover_url
    
    def get_pdf(self, obj):
        """Returns the PDF URL - either from uploaded file or URL field"""
        request = self.context.get('request')
        if obj.pdf_file:
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return obj.pdf_url


class UserLibrarySerializer(serializers.ModelSerializer):
    book = LibraryBookSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = UserLibrary
        fields = ['id', 'user_id', 'book', 'book_id', 'status', 'is_favorite', 
                  'current_page', 'rating', 'notes', 'added_at', 'updated_at']
        read_only_fields = ['id', 'added_at', 'updated_at']


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'


class ReadingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingSession
        fields = '__all__'
