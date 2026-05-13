import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Payout
from .serializers import PayoutSerializer
from upload_storage import save_uploaded_file
from . import mongo_service


logger = logging.getLogger(__name__)


def _log_request_payload(prefix, request):
    files = {
        name: {
            "name": uploaded_file.name,
            "size": uploaded_file.size,
            "content_type": getattr(uploaded_file, "content_type", ""),
        }
        for name, uploaded_file in request.FILES.items()
    }
    logger.info("%s fields=%s files=%s", prefix, list(request.data.keys()), files)


class ListingViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        return Response(
            mongo_service.list_listings(
                genre=request.query_params.get('genre'),
                seller_id=request.query_params.get('seller_id'),
            )
        )

    def retrieve(self, request, pk=None):
        listing = mongo_service.get_listing(pk)
        if not listing:
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(listing)

    def create(self, request):
        _log_request_payload("marketplace.listing.create", request)
        if not request.data.get('title') or not request.data.get('description'):
            errors = {'detail': 'Title and description are required.'}
            logger.warning("marketplace.listing.create validation_errors=%s", errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_info = None
            uploaded_image = request.FILES.get('image')
            if uploaded_image:
                image_info = save_uploaded_file(uploaded_image, "listings", request)
                logger.info("marketplace.listing.create saved_file_path=%s", image_info["path"])

            listing, inserted_id = mongo_service.create_listing(request.data, image_info=image_info)
            logger.info("marketplace.listing.create inserted_mongodb_id=%s", inserted_id)
            return Response(listing, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("marketplace.listing.create validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to save marketplace listing in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    def _update(self, request, pk=None):
        _log_request_payload("marketplace.listing.update", request)
        try:
            image_info = None
            uploaded_image = request.FILES.get('image')
            if uploaded_image:
                image_info = save_uploaded_file(uploaded_image, "listings", request)
                logger.info("marketplace.listing.update saved_file_path=%s", image_info["path"])
            listing = mongo_service.update_listing(pk, request.data, image_info=image_info)
            if not listing:
                return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(listing)
        except Exception as exc:
            logger.exception("marketplace.listing.update validation_or_insert_error=%s", exc)
            return Response(
                {'detail': 'Failed to update marketplace listing in MongoDB.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None):
        if not mongo_service.delete_listing(pk):
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def genres(self, request):
        """Return all available genres"""
        genres = [{'value': choice[0], 'label': choice[1]} for choice in mongo_service.GENRE_CHOICES]
        return Response(genres)

    @action(detail=False, methods=['get'])
    def languages(self, request):
        """Return all available languages"""
        languages = [{'value': choice[0], 'label': choice[1]} for choice in mongo_service.LANGUAGE_CHOICES]
        return Response(languages)

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Return listings for a specific seller"""
        seller_id = request.query_params.get('seller_id')
        if not seller_id:
            return Response({'error': 'seller_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(mongo_service.list_listings(seller_id=seller_id))


class ReviewViewSet(viewsets.ViewSet):
    parser_classes = [FormParser, JSONParser]

    def list(self, request):
        return Response(mongo_service.list_reviews(request.query_params.get('listing_id')))

    def create(self, request):
        _log_request_payload("marketplace.review.create", request)
        if not request.data.get('listing') or not request.data.get('comment'):
            errors = {'detail': 'listing and comment are required.'}
            logger.warning("marketplace.review.create validation_errors=%s", errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        review, inserted_id = mongo_service.create_review(request.data)
        logger.info("marketplace.review.create inserted_mongodb_id=%s", inserted_id)
        return Response(review, status=status.HTTP_201_CREATED)


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer

    def get_queryset(self):
        # Filter payouts by the current user (seller_id)
        seller_id = self.request.query_params.get('seller_id')
        if seller_id:
            return self.queryset.filter(seller_id=seller_id)
        return self.queryset
