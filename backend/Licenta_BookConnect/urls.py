from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# Customize the Django admin site
admin.site.site_header = "BookConnect Administration"
admin.site.site_title = "BookConnect Admin"
admin.site.index_title = "Site Management"

router = DefaultRouter()

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth is now handled by Next.js
    path("api/", include("books.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    path("api/reviews/", include("reviews.urls")),
    path("api/marketplace/", include("marketplace.urls")),
    path("api/manuscripts/", include("manuscripts.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/library/", include("library.urls")),

    # Template-based book management UI
    path("manage/books/", include("library.manage_urls")),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

