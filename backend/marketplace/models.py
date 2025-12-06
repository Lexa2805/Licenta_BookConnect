from django.db import models

class Listing(models.Model):
    STATUS_CHOICES = [
        ('LISTED', 'Listed'),
        ('RECEIVED', 'Received by Platform'),
        ('SOLD', 'Sold'),
        ('PAID', 'Paid Out'),
    ]

    CONDITION_CHOICES = [
        ('NEW', 'New'),
        ('LIKE_NEW', 'Like New'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
    ]

    GENRE_CHOICES = [
        ('FANTASY', 'Fantasy'),
        ('SCIENCE_FICTION', 'Science Fiction'),
        ('ROMANCE', 'Romance'),
        ('THRILLER', 'Thriller'),
        ('MYSTERY', 'Mystery'),
        ('SELF_HELP', 'Self-Help'),
        ('BUSINESS', 'Business'),
        ('PROGRAMMING', 'Programming'),
        ('CLASSIC', 'Classic'),
        ('OTHER', 'Other'),
    ]

    LANGUAGE_CHOICES = [
        ('RO', 'Română'),
        ('EN', 'English'),
        ('FR', 'Français'),
        ('DE', 'Deutsch'),
        ('ES', 'Español'),
        ('IT', 'Italiano'),
        ('OTHER', 'Other'),
    ]

    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, default='Unknown Author')
    description = models.TextField()
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES, default='OTHER')
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='RO')
    pages = models.PositiveIntegerField(default=0, help_text='Number of pages')
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price in Lei (RON)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    seller_id = models.CharField(max_length=255)  # ID from NextAuth/MongoDB
    seller_name = models.CharField(max_length=255, default='Anonymous Seller')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='LISTED')
    image = models.ImageField(upload_to='listings/', blank=True, null=True)  # Uploaded image
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.author} - {self.status}"


class Review(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    user_id = models.CharField(max_length=255)
    user_name = models.CharField(max_length=255, default='Anonymous')
    rating = models.IntegerField(default=5)  # 1-5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user_name} for {self.listing.title}"


class Payout(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    seller_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payout for {self.seller_id} - {self.amount} ({self.status})"
