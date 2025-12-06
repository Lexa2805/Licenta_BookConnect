from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Listing, Payout, Review
from .serializers import ListingSerializer, ListingListSerializer, PayoutSerializer, ReviewSerializer

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().order_by('-created_at')
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Uncomment if using DRF auth

    def get_serializer_class(self):
        if self.action == 'list':
            return ListingListSerializer
        return ListingSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = Listing.objects.all().order_by('-created_at')
        genre = self.request.query_params.get('genre')
        seller_id = self.request.query_params.get('seller_id')
        if genre:
            queryset = queryset.filter(genre=genre)
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        return queryset

    @action(detail=False, methods=['get'])
    def genres(self, request):
        """Return all available genres"""
        genres = [{'value': choice[0], 'label': choice[1]} for choice in Listing.GENRE_CHOICES]
        return Response(genres)

    @action(detail=False, methods=['get'])
    def languages(self, request):
        """Return all available languages"""
        languages = [{'value': choice[0], 'label': choice[1]} for choice in Listing.LANGUAGE_CHOICES]
        return Response(languages)

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Return listings for a specific seller"""
        seller_id = request.query_params.get('seller_id')
        if not seller_id:
            return Response({'error': 'seller_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = Listing.objects.filter(seller_id=seller_id).order_by('-created_at')
        serializer = ListingListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer

    def get_queryset(self):
        listing_id = self.request.query_params.get('listing_id')
        if listing_id:
            return self.queryset.filter(listing_id=listing_id)
        return self.queryset

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id', 'anonymous_user')
        user_name = self.request.data.get('user_name', 'Anonymous')
        serializer.save(user_id=user_id, user_name=user_name)


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer

    def get_queryset(self):
        # Filter payouts by the current user (seller_id)
        seller_id = self.request.query_params.get('seller_id')
        if seller_id:
            return self.queryset.filter(seller_id=seller_id)
        return self.queryset
