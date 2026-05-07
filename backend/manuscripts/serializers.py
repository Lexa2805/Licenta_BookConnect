from rest_framework import serializers
from .models import Manuscript, ManuscriptFeedback


class ManuscriptFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManuscriptFeedback
        fields = '__all__'
        read_only_fields = ('manuscript', 'created_at')


class ManuscriptSerializer(serializers.ModelSerializer):
    feedback = ManuscriptFeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Manuscript
        fields = '__all__'
        read_only_fields = ('author_id', 'created_at', 'updated_at')

    def create(self, validated_data):
        return super().create(validated_data)
