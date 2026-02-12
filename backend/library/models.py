from django.db import models


def book_cover_path(instance, filename):
    return f'library/covers/{instance.id or "temp"}_{filename}'


def book_pdf_path(instance, filename):
    return f'library/pdfs/{instance.id or "temp"}_{filename}'


class LibraryBook(models.Model):
    """
    Books available in the library with PDF/EPUB links.
    Managed by administrators.
    """
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    # Cover image - can be URL or uploaded file
    cover_url = models.URLField(max_length=1000, blank=True)
    cover_image = models.ImageField(upload_to='library/covers/', blank=True, null=True)
    # PDF - can be URL or uploaded file
    pdf_url = models.URLField(max_length=1000, blank=True, help_text="URL to the PDF file")
    pdf_file = models.FileField(upload_to='library/pdfs/', blank=True, null=True)
    epub_url = models.URLField(max_length=1000, blank=True, help_text="URL to the EPUB file")
    genres = models.JSONField(default=list, blank=True)
    language = models.CharField(max_length=50, default="English")
    pages = models.IntegerField(default=0)
    year_published = models.IntegerField(null=True, blank=True)
    is_free = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.author}"
    
    @property
    def get_cover(self):
        """Returns cover image URL or uploaded file URL"""
        if self.cover_image:
            return self.cover_image.url
        return self.cover_url
    
    @property
    def get_pdf(self):
        """Returns PDF URL or uploaded file URL"""
        if self.pdf_file:
            return self.pdf_file.url
        return self.pdf_url


class UserLibrary(models.Model):
    """
    Tracks a user's personal library - favorite books, reading status.
    """
    STATUS_CHOICES = [
        ('WANT_TO_READ', 'Want to Read'),
        ('READING', 'Currently Reading'),
        ('FINISHED', 'Finished'),
    ]

    user_id = models.CharField(max_length=200)  # NextAuth user ID
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE, related_name='user_libraries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WANT_TO_READ')
    is_favorite = models.BooleanField(default=False)
    current_page = models.IntegerField(default=0)
    rating = models.IntegerField(null=True, blank=True)  # 1-5 stars
    notes = models.TextField(blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user_id', 'book']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user_id} - {self.book.title}"


class Bookmark(models.Model):
    """
    User bookmarks for specific pages/paragraphs in a book.
    """
    user_id = models.CharField(max_length=200)
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE, related_name='bookmarks')
    page_number = models.IntegerField()
    paragraph_text = models.TextField(blank=True, help_text="The highlighted text")
    note = models.TextField(blank=True, help_text="User's note about this bookmark")
    color = models.CharField(max_length=20, default='yellow')  # Highlight color
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['page_number', '-created_at']

    def __str__(self):
        return f"Bookmark on page {self.page_number} - {self.book.title}"


class ReadingSession(models.Model):
    """
    Tracks reading sessions for analytics.
    """
    user_id = models.CharField(max_length=200)
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE, related_name='reading_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    pages_read = models.IntegerField(default=0)
    start_page = models.IntegerField(default=0)
    end_page = models.IntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user_id} reading {self.book.title}"
