"""
URL configuration for subscription manager project.
"""
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', views.health_check, name='health_check'),
    path('api/users/', views.users_list, name='users_list'),
    path('api/users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('api/subscriptions/', views.subscriptions_list, name='subscriptions_list'),
    path('api/subscriptions/<int:subscription_id>/', views.subscription_detail, name='subscription_detail'),
]

