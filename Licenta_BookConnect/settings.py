
from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.getenv("DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]").split(",")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.getenv("MONGO_DB", "WebAppDB")
ROOT_URLCONF = "Licenta_BookConnect.urls"
WSGI_APPLICATION = "Licenta_BookConnect.wsgi.application"

try:
    from django.core.management.utils import get_random_secret_key
    SECRET_KEY = os.getenv("SECRET_KEY") or get_random_secret_key()
except Exception:
    # dacă nu putem importa utilitarul (de ex. la build timpuriu), folosim un fallback fix de dev
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

DEBUG = os.getenv("DEBUG", "1") == "1"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,[::1]"
).split(",")

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


STATIC_URL = "/static/"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "books.apps.BooksConfig",
    "reviews.apps.ReviewsConfig",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "corsheaders",
    "accounts",

]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # ← OBLIGATORIU, cât mai sus
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # poți lăsa [] dacă nu ai folder
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

