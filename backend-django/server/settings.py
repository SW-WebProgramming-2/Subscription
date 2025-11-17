"""
Django settings for subscription manager project.
"""

import sys
from pathlib import Path
import os
from datetime import timedelta
# Sentry 설정 (에러 추적 및 성능 모니터링)
# 환경변수 SENTRY_DSN이 설정된 경우에만 활성화
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "1.0")),
        send_default_pii=True,  # 사용자 정보 포함(로그인 사용자 추적 가능)
        environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
    )


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# backend-django/apps 경로를 Python Path에 추가
sys.path.append(os.path.join(BASE_DIR, "apps"))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',        # PostgreSQL 확장 기능 (trigram 등)
    'rest_framework',
    'rest_framework_simplejwt',       # JWT 인증
    'django_filters',
    'corsheaders',
    'drf_spectacular',                # OpenAPI 문서
    'apps.subscriptions'
]

# Debug Toolbar 설정 (개발 환경에서만 활성화)
# DEBUG가 True이고 debug_toolbar가 설치된 경우에만 추가
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS.insert(0, "debug_toolbar")
    except ImportError:
        pass  # debug_toolbar가 설치되지 않은 경우 무시

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Debug Toolbar 미들웨어 (개발 환경에서만 추가)
if DEBUG:
    MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")
    
    # Debug Toolbar 설정
    INTERNAL_IPS = [
        "127.0.0.1",
    ]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'server.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework settings
REST_FRAMEWORK = {
    # 기본 인증 수단: JWT + 세션(관리 페이지 등)
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # 필터/검색/정렬을 위한 백엔드
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    # 페이지네이션 기본값 (프론트에서 리스트 호출 시 페이지 단위로 받기)
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # OpenAPI 스키마 생성기 (drf-spectacular)
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ---------------------------------------------
# drf-spectacular: 문서 스키마 정보
# ---------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'Subscription API',
    'DESCRIPTION': '구독 서비스 관리 시스템의 백엔드 API 문서',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ---------------------------------------------
# Simple JWT 설정 (토큰 만료 시간 등)
# ---------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # 액세스 토큰 유효시간
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # 리프레시 토큰 유효시간
    'AUTH_HEADER_TYPES': ('Bearer',),                 # "Authorization: Bearer <token>"
}


# -----------------------------
# 📦 .env 로드 (간단 버전: os.environ 직접 사용)
#   * python-decouple / django-environ 사용해도 OK
# -----------------------------
DB_ENGINE = os.getenv("DB_ENGINE", "postgres")  # postgres 또는 mysql
DB_NAME = os.getenv("DB_NAME", "subscriptions")
DB_USER = os.getenv("DB_USER", "appuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "appsecret")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_CONN_MAX_AGE = int(os.getenv("DB_CONN_MAX_AGE", "60"))  # 초 단위, 0이면 매 요청마다 새 연결

# -----------------------------
# 🗄️ Django DATABASES 설정
#   - ENGINE 은 환경변수에 따라 Postgres/MySQL 스위치
#   - OPTIONS 등은 필요 시 확장
# -----------------------------
if DB_ENGINE == "postgres":
    ENGINE = "django.db.backends.postgresql"
elif DB_ENGINE == "mysql":
    ENGINE = "django.db.backends.mysql"
else:
    raise RuntimeError(f"Unsupported DB_ENGINE: {DB_ENGINE}")

DATABASES = {
    "default": {
        "ENGINE": ENGINE,
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
        # 🔁 재사용 가능한 연결(간단한 풀링 효과). API 트래픽에서 성능에 도움.
        "CONN_MAX_AGE": DB_CONN_MAX_AGE,
        # "OPTIONS": { ... }  # 필요 시 타임존, init_command, charset 등 추가
    }
}

# DEBUG / SECRET_KEY 도 .env 사용 권장
DEBUG = bool(int(os.getenv("DJANGO_DEBUG", "0")))
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "!!!-dev-only-!!!")

# -----------------------------
# 🎯 Redis 캐시 설정
#   - 대시보드 계산 결과, 반복 조회 API 등에 사용
#   - docker-compose 환경: redis://redis:6379/0
#   - 로컬 환경: redis://127.0.0.1:6379/0 또는 환경변수 REDIS_URL 사용
# -----------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")  # docker-compose 서비스명 기본값

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 5,  # 연결 타임아웃 (초)
            "SOCKET_TIMEOUT": 5,  # 소켓 타임아웃 (초)
            "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
            "IGNORE_EXCEPTIONS": True,  # Redis 연결 실패 시 예외 무시
        },
        "KEY_PREFIX": "subscriptions",  # 모든 캐시 키에 접두사 추가
        "TIMEOUT": 300,  # 기본 타임아웃 (초) - 5분
    }
}


# -----------------------------
# 📄 로그 설정 (파일 기록)
#   - INFO: 정상 요청 경로 추적용
#   - ERROR: 예외/오류 추적용
# -----------------------------
# 로그 디렉토리 생성
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file_info": {
            "class": "logging.FileHandler",
            "filename": LOGS_DIR / "info.log",
            "level": "INFO",
            "formatter": "verbose",
        },
        "file_error": {
            "class": "logging.FileHandler",
            "filename": LOGS_DIR / "error.log",
            "level": "ERROR",
            "formatter": "verbose",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        }
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file_info", "file_error"],
            "level": "INFO",
            "propagate": False,
        },
        "apps.subscriptions": {
            "handlers": ["console", "file_info", "file_error"],
            "level": "INFO",
            "propagate": False,
        },
    }
}
