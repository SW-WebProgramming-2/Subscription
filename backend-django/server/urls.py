"""
URL configuration for subscription manager project.
"""
from django.contrib import admin
from django.urls import path
from . import views
from .openbanking import views as openbanking_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', views.health_check, name='health_check'),
    path('api/subscriptions/', views.subscriptions_list, name='subscriptions_list'),
    path('api/subscriptions/<int:subscription_id>/', views.subscription_detail, name='subscription_detail'),
    
    # 오픈뱅킹 API 엔드포인트
    path('api/openbanking/auth-url/', openbanking_views.get_authorization_url, name='openbanking_auth_url'),
    path('api/openbanking/token/', openbanking_views.exchange_token, name='openbanking_token'),
    path('api/openbanking/accounts/', openbanking_views.get_accounts, name='openbanking_accounts'),
    path('api/openbanking/transactions/', openbanking_views.get_transactions, name='openbanking_transactions'),
]

