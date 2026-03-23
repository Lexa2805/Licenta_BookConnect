from django.contrib import admin
from .models import ChatGroup, GroupMember, Message


@admin.register(ChatGroup)
class ChatGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at']
    search_fields = ['name', 'description', 'created_by']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'group', 'joined_at']
    list_filter = ['group']
    search_fields = ['user_id', 'group__name']
    ordering = ['-joined_at']
    readonly_fields = ['joined_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender_name', 'group', 'receiver_name', 'is_read', 'timestamp']
    list_filter = ['is_read', 'group']
    search_fields = ['sender_name', 'sender_id', 'content', 'receiver_name']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
