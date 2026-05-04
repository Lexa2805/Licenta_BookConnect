from rest_framework import serializers
from .models import ChatGroup, GroupMember, Message

class GroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMember
        fields = '__all__'

class ChatGroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)

    class Meta:
        model = ChatGroup
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'group',
            'sender_id',
            'sender_name',
            'receiver_id',
            'receiver_name',
            'content',
            'attachment',
            'attachment_url',
            'attachment_name',
            'attachment_type',
            'attachment_size',
            'timestamp',
            'is_read',
        ]
        read_only_fields = ('timestamp', 'attachment_url')
        extra_kwargs = {
            'content': {'required': False, 'allow_blank': True},
            'attachment': {'required': False, 'allow_null': True},
        }

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.attachment.url)
        return obj.attachment.url

    def validate(self, attrs):
        content = attrs.get('content')
        attachment = attrs.get('attachment')

        if self.instance:
            if content is None:
                content = self.instance.content
            if attachment is None:
                attachment = self.instance.attachment

        if not (content or '').strip() and not attachment:
            raise serializers.ValidationError("A message must include text or an attachment.")

        return attrs

    def create(self, validated_data):
        return super().create(validated_data)
