from django.db import models
from django.conf import settings
from django.utils import timezone

# 구독 서비스의 카테고리를 저장
class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)   # 카테고리 이름 지정(중복 불가)
    icon = models.CharField(max_length=100, blank=True, null=True)   # 카테고리 아이콘 이름 또는 경로
    description = models.TextField(blank=True)   # 카테고리 설명

    def __str__(self):
        return self.name

# 사용자가 등록한 구독서비스 하나를 나타냄
class Subscription(models.Model):
    BILLING_MONTHLY = 'monthly'
    BILLING_ANNUAL = 'annual'
    BILLING_CUSTOM = 'custom'
    BILLING_CHOICES = [
        (BILLING_MONTHLY, 'Monthly'),
        (BILLING_ANNUAL, 'Annual'),
        (BILLING_CUSTOM, 'Custom'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='KRW')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CHOICES, default=BILLING_MONTHLY)
    billing_cycle_days = models.IntegerField(null=True, blank=True)
    next_payment_date = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)
    metadata = models.JSONField(null=True, blank=True)
    logo_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'active']),   #(user, active) → 사용자별 활성 구독 빠른 조회용 인덱스
            models.Index(fields=['next_payment_date']),   # (next_payment_date) → 결제일 기준 정렬/필터용
        ]
        constraints = [
            # 사용자별 동일한 name 중복 방지 (필요 시)
            models.UniqueConstraint(
                fields=['user', 'name'],
                name='uniq_user_subscription_name'
            ),
            # price는 0 이상
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='check_price_non_negative'
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.user})"

# 각 구독 서비스의 결제 내역(청구 이력) 저장 테이블, 실제 결제 시스템 연동 시 "결제기록 테이블"로 사용 가능
class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending','pending'),
        ('paid','paid'),
        ('failed','failed'),
        ('refunded','refunded'),
    ]
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='KRW')
    paid_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')
    provider_tx_id = models.CharField(max_length=200, null=True, blank=True)
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['paid_at']),   # paid_at → 월별 통계 계산 시 빠른 조회
            models.Index(fields=['status']),   # status → 결제 상태별 필터링용 인덱스
        ]



# 전체 작동 원리 요약

# 1. Category에 "음악", "영상" 등의 카테고리를 먼저 등록
# 2. 사용자가 Netflix 구독 등록 시 → Subscription 생성
# 3. 결제가 일어날 때마다 Payment 객체가 추가되어 히스토리 관리
# 4. 추후 대시보드나 알림 기능에서 next_payment_date 기준으로 다가오는 결제 조회 가능

