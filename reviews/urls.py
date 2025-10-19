from django.urls import path
from .views import ReviewCreateView, BookReviewsListView, BookRatingView

urlpatterns = [
    path("", ReviewCreateView.as_view()),                       # POST /api/reviews/
    path("book/<str:book_id>/", BookReviewsListView.as_view()), # GET  /api/reviews/book/{id}/
    path("book/<str:book_id>/rating/", BookRatingView.as_view())# GET  /api/reviews/book/{id}/rating/
]
