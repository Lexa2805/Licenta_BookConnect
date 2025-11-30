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

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    seller_id = models.CharField(max_length=255)  # ID from NextAuth/MongoDB
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='LISTED')
    image = models.ImageField(upload_to='listings/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.status}"

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
