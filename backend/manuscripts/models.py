from django.db import models

def manuscript_upload_path(instance, filename):
    return f'manuscripts/{instance.author_id}/{filename}'

class Manuscript(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    author_id = models.CharField(max_length=255)  # ID from NextAuth/MongoDB
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    # File upload field for manuscripts (PDF, DOCX, TXT, etc.)
    file = models.FileField(upload_to=manuscript_upload_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"
