from rest_framework import serializers

class BookCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    authors = serializers.ListField(child=serializers.CharField(), required=False)
    genres = serializers.ListField(child=serializers.CharField(), required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    is_free = serializers.BooleanField(required=False, default=True)

