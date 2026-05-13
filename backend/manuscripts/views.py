import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from upload_storage import save_uploaded_file
from . import mongo_service


logger = logging.getLogger(__name__)


def _log_request_payload(prefix, request):
    files = {
        name: {
            "name": uploaded_file.name,
            "size": uploaded_file.size,
            "content_type": getattr(uploaded_file, "content_type", ""),
        }
        for name, uploaded_file in request.FILES.items()
    }
    logger.info("%s fields=%s files=%s", prefix, list(request.data.keys()), files)


@csrf_exempt
def generate_text(request):
    if request.method == "POST":
        data = json.loads(request.body)
        text = data.get("text", "")

        from ai.generator import generate

        result = generate(text)

        return JsonResponse({"result": result})

    return JsonResponse({"error": "Only POST requests are allowed."}, status=405)


class ManuscriptViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        author_id = request.query_params.get('author_id')
        return Response(mongo_service.list_manuscripts(author_id=author_id))

    def retrieve(self, request, pk=None):
        author_id = request.query_params.get('author_id')
        manuscript = mongo_service.get_manuscript(
            pk,
            author_id=author_id,
            require_published=not bool(author_id),
        )
        if not manuscript:
            return Response({'detail': 'Manuscript not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(manuscript)

    def create(self, request):
        _log_request_payload("manuscript.create", request)
        try:
            file_info = None
            uploaded_file = request.FILES.get('file')
            if uploaded_file:
                author_id = request.data.get('author_id') or 'anonymous_author'
                file_info = save_uploaded_file(uploaded_file, f"manuscripts/{author_id}", request)
                logger.info("manuscript.create saved_file_path=%s", file_info["path"])

            manuscript, inserted_id = mongo_service.create_manuscript(request.data, file_info=file_info)
            logger.info("manuscript.create inserted_mongodb_id=%s", inserted_id)
            return Response(manuscript, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("manuscript.create validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to save manuscript in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    def _update(self, request, pk=None):
        _log_request_payload("manuscript.update", request)
        author_id = request.query_params.get('author_id') or request.data.get('author_id')
        if not author_id:
            logger.warning("manuscript.update validation_errors=%s", {'author_id': 'This field is required for updates.'})
            return Response({'author_id': 'This field is required for updates.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_info = None
            uploaded_file = request.FILES.get('file')
            if uploaded_file:
                file_info = save_uploaded_file(uploaded_file, f"manuscripts/{author_id or 'anonymous_author'}", request)
                logger.info("manuscript.update saved_file_path=%s", file_info["path"])
            manuscript = mongo_service.update_manuscript(pk, request.data, author_id=author_id, file_info=file_info)
            if not manuscript:
                return Response({'detail': 'Manuscript not found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(manuscript)
        except Exception as exc:
            logger.exception("manuscript.update validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to update manuscript in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None):
        author_id = request.query_params.get('author_id')
        if not author_id:
            logger.warning("manuscript.delete validation_errors=%s", {'author_id': 'This query parameter is required for deletes.'})
            return Response({'author_id': 'This query parameter is required for deletes.'}, status=status.HTTP_400_BAD_REQUEST)
        if not mongo_service.delete_manuscript(pk, author_id=author_id):
            return Response({'detail': 'Manuscript not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        author_id = request.query_params.get('author_id') or request.data.get('author_id')
        if not author_id:
            logger.warning("manuscript.publish validation_errors=%s", {'author_id': 'This field is required for publishing.'})
            return Response({'author_id': 'This field is required for publishing.'}, status=status.HTTP_400_BAD_REQUEST)
        manuscript = mongo_service.update_manuscript(pk, {'status': 'PUBLISHED'}, author_id=author_id)
        if not manuscript:
            return Response({'detail': 'Manuscript not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'status': 'manuscript published'})

    @action(detail=True, methods=['get', 'post'])
    def feedback(self, request, pk=None):
        manuscript = mongo_service.get_manuscript(pk, require_published=True)
        if not manuscript:
            return Response(
                {'detail': 'Published manuscript not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == 'GET':
            return Response(mongo_service.list_feedback(pk))

        _log_request_payload("manuscript.feedback", request)
        if not request.data.get('comment'):
            logger.warning("manuscript.feedback validation_errors=%s", {'comment': 'This field is required.'})
            return Response({'comment': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        feedback, inserted_id = mongo_service.create_feedback(pk, request.data)
        logger.info("manuscript.feedback inserted_mongodb_id=%s", inserted_id)
        return Response(feedback, status=status.HTTP_201_CREATED)
