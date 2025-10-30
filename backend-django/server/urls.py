"""
URL configuration for subscription manager project.
"""
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', views.health_check, name='health_check'),
    path('api/subscriptions/', views.subscriptions_list, name='subscriptions_list'),
    path('api/subscriptions/<int:subscription_id>/', views.subscription_detail, name='subscription_detail'),
]

