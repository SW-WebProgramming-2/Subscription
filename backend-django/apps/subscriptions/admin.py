# 관리자 사이트에서 Category/Subscription/Payment를 관리할 수 있도록 등록합니다.
from django.contrib import admin
from .models import Category, Subscription, Payment

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    # 리스트 페이지에서 보일 컬럼
    list_display = ('id', 'name', 'icon', 'description')
    search_fields = ('name', 'description')  # 상단 검색
    ordering = ('name',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'name', 'category', 'price', 'currency',
        'billing_cycle', 'next_payment_date', 'active', 'created_at'
    )
    list_filter = ('active', 'billing_cycle', 'currency', 'category')  # 우측 필터
    search_fields = ('name', 'user__username')
    date_hierarchy = 'next_payment_date'  # 상단 날짜 네비게이션
    autocomplete_fields = ('user', 'category')  # 검색 자동완성
    ordering = ('-created_at',)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'subscription', 'amount', 'currency', 'status', 'paid_at')
    list_filter = ('status', 'currency')
    search_fields = ('subscription__name', 'subscription__user__username', 'provider_tx_id')
    date_hierarchy = 'paid_at'
    ordering = ('-paid_at',)
