from django.contrib import admin
from .models import Listing, Payout, Review


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'price', 'condition', 'status', 'genre', 'language', 'seller_id', 'created_at']
    list_filter = ['status', 'condition', 'genre', 'language']
    search_fields = ['title', 'author', 'seller_id', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'listing', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user_name', 'user_id', 'comment', 'listing__title']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['seller_id', 'amount', 'status', 'created_at', 'processed_at']
    list_filter = ['status']
    search_fields = ['seller_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
