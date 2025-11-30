from rest_framework import serializers

class ReviewCreateSerializer(serializers.Serializer):
    """Serializer pentru adăugarea unei recenzii."""
    book_id = serializers.CharField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    body = serializers.CharField(required=False, allow_blank=True)
