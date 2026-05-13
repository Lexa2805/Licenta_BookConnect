from rest_framework import serializers
from .models import Manuscript, ManuscriptFeedback


class ManuscriptFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManuscriptFeedback
        fields = '__all__'
        read_only_fields = ('manuscript', 'created_at')


class ManuscriptSerializer(serializers.ModelSerializer):
    feedback = ManuscriptFeedbackSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Manuscript
        fields = '__all__'
        read_only_fields = ('author_id', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def create(self, validated_data):
        return super().create(validated_data)
