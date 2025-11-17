"""
URL configuration for subscription manager project.
"""
from django.contrib import admin
from django.urls import path, include
from . import views

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', views.health_check, name='health_check'),
    path('api/', include('apps.subscriptions.urls')),  # /api/ 경로로 구독 API 연결

    # JWT 발급/재발급 엔드포인트
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),   # POST: {username, password}
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # POST: {refresh}

    # OpenAPI 스키마(JSON) & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path("__debug__/", include("debug_toolbar.urls")),
]
