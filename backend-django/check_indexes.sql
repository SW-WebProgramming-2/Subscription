-- 인덱스 효용 확인을 위한 EXPLAIN ANALYZE 쿼리
-- PostgreSQL에서 실행하여 인덱스 사용 여부 확인

-- 1. 사용자 활성 구독 조회 쿼리
-- 인덱스: sub_user_active_nextpay_idx (user, active, next_payment_date)
-- 예상: Index Scan 또는 Bitmap Index Scan 사용

EXPLAIN ANALYZE
SELECT id, user_id, name, next_payment_date
FROM subscriptions_subscription
WHERE user_id = 123 AND active = TRUE
ORDER BY next_payment_date
LIMIT 20;

-- 2. 이번 달 결제 합계 쿼리
-- 인덱스: pay_status_paid_idx (status, paid_at)
-- 예상: Index Scan 또는 Bitmap Index Scan 사용

EXPLAIN ANALYZE
SELECT SUM(amount)
FROM subscriptions_payment
WHERE status = 'paid' AND paid_at >= date_trunc('month', now());

-- 3. 통계 갱신 (인덱스 사용 최적화를 위해)
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

