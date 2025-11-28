"""
Django models for subscription manager.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# 사용자 모델 (Django 기본 User 확장)
class User(AbstractUser):
    """사용자 모델"""
    name = models.CharField(max_length=100, verbose_name='이름')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='가입일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자'
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.name})"


# 구독 서비스 모델
class Subscription(models.Model):
    """구독 서비스 모델"""
    BILLING_CYCLE_CHOICES = [
        ('monthly', '월간'),
        ('yearly', '연간'),
        ('quarterly', '분기'),
    ]
    
    CATEGORY_CHOICES = [
        ('streaming', '스트리밍'),
        ('music', '음악'),
        ('software', '소프트웨어'),
        ('cloud', '클라우드'),
        ('gaming', '게임'),
        ('news', '뉴스/잡지'),
        ('fitness', '피트니스'),
        ('education', '교육'),
        ('other', '기타'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions', verbose_name='사용자')
    name = models.CharField(max_length=200, verbose_name='서비스명')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='가격')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly', verbose_name='결제 주기')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True, null=True, verbose_name='카테고리')
    description = models.TextField(blank=True, null=True, verbose_name='설명')
    logo_url = models.URLField(blank=True, null=True, verbose_name='로고 URL')
    next_payment_date = models.DateField(blank=True, null=True, verbose_name='다음 결제일')
    
    # 오픈뱅킹 연동 정보
    account_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='계좌 ID')
    account_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='계좌번호')
    bank_code = models.CharField(max_length=10, blank=True, null=True, verbose_name='은행 코드')
    
    created_at = models.DateTimeField(default=timezone.now, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')
    
    class Meta:
        verbose_name = '구독 서비스'
        verbose_name_plural = '구독 서비스'
        db_table = 'subscriptions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"


# 카테고리 모델
class Category(models.Model):
    """구독 서비스 카테고리 모델"""
    name = models.CharField(max_length=50, unique=True, verbose_name='카테고리명')
    icon = models.CharField(max_length=50, blank=True, null=True, verbose_name='아이콘')
    description = models.TextField(blank=True, null=True, verbose_name='설명')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='생성일')
    
    class Meta:
        verbose_name = '카테고리'
        verbose_name_plural = '카테고리'
        db_table = 'categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name

