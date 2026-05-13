from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatGroupViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'groups', ChatGroupViewSet, basename='chat-groups')
router.register(r'messages', MessageViewSet, basename='chat-messages')

urlpatterns = [
    path('', include(router.urls)),
]
