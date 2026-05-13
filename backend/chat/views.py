import logging

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


class ChatGroupViewSet(viewsets.ViewSet):
    parser_classes = [FormParser, JSONParser]

    def list(self, request):
        return Response(mongo_service.list_groups())

    def retrieve(self, request, pk=None):
        group = mongo_service.get_group(pk)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(group)

    def create(self, request):
        _log_request_payload("chat.group.create", request)
        if not request.data.get("name"):
            logger.warning("chat.group.create validation_errors=%s", {"name": "This field is required."})
            return Response({"name": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group, inserted_id = mongo_service.create_group(request.data)
            logger.info("chat.group.create inserted_mongodb_id=%s", inserted_id)
            return Response(group, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("chat.group.create validation_or_insert_error=%s", exc)
            return Response({"detail": "Failed to save chat group in MongoDB."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    def _update(self, request, pk=None):
        _log_request_payload("chat.group.update", request)
        group = mongo_service.update_group(pk, request.data)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(group)

    def destroy(self, request, pk=None):
        if not mongo_service.delete_group(pk):
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def my_groups(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(mongo_service.list_my_groups(user_id))

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)

        member, created = mongo_service.join_group(pk, user_id)
        if created:
            logger.info("chat.group.join inserted_mongodb_id=%s", member.get("id"))
            return Response({"status": "joined group"})
        return Response({"status": "already a member"})

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)

        if mongo_service.leave_group(pk, user_id):
            return Response({"status": "left group"})
        return Response({"status": "not a member"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        if not mongo_service.get_group(pk):
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(mongo_service.list_members(pk))


class MessageViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        return Response(
            mongo_service.list_messages(
                group_id=request.query_params.get("group_id"),
                receiver_id=request.query_params.get("receiver_id"),
                sender_id=request.query_params.get("sender_id"),
            )
        )

    def create(self, request):
        _log_request_payload("chat.message.create", request)
        attachment = request.FILES.get("attachment")
        content = (request.data.get("content") or "").strip()

        if not content and not attachment:
            logger.warning("chat.message.create validation_errors=%s", {"detail": "A message must include text or an attachment."})
            return Response({"detail": "A message must include text or an attachment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            attachment_info = None
            if attachment:
                attachment_info = save_uploaded_file(attachment, "chat/attachments", request)
                logger.info("chat.message.create saved_file_path=%s", attachment_info["path"])

            message, inserted_id = mongo_service.create_message(request.data, attachment_info=attachment_info)
            logger.info("chat.message.create inserted_mongodb_id=%s", inserted_id)
            return Response(message, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("chat.message.create validation_or_insert_error=%s", exc)
            return Response({"detail": "Failed to save chat message in MongoDB."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["get"])
    def conversations(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(mongo_service.list_conversations(user_id))
