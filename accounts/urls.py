from django.urls import path
from .views import LoginView, MeView

urlpatterns = [
    # POST /api/auth/login/
    path("auth/login/", LoginView.as_view(), name="login"),

    # GET /api/auth/me/
    path("auth/me/", MeView.as_view(), name="me"),
]
