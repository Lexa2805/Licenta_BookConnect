from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatGroup, GroupMember, Message
from .serializers import ChatGroupSerializer, GroupMemberSerializer, MessageSerializer

class ChatGroupViewSet(viewsets.ModelViewSet):
    queryset = ChatGroup.objects.all()
    serializer_class = ChatGroupSerializer

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

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def perform_create(self, serializer):
        sender_id = self.request.data.get('sender_id', 'anonymous_sender')
        serializer.save(sender_id=sender_id)

    def get_queryset(self):
        # Filter messages by group or receiver
        group_id = self.request.query_params.get('group_id')
        receiver_id = self.request.query_params.get('receiver_id')
        sender_id = self.request.query_params.get('sender_id') # To see my DMs

        queryset = self.queryset
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        elif receiver_id and sender_id:
            # DM logic: messages between sender and receiver
            # (sender=A AND receiver=B) OR (sender=B AND receiver=A)
            from django.db.models import Q
            queryset = queryset.filter(
                Q(sender_id=sender_id, receiver_id=receiver_id) | 
                Q(sender_id=receiver_id, receiver_id=sender_id)
            )
        
        return queryset.order_by('timestamp')
