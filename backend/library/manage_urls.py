from django.urls import path
from .views import (
    book_manage_list,
    book_manage_create,
    book_manage_edit,
    book_manage_delete,
)

app_name = "library_manage"

urlpatterns = [
    path("", book_manage_list, name="list"),
    path("add/", book_manage_create, name="create"),
    path("<str:pk>/edit/", book_manage_edit, name="edit"),
    path("<str:pk>/delete/", book_manage_delete, name="delete"),
]
