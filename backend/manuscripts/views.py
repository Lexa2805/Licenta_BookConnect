from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
from .models import Manuscript
from .serializers import ManuscriptSerializer

class ManuscriptViewSet(viewsets.ModelViewSet):
    queryset = Manuscript.objects.all()
    serializer_class = ManuscriptSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        author_id = self.request.data.get('author_id', 'anonymous_author')
        serializer.save(author_id=author_id)

    def get_queryset(self):
        # Always get fresh data from database
        queryset = Manuscript.objects.all()
        # Filter by author_id if provided
        author_id = self.request.query_params.get('author_id')
        if author_id:
            return queryset.filter(author_id=author_id)
        return queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        manuscript = self.get_object()
        manuscript.status = 'PUBLISHED'
        manuscript.save()
        serializer = self.get_serializer(manuscript)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def make_private(self, request, pk=None):
        manuscript = self.get_object()
        manuscript.status = 'DRAFT'
        manuscript.save()
        serializer = self.get_serializer(manuscript)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        manuscript = self.get_object()
        manuscript.status = 'ARCHIVED'
        manuscript.save()
        serializer = self.get_serializer(manuscript)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download manuscript as a text file"""
        manuscript = self.get_object()
        
        # Create the response with the content
        response = HttpResponse(manuscript.content, content_type='text/plain; charset=utf-8')
        # Clean filename for download
        safe_title = "".join(c for c in manuscript.title if c.isalnum() or c in (' ', '-', '_')).strip()
        response['Content-Disposition'] = f'attachment; filename="{safe_title}.txt"'
        return response

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a manuscript file (PDF, DOCX, TXT) and extract content"""
        file = request.FILES.get('file')
        title = request.data.get('title', 'Untitled Manuscript')
        author_id = request.data.get('author_id', 'anonymous_author')

        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract content from the file
        content = ''
        filename = file.name.lower()
        
        try:
            if filename.endswith('.txt'):
                content = file.read().decode('utf-8')
            elif filename.endswith('.md'):
                content = file.read().decode('utf-8')
            else:
                # For other file types, we'll just store the file without extracting content
                content = f'[Uploaded file: {file.name}]'
        except Exception as e:
            content = f'[Error reading file: {str(e)}]'

        manuscript = Manuscript.objects.create(
            title=title,
            content=content,
            author_id=author_id,
            file=file,
            status='DRAFT'
        )

        serializer = self.get_serializer(manuscript)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
