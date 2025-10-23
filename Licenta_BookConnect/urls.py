from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.routers import DefaultRouter
from books.views import BooksViewSet
from accounts.views import RegisterView, MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


router = DefaultRouter()
router.register(r"books", BooksViewSet, basename="books")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/books/", include("books.urls")),

    # OpenAPI schema + UIs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/reviews/", include("reviews.urls")),
    path("api/auth/register/", RegisterView.as_view()),
    path("api/auth/login/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", MeView.as_view()),

]
