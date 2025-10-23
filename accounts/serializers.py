from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default="reader")

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]

    def create(self, validated):
        role = validated.pop("role", "reader")
        user = User.objects.create_user(**validated)
        user.profile.role = role  # creat din signal
        user.profile.save()
        return user

class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]

    def get_role(self, obj):
        return getattr(obj.profile, "role", "reader")
