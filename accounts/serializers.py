# from rest_framework import serializers
# from .models_mongo import Users
#
#
# class RegisterSerializer(serializers.Serializer):

#     username = serializers.CharField(required=True)
#     email = serializers.EmailField(required=True)
#     password = serializers.CharField(write_only=True, min_length=6)
#     role = serializers.ChoiceField(
#         choices=["reader", "author", "admin"],
#         default="reader",
#         required=False,
#     )
#
#     def validate_username(self, value):
#         if Users.objects(username=value).first():
#             raise serializers.ValidationError("Username deja folosit")
#         return value
#
#     def validate_email(self, value):
#         if Users.objects(email=value.lower()).first():
#             raise serializers.ValidationError("Email deja folosit")
#         return value.lower()
#
#     def create(self, validated_data):
#         role = validated_data.pop("role", "reader")
#         user = Users(
#             username=validated_data["username"],
#             email=validated_data["email"],
#             role=role,
#         )
#         user.set_password(validated_data["password"])
#         user.save()
#         return user
#
#
# class MeSerializer(serializers.Serializer):
#
#     id = serializers.CharField()
#     username = serializers.CharField()
#     email = serializers.EmailField()
#     role = serializers.CharField()
