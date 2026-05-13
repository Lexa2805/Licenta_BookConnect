from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet, PayoutViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='marketplace-listings')
router.register(r'payouts', PayoutViewSet)
router.register(r'reviews', ReviewViewSet, basename='marketplace-reviews')

urlpatterns = [
    path('', include(router.urls)),
]
