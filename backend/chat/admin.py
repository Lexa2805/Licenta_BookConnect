from django.contrib import admin
from .models import ChatGroup, GroupMember, Message

admin.site.register(ChatGroup)
admin.site.register(GroupMember)
admin.site.register(Message)
