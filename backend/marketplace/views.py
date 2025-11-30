from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Listing, Payout
from .serializers import ListingSerializer, PayoutSerializer

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Uncomment if using DRF auth

    def perform_create(self, serializer):
        # If we had a user in request.user, we would use it.
        # Since we are using NextAuth and might pass user_id, we check if it's in data
        # or if we are just trusting the frontend for this MVP phase.
        # Let's assume the frontend sends 'seller_id' in the body for now, 
        # or we extract it from a custom header if we implemented middleware.
        # For simplicity, we'll allow it to be passed or default to a test user if missing.
        seller_id = self.request.data.get('seller_id', 'anonymous_user')
        serializer.save(seller_id=seller_id)

class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer

    def get_queryset(self):
        # Filter payouts by the current user (seller_id)
        seller_id = self.request.query_params.get('seller_id')
        if seller_id:
            return self.queryset.filter(seller_id=seller_id)
        return self.queryset
