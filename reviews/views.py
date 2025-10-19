from rest_framework import views, status
from rest_framework.response import Response
from django.http import Http404
from mongoengine.errors import DoesNotExist
from .serializers import ReviewCreateSerializer
from .models_mongo import Review
from books.models_mongo import Book

class ReviewCreateView(views.APIView):
    """POST /api/reviews/  → Creează o recenzie pentru o carte"""
    def post(self, request):
        ser = ReviewCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            Book.objects.get(id=v["book_id"])
        except DoesNotExist:
            raise Http404("Book not found")
        r = Review(
            book_id=v["book_id"],
            user_id=str(getattr(request.user, "id", "anon")),
            rating=v["rating"],
            body=v.get("body", ""),
        )
        r.save()
        return Response({"id": str(r.id)}, status=status.HTTP_201_CREATED)


class BookReviewsListView(views.APIView):
    """GET /api/reviews/book/<id>/  → Recenziile unei cărți"""
    def get(self, request, book_id: str):
        reviews = Review.objects(book_id=book_id).order_by("-created_at")
        data = [{
            "id": str(r.id),
            "rating": r.rating,
            "body": r.body or "",
            "created_at": r.created_at.isoformat(),
        } for r in reviews]
        return Response(data)


class BookRatingView(views.APIView):
    """GET /api/reviews/book/<id>/rating/  → media rating-urilor"""
    def get(self, request, book_id: str):
        qs = Review.objects(book_id=book_id)
        count = qs.count()
        avg = round(sum(r.rating for r in qs) / count, 2) if count else 0.0
        return Response({"book_id": book_id, "avg_rating": avg, "reviews_count": count})
