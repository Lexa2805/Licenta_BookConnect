from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Manuscript
from .serializers import ManuscriptSerializer

class ManuscriptViewSet(viewsets.ModelViewSet):
    queryset = Manuscript.objects.all()
    serializer_class = ManuscriptSerializer

    def perform_create(self, serializer):
        author_id = self.request.data.get('author_id', 'anonymous_author')
        serializer.save(author_id=author_id)

    def get_queryset(self):
        # Filter by author_id if provided, or show public ones?
        # For 'studio', we want to see MY manuscripts.
        author_id = self.request.query_params.get('author_id')
        if author_id:
            return self.queryset.filter(author_id=author_id)
        return self.queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        manuscript = self.get_object()
        manuscript.status = 'PUBLISHED'
        manuscript.save()
        return Response({'status': 'manuscript published'})
