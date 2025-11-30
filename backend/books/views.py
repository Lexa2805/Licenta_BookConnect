from typing import Any, Dict, List, Optional
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models_mongo import Book


def _normalize_cover(b: Book) -> Optional[str]:
    """
    Ia coperta din oricare dintre câmpurile posibile din Mongo
    și o curăță de spații/virgule de la final.
    """
    raw = (
        getattr(b, "cover_url", None)
        or getattr(b, "coverImage", None)
        or getattr(b, "cover_image", None)
        or getattr(b, "cover", None)
        or getattr(b, "image", None)
    )
    if not raw:
        return None
    if not isinstance(raw, str):
        return None
    # ex: "sherlock.jpg," -> "sherlock.jpg"
    return raw.strip().rstrip(",; ")


def _normalize_authors(b: Book) -> List[str]:
    """
    Întoarce mereu o listă de autori.
    Dacă în DB ai 'authors': [...], o ia direct.
    Dacă ai doar 'author': "Arthur Conan Doyle" o transformă în listă.
    Dacă ai autor ca ObjectId, îl ignoră.
    """
    # cazul ideal: avem listă
    authors: List[str] = []
    raw_authors = getattr(b, "authors", None)
    if raw_authors:
        # poate fi deja listă
        if isinstance(raw_authors, list):
            authors = [a for a in raw_authors if a]
        elif isinstance(raw_authors, str):
            authors = [raw_authors]
    else:
        # nu avem 'authors', încercăm 'author'
        single = getattr(b, "author", None)
        if isinstance(single, str) and single.strip():
            candidate = single.strip()
            # dacă arată ca un ObjectId, nu îl punem
            if not (len(candidate) == 24 and all(c in "0123456789abcdefABCDEF" for c in candidate)):
                authors = [candidate]
    return authors


def _serialize_book(b: Book) -> Dict[str, Any]:
    cover_clean = _normalize_cover(b)
    authors = _normalize_authors(b)

    return {
        "id": str(b.id),
        "title": getattr(b, "title", ""),
        "authors": authors,
        "genres": getattr(b, "genres", []),
        "description": getattr(b, "description", None),
        # IMPORTANT: trimitem mereu 'cover_url' către frontend
        "cover_url": cover_clean,
        "is_free": getattr(b, "is_free", getattr(b, "isFree", False)),
        "price": (
            {
                "amount": b.price.amount,
                "currency": b.price.currency,
            }
            if getattr(b, "price", None)
            else None
        ),
    }


class HomeDataView(APIView):
    """
    /api/home-data/
    Returnează ultimele cărți, cărți gratuite și genurile,
    cu câmpuri normalizate (cover_url, authors).
    """

    def get(self, request, *args: Any, **kwargs: Any) -> Response:
        latest_qs = Book.objects.order_by("-published_at").limit(8)
        free_qs = Book.objects(is_free=True).order_by("-published_at").limit(6)

        # genuri
        raw_genres = Book.objects.distinct("genres")
        genres: List[str] = []
        for g in raw_genres:
            if isinstance(g, list):
                for sub in g:
                    if sub and sub not in genres:
                        genres.append(sub)
            else:
                if g and g not in genres:
                    genres.append(g)

        data: Dict[str, Any] = {
            "latest": [_serialize_book(b) for b in latest_qs],
            "free": [_serialize_book(b) for b in free_qs],
            "genres": genres,
        }
        return Response(data, status=status.HTTP_200_OK)


class BooksViewSet(viewsets.ViewSet):
    """
    Dacă îl mai folosești în urls, îl lăsăm.
    """

    def list(self, request) -> Response:
        books = Book.objects.order_by("-published_at").limit(50)
        return Response([_serialize_book(b) for b in books], status=status.HTTP_200_OK)

    def retrieve(self, request, pk: Optional[str] = None) -> Response:
        if pk is None:
            raise Http404("Book not found")
        try:
            b = Book.objects.get(id=pk)
        except Exception:
            raise Http404("Book not found")
        return Response(_serialize_book(b), status=status.HTTP_200_OK)
