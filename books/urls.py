# books/urls.py
from django.urls import path
from .views import BooksViewSet

book_list = BooksViewSet.as_view({"get": "list", "post": "create"})
book_detail = BooksViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("", book_list),
    path("<str:pk>/", book_detail),
]
