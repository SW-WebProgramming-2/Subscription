# backend-django/apps/subscriptions/services.py
# -------------------------------------------------
# 이 파일은 '비즈니스 로직'을 담당하는 모듈입니다.
# - 통계 계산
# - 월별 지출 합계
# - 카테고리별 분석
# 등의 복잡한 처리를 views.py 밖으로 분리해서 관리합니다.

from django.db.models import Sum, Count
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from .models import Subscription, Payment, Category

# 캐시 타임아웃 설정 (초 단위)
CACHE_TIMEOUT_MONTHLY_TOTAL = 300  # 5분
CACHE_TIMEOUT_CATEGORY_BREAKDOWN = 300  # 5분
CACHE_TIMEOUT_UPCOMING_PAYMENTS = 180  # 3분

# 1️⃣ 이번 달 지출 합계 계산 (캐싱 적용)
def get_monthly_total(user):
    """
    특정 사용자의 이번 달 총 결제 금액을 계산합니다.
    캐시 키: monthly_total:{user_id}:{YYYYMM}
    캐시 시간: 5분
    """
    key = f"monthly_total:{user.id}:{timezone.now().strftime('%Y%m')}"
    cached = cache.get(key)
    if cached is not None:
        return cached

    # 실제 계산
    now = timezone.now()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total = (Payment.objects
             .filter(subscription__user=user, status='paid', paid_at__gte=start)
             .aggregate(total=Sum('amount'))['total'] or 0)

    total = float(total)

    # 5분 캐싱
    cache.set(key, total, timeout=CACHE_TIMEOUT_MONTHLY_TOTAL)
    return total

# 2️⃣ 카테고리별 지출 비율 계산 (캐싱 적용)
def get_category_breakdown(user):
    """
    특정 사용자의 구독 지출을 카테고리별로 합산합니다.
    캐시 키: category_breakdown:{user_id}
    캐시 시간: 5분
    """
    cache_key = f"category_breakdown:{user.id}"
    
    # 캐시에서 조회
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # 캐시 미스 시 실제 계산
    data = (
        Payment.objects
        .filter(subscription__user=user, status='paid')
        .values('subscription__category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    # 결과를 보기 좋게 변환
    result = [
        {
            "category": item['subscription__category__name'] or "기타",
            "total": float(item['total'])
        }
        for item in data
    ]
    
    # 캐시에 저장
    cache.set(cache_key, result, timeout=CACHE_TIMEOUT_CATEGORY_BREAKDOWN)
    
    return result

# 3️⃣ 다가오는 결제 일정 목록 조회 (캐싱 적용)
def get_upcoming_payments(user, days=7):
    """
    다가오는 N일 이내의 결제 일정(Subscription.next_payment_date 기준)을 반환합니다.
    캐시 키: upcoming_payments:{user_id}:{days}
    캐시 시간: 3분
    """
    cache_key = f"upcoming_payments:{user.id}:{days}"
    
    # 캐시에서 조회
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # 캐시 미스 시 실제 계산
    today = timezone.now().date()
    end_date = today + timedelta(days=days)

    subscriptions = Subscription.objects.filter(
        user=user,
        next_payment_date__gte=today,
        next_payment_date__lte=end_date,
        active=True
    ).select_related('category')

    result = [
        {
            "name": sub.name,
            "category": sub.category.name if sub.category else None,
            "price": float(sub.price),
            "next_payment_date": sub.next_payment_date
        }
        for sub in subscriptions
    ]
    
    # 캐시에 저장
    cache.set(cache_key, result, timeout=CACHE_TIMEOUT_UPCOMING_PAYMENTS)
    
    return result


# 캐시 무효화 헬퍼 함수
def invalidate_user_cache(user):
    """
    사용자 관련 캐시를 모두 무효화합니다.
    결제나 구독 정보가 변경되었을 때 호출합니다.
    """
    now = timezone.now()
    month_key = now.strftime('%Y%m')
    
    # 월별 합계 캐시 무효화
    cache.delete(f"monthly_total:{user.id}:{month_key}")
    
    # 카테고리별 분석 캐시 무효화
    cache.delete(f"category_breakdown:{user.id}")
    
    # 다가오는 결제 캐시 무효화 (여러 days 값에 대응)
    for days in [7, 14, 30]:
        cache.delete(f"upcoming_payments:{user.id}:{days}")