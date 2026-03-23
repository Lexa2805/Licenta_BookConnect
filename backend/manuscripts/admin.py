from django.contrib import admin
from .models import Manuscript


@admin.register(Manuscript)
class ManuscriptAdmin(admin.ModelAdmin):
    list_display = ['title', 'author_id', 'status', 'created_at', 'updated_at']
    list_filter = ['status']
    search_fields = ['title', 'author_id', 'content']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
