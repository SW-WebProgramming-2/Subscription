# 인덱스 요약

이 문서는 구독 서비스 관리 시스템에서 사용하는 모든 인덱스를 정리합니다.

## Subscription 테이블 인덱스

### 1. `subscriptio_user_id_active_idx`
- **필드**: `(user, active)`
- **용도**: 사용자별 활성 구독 빠른 조회
- **Migration**: `0001_initial.py`

### 2. `subscriptio_next_pay_idx`
- **필드**: `(next_payment_date)`
- **용도**: 결제일 기준 정렬/필터 (DRF 기본 정렬: `ordering = ['next_payment_date']`)
- **Migration**: `0001_initial.py`

### 3. `sub_user_active_nextpay_idx`
- **필드**: `(user, active, next_payment_date)`
- **용도**: 사용자 마이페이지/대시보드 정렬에 유리한 복합 인덱스
- **Migration**: `0002_add_indexes.py`

### 4. `sub_name_idx`
- **필드**: `(name)`
- **용도**: name 검색 최적화 (기본 B-tree 인덱스)
- **Migration**: `0002_add_indexes.py`

### 5. `sub_name_trgm_idx`
- **필드**: `(name)` - GIN 인덱스 (trigram)
- **용도**: 부분 문자열 검색 성능 향상 (ILIKE, LIKE 쿼리)
- **Migration**: `0004_add_trigram_index.py`
- **주의**: PostgreSQL trigram 확장 필요

## Payment 테이블 인덱스

### 1. `subscriptio_paid_at_idx`
- **필드**: `(paid_at)`
- **용도**: 월별 통계 계산 시 빠른 조회
- **Migration**: `0001_initial.py`

### 2. `subscriptio_status_idx`
- **필드**: `(status)`
- **용도**: 결제 상태별 필터링
- **Migration**: `0001_initial.py`

### 3. `pay_status_paid_idx`
- **필드**: `(status, paid_at)`
- **용도**: 이번 달 결제 합계 조회 등
- **Migration**: `0003_add_payment_indexes.py`

### 4. `pay_sub_paid_idx`
- **필드**: `(subscription, paid_at)`
- **용도**: 결제 최신순 정렬 (DRF 기본 정렬: `ordering = ['-paid_at']`)
- **Migration**: `0003_add_payment_indexes.py`

## DRF 정렬/페이지네이션 대응

### SubscriptionViewSet
- **기본 정렬**: `ordering = ['next_payment_date']`
- **인덱스**: `subscriptio_next_pay_idx` ✅
- **정렬 필드**: `ordering_fields = ['next_payment_date', 'price', 'created_at']`

### PaymentViewSet
- **기본 정렬**: `ordering = ['-paid_at']`
- **인덱스**: `pay_sub_paid_idx` ✅ (subscription별로 그룹화된 경우)
- **인덱스**: `subscriptio_paid_at_idx` ✅ (전체 정렬)

## 검색 최적화

### SearchFilter 사용 필드
- **Subscription**: `search_fields = ['name', 'metadata']`
- **인덱스**: `sub_name_trgm_idx` (trigram GIN 인덱스) ✅

### Trigram 인덱스 사용 시나리오
```python
# 이 쿼리들이 trigram 인덱스를 활용합니다
Subscription.objects.filter(name__icontains='netflix')
Subscription.objects.filter(name__iregex=r'^net')
```

## Migration 적용 순서

```bash
python manage.py migrate subscriptions
```

Migration 순서:
1. `0001_initial.py` - 기본 모델 및 인덱스
2. `0002_add_indexes.py` - Subscription 복합 인덱스
3. `0003_add_payment_indexes.py` - Payment 복합 인덱스
4. `0004_add_trigram_index.py` - Trigram 확장 및 GIN 인덱스

## 주의사항

1. **Trigram 확장**: `0004_add_trigram_index.py`는 PostgreSQL 슈퍼유저 권한이 필요합니다.
   - Docker 환경: 일반적으로 가능
   - 프로덕션: 데이터베이스 관리자에게 요청 필요

2. **인덱스 유지보수**: 
   - 데이터가 많이 변경되면 `VACUUM ANALYZE` 실행 권장
   - 인덱스 사용 여부는 `EXPLAIN ANALYZE`로 확인

3. **성능 모니터링**:
   - `pg_stat_user_indexes` 뷰로 인덱스 사용 통계 확인
   - 사용되지 않는 인덱스는 제거 고려

