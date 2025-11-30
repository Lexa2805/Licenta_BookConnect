from rest_framework import serializers
from .models import Listing, Payout

class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = '__all__'
        read_only_fields = ('seller_id', 'created_at', 'updated_at', 'status')

    def create(self, validated_data):
        # In a real app, we'd get the user ID from the request (e.g. JWT token)
        # For now, we might need to pass it or extract it from the request context if available
        # Since auth is handled by Next.js, we might expect the user ID to be passed in the body or header
        # Let's assume for now it's passed in the body or we handle it in the view
        return super().create(validated_data)

class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = '__all__'
