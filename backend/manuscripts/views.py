import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from .models import Manuscript
from .serializers import ManuscriptFeedbackSerializer, ManuscriptSerializer


@csrf_exempt
def generate_text(request):
    if request.method == "POST":
        data = json.loads(request.body)
        text = data.get("text", "")

        from ai.generator import generate

        result = generate(text)

        return JsonResponse({"result": result})

    return JsonResponse({"error": "Only POST requests are allowed."}, status=405)


class ManuscriptViewSet(viewsets.ModelViewSet):
    queryset = Manuscript.objects.all().order_by('-updated_at')
    serializer_class = ManuscriptSerializer

    def perform_create(self, serializer):
        author_id = self.request.data.get('author_id', 'anonymous_author')
        serializer.save(author_id=author_id)

    def get_queryset(self):
        queryset = self.queryset
        author_id = self.request.query_params.get('author_id')

        if self.request.method not in SAFE_METHODS:
            if author_id:
                return queryset.filter(author_id=author_id)

            return queryset.none()

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

    @action(detail=True, methods=['get', 'post'])
    def feedback(self, request, pk=None):
        try:
            manuscript = Manuscript.objects.get(pk=pk, status='PUBLISHED')
        except Manuscript.DoesNotExist:
            return Response(
                {'detail': 'Published manuscript not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == 'GET':
            serializer = ManuscriptFeedbackSerializer(
                manuscript.feedback.all().order_by('-created_at'),
                many=True,
            )
            return Response(serializer.data)

        serializer = ManuscriptFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(manuscript=manuscript)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
