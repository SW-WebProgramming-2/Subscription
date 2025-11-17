#!/bin/bash
# PostgreSQL 인덱스 효용 확인 스크립트
# Docker 컨테이너에서 실행

# 환경 변수 (docker-compose.yml과 동일)
DB_NAME=${DB_NAME:-subscriptions}
DB_USER=${DB_USER:-appuser}
DB_PASSWORD=${DB_PASSWORD:-appsecret}

echo "=== PostgreSQL 인덱스 효용 확인 ==="
echo ""

# Docker 컨테이너에 접속하여 psql 실행
docker exec -it subs_pg psql -U "$DB_USER" -d "$DB_NAME" <<EOF

-- 1. 사용자 활성 구독 조회 쿼리
\echo '=== 쿼리 1: 사용자 활성 구독 조회 (인덱스: sub_user_active_nextpay_idx) ==='
EXPLAIN ANALYZE
SELECT id, user_id, name, next_payment_date
FROM subscriptions_subscription
WHERE user_id = 123 AND active = TRUE
ORDER BY next_payment_date
LIMIT 20;

\echo ''
\echo '=== 쿼리 2: 이번 달 결제 합계 (인덱스: pay_status_paid_idx) ==='
EXPLAIN ANALYZE
SELECT SUM(amount)
FROM subscriptions_payment
WHERE status = 'paid' AND paid_at >= date_trunc('month', now());

\echo ''
\echo '=== 통계 갱신 (VACUUM ANALYZE) ==='
VACUUM ANALYZE subscriptions_subscription;
VACUUM ANALYZE subscriptions_payment;

\echo ''
\echo '=== 인덱스 목록 확인 ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('subscriptions_subscription', 'subscriptions_payment')
ORDER BY tablename, indexname;

EOF

