# 캐싱 가이드

대시보드 통계 쿼리 캐싱 구현 가이드입니다.

## 개요

통계용 쿼리(월별 합계, 카테고리별 분석 등)는 1~5분 캐싱하여 체감 성능을 크게 향상시킵니다.

## 구현 내용

### 1. 캐싱이 적용된 함수

- `get_monthly_total(user)` - 이번 달 지출 합계 (5분 캐싱)
- `get_category_breakdown(user)` - 카테고리별 지출 비율 (5분 캐싱)
- `get_upcoming_payments(user, days=7)` - 다가오는 결제 일정 (3분 캐싱)

### 2. 캐시 키 형식

```
monthly_total:{user_id}:{YYYYMM}
category_breakdown:{user_id}
upcoming_payments:{user_id}:{days}
```

### 3. 캐시 타임아웃

- 월별 합계: 5분 (300초)
- 카테고리별 분석: 5분 (300초)
- 다가오는 결제: 3분 (180초)

## 설정

### Redis 사용 (권장)

1. **Redis 설치 및 실행**

**방법 1: Docker로 직접 실행**
```bash
docker run -d -p 6379:6379 --name subs_redis redis:7-alpine
```

**방법 2: docker-compose.yml에 추가 (권장)**
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: subs_redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redisdata:
```

그리고 `backend` 서비스에 `depends_on` 추가:
```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
```

2. **환경 변수 설정**
```bash
# .env 파일
CACHE_BACKEND=redis
REDIS_URL=redis://127.0.0.1:6379/1
```

3. **패키지 설치**
```bash
pip install django-redis>=5.4.0
```

### 로컬 메모리 캐시 (개발/테스트용)

Redis가 없을 경우 자동으로 로컬 메모리 캐시로 폴백됩니다.

```bash
# .env 파일
CACHE_BACKEND=locmem
```

## 캐시 무효화

데이터가 변경되었을 때 캐시를 무효화하려면 `invalidate_user_cache()` 함수를 사용합니다.

### 예시: views.py에서 사용

```python
from . import services

class PaymentViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        payment = serializer.save()
        # 결제 생성 시 캐시 무효화
        services.invalidate_user_cache(payment.subscription.user)
        return payment
    
    def perform_update(self, serializer):
        payment = serializer.save()
        # 결제 수정 시 캐시 무효화
        services.invalidate_user_cache(payment.subscription.user)
        return payment
    
    def perform_destroy(self, instance):
        user = instance.subscription.user
        instance.delete()
        # 결제 삭제 시 캐시 무효화
        services.invalidate_user_cache(user)
```

### 예시: SubscriptionViewSet에서 사용

```python
class SubscriptionViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        subscription = serializer.save(user=self.request.user)
        # 구독 생성 시 캐시 무효화
        services.invalidate_user_cache(self.request.user)
        return subscription
    
    def perform_update(self, serializer):
        subscription = serializer.save()
        # 구독 수정 시 캐시 무효화
        services.invalidate_user_cache(subscription.user)
        return subscription
    
    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        # 구독 삭제 시 캐시 무효화
        services.invalidate_user_cache(user)
```

## 성능 효과

### 캐싱 전
- 월별 합계 조회: ~50-200ms (데이터베이스 쿼리 실행)
- 카테고리별 분석: ~100-300ms (복잡한 집계 쿼리)

### 캐싱 후
- 캐시 히트: ~1-5ms (Redis에서 조회)
- 캐시 미스: 첫 요청만 DB 쿼리 실행, 이후 5분간 캐시 사용

## 모니터링

### Redis CLI로 캐시 확인

```bash
# Redis 접속
redis-cli

# 모든 캐시 키 조회
KEYS subscriptions:*

# 특정 사용자의 캐시 키 조회
KEYS subscriptions:monthly_total:1:*

# 캐시 값 확인
GET subscriptions:monthly_total:1:202412

# 캐시 TTL 확인 (남은 시간)
TTL subscriptions:monthly_total:1:202412
```

### Django Shell에서 캐시 확인

```python
from django.core.cache import cache

# 캐시 키 조회
cache.get('subscriptions:monthly_total:1:202412')

# 캐시 삭제
cache.delete('subscriptions:monthly_total:1:202412')

# 모든 캐시 삭제 (주의!)
cache.clear()
```

## 주의사항

1. **캐시 일관성**: 데이터 변경 시 반드시 `invalidate_user_cache()` 호출
2. **메모리 사용량**: Redis 메모리 사용량 모니터링 필요
3. **캐시 키 충돌**: `KEY_PREFIX` 설정으로 다른 앱과 충돌 방지
4. **타임아웃 조정**: 필요에 따라 `CACHE_TIMEOUT_*` 상수 조정 가능

## 트러블슈팅

### Redis 연결 실패

- `IGNORE_EXCEPTIONS: True` 설정으로 자동 폴백 (로컬 메모리 캐시)
- 로그에서 경고 메시지 확인

### 캐시가 작동하지 않음

1. Redis 실행 확인: `redis-cli ping` → `PONG` 응답 확인
2. 환경 변수 확인: `CACHE_BACKEND`, `REDIS_URL`
3. Django 설정 확인: `python manage.py shell`에서 `from django.conf import settings; print(settings.CACHES)`

### 캐시가 너무 오래 유지됨

- `CACHE_TIMEOUT_*` 상수를 `services.py`에서 조정
- 또는 `invalidate_user_cache()` 호출로 수동 무효화

