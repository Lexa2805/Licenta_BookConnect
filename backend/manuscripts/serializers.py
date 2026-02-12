from rest_framework import serializers
from .models import Manuscript

class ManuscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manuscript
        fields = '__all__'
        read_only_fields = ('author_id', 'created_at', 'updated_at')

    def create(self, validated_data):
        return super().create(validated_data)
