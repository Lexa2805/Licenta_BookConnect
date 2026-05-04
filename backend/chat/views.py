from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import ChatGroup, GroupMember, Message
from .serializers import ChatGroupSerializer, GroupMemberSerializer, MessageSerializer


def build_message_preview(message):
    content = (message.content or '').strip()
    if content:
        return content[:50] + ('...' if len(content) > 50 else '')

    if message.attachment:
        if (message.attachment_type or '').startswith('image/'):
            return 'Shared a photo'
        if message.attachment_name:
            return f"Shared {message.attachment_name[:40]}"
        return 'Shared an attachment'

    return ''

class ChatGroupViewSet(viewsets.ModelViewSet):
    queryset = ChatGroup.objects.all()
    serializer_class = ChatGroupSerializer

    def get_queryset(self):
        queryset = ChatGroup.objects.annotate(
            member_count=Count('members')
        ).order_by('-created_at')
        return queryset

    def perform_create(self, serializer):
        # Save the group with created_by
        created_by = self.request.data.get('created_by', '')
        group = serializer.save(created_by=created_by)
        # Auto-join creator to the group
        if created_by:
            GroupMember.objects.get_or_create(group=group, user_id=created_by)

    @action(detail=False, methods=['get'])
    def my_groups(self, request):
        """Get groups the user is a member of"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        groups = ChatGroup.objects.filter(
            members__user_id=user_id
        ).annotate(
            member_count=Count('members')
        ).order_by('-created_at')
        
        # Get last message for each group
        result = []
        for group in groups:
            last_msg = Message.objects.filter(group=group).order_by('-timestamp').first()
            group_data = ChatGroupSerializer(group).data
            group_data['member_count'] = group.member_count
            group_data['is_member'] = True
            if last_msg:
                group_data['last_message'] = build_message_preview(last_msg)
                group_data['last_message_time'] = last_msg.timestamp.isoformat()
            result.append(group_data)
        
        return Response(result)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        member, created = GroupMember.objects.get_or_create(group=group, user_id=user_id)
        if created:
            return Response({'status': 'joined group'})
        return Response({'status': 'already a member'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted, _ = GroupMember.objects.filter(group=group, user_id=user_id).delete()
        if deleted:
            return Response({'status': 'left group'})
        return Response({'status': 'not a member'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        group = self.get_object()
        members = GroupMember.objects.filter(group=group).order_by('joined_at')
        serializer = GroupMemberSerializer(members, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        sender_id = self.request.data.get('sender_id', 'anonymous_sender')
        sender_name = self.request.data.get('sender_name', 'Anonymous')
        receiver_name = self.request.data.get('receiver_name', '')
        attachment = self.request.FILES.get('attachment')
        attachment_name = self.request.data.get('attachment_name', '')
        attachment_type = self.request.data.get('attachment_type', '')
        attachment_size = self.request.data.get('attachment_size')

        if attachment:
            attachment_name = attachment_name or attachment.name
            attachment_type = attachment_type or getattr(attachment, 'content_type', '')
            attachment_size = attachment_size or getattr(attachment, 'size', None)

        try:
            attachment_size = int(attachment_size) if attachment_size else None
        except (TypeError, ValueError):
            attachment_size = None

        serializer.save(
            sender_id=sender_id,
            sender_name=sender_name,
            receiver_name=receiver_name,
            attachment_name=attachment_name,
            attachment_type=attachment_type,
            attachment_size=attachment_size,
        )

    def get_queryset(self):
        # Filter messages by group or receiver
        group_id = self.request.query_params.get('group_id')
        receiver_id = self.request.query_params.get('receiver_id')
        sender_id = self.request.query_params.get('sender_id')

        queryset = self.queryset
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        elif receiver_id and sender_id:
            # DM logic: messages between sender and receiver
            queryset = queryset.filter(
                Q(sender_id=sender_id, receiver_id=receiver_id) | 
                Q(sender_id=receiver_id, receiver_id=sender_id)
            ).filter(group__isnull=True)
        
        return queryset.order_by('timestamp')

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all DM conversations for a user"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all messages where user is sender or receiver (DMs only)
        messages = Message.objects.filter(
            Q(sender_id=user_id) | Q(receiver_id=user_id),
            group__isnull=True
        ).order_by('-timestamp')
        
        # Build unique conversations
        conversations = {}
        for msg in messages:
            # Determine the other participant
            if msg.sender_id == user_id:
                other_id = msg.receiver_id
                other_name = msg.receiver_name or 'Unknown'
            else:
                other_id = msg.sender_id
                other_name = msg.sender_name or 'Unknown'
            
            if other_id and other_id not in conversations:
                conversations[other_id] = {
                    'id': other_id,
                    'participant_id': other_id,
                    'participant_name': other_name,
                    'last_message': build_message_preview(msg),
                    'last_message_time': msg.timestamp.isoformat(),
                    'unread_count': 0  # Could be implemented with is_read field
                }
        
        return Response(list(conversations.values()))
