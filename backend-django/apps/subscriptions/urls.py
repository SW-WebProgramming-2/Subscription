# backend-django/apps/subscriptions/urls.py
# -------------------------------------------------
# 이 파일은 Django REST Framework의 Router를 통해
# ViewSet을 실제 API URL에 연결해주는 역할을 합니다.

from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    SubscriptionViewSet, 
    PaymentViewSet, 
    DashboardViewSet
)

# DefaultRouter를 사용하면 CRUD URL이 자동으로 생성됩니다.
# 예시:
#   GET /api/categories/
#   POST /api/subscriptions/
#   GET /api/payments/{id}/
#   GET /api/dashboard/monthly-total/
#   GET /api/dashboard/category-breakdown/
#   GET /api/dashboard/upcoming-payments/
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = router.urls

