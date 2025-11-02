from django.urls import path
from .views import HomeDataView

urlpatterns = [
    path("home-data/", HomeDataView.as_view(), name="home-data"),
]
