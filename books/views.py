# books/views.py
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from django.http import Http404
from mongoengine.errors import DoesNotExist, ValidationError as MEValidationError

from .serializers import BookCreateSerializer
from .models_mongo import Book

class BooksViewSet(viewsets.ViewSet):
    """Listare și creare cărți în MongoDB."""

    def list(self, request):
        books = Book.objects.order_by("-published_at").limit(50)
        return Response([
            {
                "id": str(b.id),
                "title": b.title,
                "authors": b.authors,
                "is_free": b.is_free,
                "cover_url": getattr(b, "cover_url", None),
            } for b in books
        ])

    def retrieve(self, request, pk=None):
        """Detalii pentru o carte (by Mongo ObjectId)."""
        try:
            b = Book.objects.get(id=pk)
        except (DoesNotExist, MEValidationError):
            raise Http404("Book not found")

        # price poate lipsi (și avem strict=False pentru câmpuri extra)
        price = None
        if getattr(b, "price", None):
            # dacă e EmbeddedDocument, îl serializăm simplu
            price = {
                "amount": getattr(b.price, "amount", None),
                "currency": getattr(b.price, "currency", None),
            }

        return Response({
            "id": str(b.id),
            "title": b.title,
            "authors": b.authors,
            "genres": b.genres,
            "description": getattr(b, "description", None),
            "cover_url": getattr(b, "cover_url", None),
            "file_urls": getattr(b, "file_urls", {}),
            "is_free": getattr(b, "is_free", True),
            "published_at": getattr(b, "published_at", None),
            "price": price,
            "stats": getattr(b, "stats", {}),
        })

    def create(self, request):
        ser = BookCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data

        b = Book(
            title=v["title"],
            authors=v.get("authors", []),
            genres=v.get("genres", []),
            description=v.get("description", ""),
            is_free=v.get("is_free", True),
        )
        b.save()
        return Response({"id": str(b.id)}, status=status.HTTP_201_CREATED)

