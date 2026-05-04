import os
import uuid

from django.db import models


def message_attachment_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1]
    return f"chat/attachments/{uuid.uuid4().hex}{extension}"

class ChatGroup(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class GroupMember(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name='members')
    user_id = models.CharField(max_length=255)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user_id')

    def __str__(self):
        return f"{self.user_id} in {self.group.name}"

class Message(models.Model):
    sender_id = models.CharField(max_length=255)
    sender_name = models.CharField(max_length=255, default='Anonymous')
    # If group is null, it's a direct message to receiver_id
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    receiver_id = models.CharField(max_length=255, null=True, blank=True)
    receiver_name = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to=message_attachment_upload_path, blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True, default='')
    attachment_type = models.CharField(max_length=100, blank=True, default='')
    attachment_size = models.PositiveIntegerField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        if self.group:
            return f"From {self.sender_name} in {self.group.name}"
        return f"From {self.sender_name} to {self.receiver_name}"
