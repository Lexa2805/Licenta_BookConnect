from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from mongoengine.errors import DoesNotExist, ValidationError as MEValidationError

from .models_mongo import Users
from .jwt_utils import decode_access_token


class AuthUserWrapper:

    def __init__(self, user_doc: Users):
        self._user = user_doc

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def id(self):
        return self._user.id

    @property
    def username(self):
        return self._user.username

    @property
    def email(self):
        return self._user.email

    @property
    def role(self):
        return self._user.role

    @property
    def is_active(self):
        return self._user.is_active

    @property
    def raw(self):
        return self._user


class MongoJWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Format Authorization invalid")

        token = parts[1]

        try:
            payload = decode_access_token(token)
        except Exception:
            raise exceptions.AuthenticationFailed("Token invalid sau expirat")

        user_id = payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token fără sub")

        try:
            user_doc = Users.objects.get(id=user_id)
        except (DoesNotExist, MEValidationError):
            raise exceptions.AuthenticationFailed("Utilizator inexistent")

        if not user_doc.is_active:
            raise exceptions.AuthenticationFailed("Cont dezactivat")

        wrapped_user = AuthUserWrapper(user_doc)
        return (wrapped_user, token)
