from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ManuscriptViewSet, generate_text

router = DefaultRouter()
router.register(r'', ManuscriptViewSet, basename='manuscripts')

urlpatterns = [
    path('generate/', generate_text),
    path('', include(router.urls)),
]
