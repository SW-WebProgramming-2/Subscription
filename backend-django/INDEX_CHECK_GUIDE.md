# 인덱스 효용 확인 가이드

PostgreSQL에서 추가한 인덱스가 실제로 사용되는지 확인하는 방법입니다.

## 사전 준비

1. Docker 컨테이너 실행
```bash
cd backend-django
docker compose up -d
```

2. Migration 실행 (인덱스 생성)
```bash
python manage.py migrate subscriptions
```

3. 테스트 데이터 생성 (선택사항)
```bash
python manage.py seed_subscriptions
```

## 방법 1: PowerShell 스크립트 사용 (Windows)

```powershell
cd backend-django
.\check_indexes.ps1
```

## 방법 2: Bash 스크립트 사용 (Linux/Mac)

```bash
cd backend-django
chmod +x check_indexes.sh
./check_indexes.sh
```

## 방법 3: 직접 psql 접속

### Docker 컨테이너 접속
```bash
docker exec -it subs_pg psql -U appuser -d subscriptions
```

### 또는 로컬 PostgreSQL 접속
```bash
psql -U appuser -d subscriptions -h localhost -p 5432
```

### SQL 쿼리 실행
```sql
-- 1. 사용자 활성 구독 조회 (인덱스: sub_user_active_nextpay_idx)
EXPLAIN ANALYZE
SELECT id, user_id, name, next_payment_date
FROM subscriptions_subscription
WHERE user_id = 123 AND active = TRUE
ORDER BY next_payment_date
LIMIT 20;

-- 2. 이번 달 결제 합계 (인덱스: pay_status_paid_idx)
EXPLAIN ANALYZE
SELECT SUM(amount)
FROM subscriptions_payment
WHERE status = 'paid' AND paid_at >= date_trunc('month', now());

-- 3. 통계 갱신
VACUUM ANALYZE subscriptions_subscription;
VACUUM ANALYZE subscriptions_payment;

-- 4. 인덱스 목록 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('subscriptions_subscription', 'subscriptions_payment')
ORDER BY tablename, indexname;
```

## 결과 해석

### 인덱스가 사용되는 경우 (좋음)
```
Index Scan using sub_user_active_nextpay_idx on subscriptions_subscription
Bitmap Index Scan using pay_status_paid_idx on subscriptions_payment
```

### 인덱스가 사용되지 않는 경우 (문제)
```
Seq Scan on subscriptions_subscription
Seq Scan on subscriptions_payment
```

인덱스가 사용되지 않는다면:
1. 테이블에 데이터가 너무 적을 수 있습니다 (PostgreSQL은 작은 테이블에 대해 Seq Scan을 선호)
2. 통계가 오래되었을 수 있습니다 → `VACUUM ANALYZE` 실행
3. 쿼리 조건이 인덱스와 맞지 않을 수 있습니다

## 참고사항

- `user_id = 123`은 예시입니다. 실제 존재하는 user_id로 변경하세요.
- 테이블에 데이터가 없으면 인덱스가 사용되지 않을 수 있습니다.
- `VACUUM ANALYZE`는 통계를 갱신하여 쿼리 플래너가 더 나은 실행 계획을 선택하도록 도와줍니다.

