# books/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.http import Http404
from mongoengine.errors import DoesNotExist, ValidationError as MEValidationError
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .serializers import BookCreateSerializer
from .models_mongo import Book, Price

def _parse_bool(val: str | None):
    if val is None:
        return None
    return val.lower() in {"1", "true", "t", "yes", "y"}

class BooksViewSet(viewsets.ViewSet):


    @extend_schema(
        parameters=[
            OpenApiParameter(name="q", description="Căutare full-text (dacă ai text index în Mongo).", required=False, type=str),
            OpenApiParameter(name="title", description="Filtru conține în titlu (case-insensitive).", required=False, type=str),
            OpenApiParameter(name="author", description="Filtru autor (în lista de autori).", required=False, type=str),
            OpenApiParameter(name="genre", description="Filtru gen (în lista de genuri).", required=False, type=str),
            OpenApiParameter(name="is_free", description="true/false", required=False, type=bool),
            OpenApiParameter(name="limit", description="Număr maxim de rezultate (default 50).", required=False, type=int),
        ]
    )
    def list(self, request):
        qs = Book.objects
        params = request.query_params


        q = params.get("q")
        if q:
            qs = qs(__raw__={"$text": {"$search": q}})

        title = params.get("title")
        if title:
            qs = qs.filter(title__icontains=title)

        author = params.get("author")
        if author:
            qs = qs.filter(authors__icontains=author)

        genre = params.get("genre")
        if genre:
            qs = qs.filter(genres__icontains=genre)

        # 3) is_free
        is_free = _parse_bool(params.get("is_free"))
        if is_free is not None:
            qs = qs.filter(is_free=is_free)

        limit = int(params.get("limit") or 50)
        books = qs.order_by("-published_at").limit(limit)

        return Response([
            {
                "id": str(b.id),
                "title": b.title,
                "authors": b.authors,
                "is_free": getattr(b, "is_free", True),
                "cover_url": getattr(b, "cover_url", None),
            } for b in books
        ])

    def retrieve(self, request, pk=None):
        """Detalii carte — pe ID (stabil)."""
        try:
            b = Book.objects.get(id=pk)
        except (DoesNotExist, MEValidationError):
            raise Http404("Book not found")

        price = None
        if getattr(b, "price", None):
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

    @extend_schema(request=BookCreateSerializer)
    def create(self, request):
        ser = BookCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data

        price = None
        if not v.get("is_free", True) and v.get("price_amount") is not None:
            price = Price(amount=v["price_amount"], currency=v.get("price_currency", "LEI"))

        b = Book(
            title=v["title"],
            authors=v.get("authors", []),
            genres=v.get("genres", []),
            description=v.get("description", ""),
            cover_url=v.get("cover_url") or None,
            file_urls={},
            price=price,
            is_free=v.get("is_free", True),
            owner_user_id=str(getattr(request.user, "id", "")) or "anon",
        )
        b.save()
        return Response({"id": str(b.id)}, status=status.HTTP_201_CREATED)
