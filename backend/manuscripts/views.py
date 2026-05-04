from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Manuscript
from .serializers import ManuscriptSerializer

class ManuscriptViewSet(viewsets.ModelViewSet):
    queryset = Manuscript.objects.all().order_by('-updated_at')
    serializer_class = ManuscriptSerializer

    def perform_create(self, serializer):
        author_id = self.request.data.get('author_id', 'anonymous_author')
        serializer.save(author_id=author_id)

    def get_queryset(self):
        queryset = self.queryset
        author_id = self.request.query_params.get('author_id')
        if author_id:
            return queryset.filter(author_id=author_id)

        # Without an author filter, never expose private drafts from every user.
        return queryset.filter(status='PUBLISHED')

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        manuscript = self.get_object()
        manuscript.status = 'PUBLISHED'
        manuscript.save()
        return Response({'status': 'manuscript published'})
