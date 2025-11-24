"""
Django admin configuration.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Subscription, Category


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """사용자 관리자 페이지 설정"""
    list_display = ('id', 'username', 'name', 'email', 'is_staff', 'is_superuser', 'created_at', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('username', 'name', 'email')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('추가 정보', {'fields': ('name', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'date_joined', 'last_login')


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """구독 서비스 관리자 페이지 설정"""
    list_display = ('id', 'name', 'user', 'price', 'billing_cycle', 'category', 'next_payment_date', 'created_at')
    list_filter = ('billing_cycle', 'category', 'created_at')
    search_fields = ('name', 'user__username', 'user__email')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'name', 'price', 'billing_cycle', 'category')
        }),
        ('상세 정보', {
            'fields': ('description', 'logo_url', 'next_payment_date')
        }),
        ('오픈뱅킹 연동', {
            'fields': ('account_id', 'account_number', 'bank_code')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """카테고리 관리자 페이지 설정"""
    list_display = ('id', 'name', 'icon', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

