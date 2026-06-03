import os

import django
import pytest
from django.conf import settings


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Licenta_BookConnect.settings")
django.setup()

from rest_framework.test import APIClient  # noqa: E402

if "testserver" not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append("testserver")


@pytest.fixture
def api_client():
    return APIClient()
