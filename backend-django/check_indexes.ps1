# PostgreSQL 인덱스 효용 확인 스크립트 (PowerShell)
# Docker 컨테이너에서 실행

$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "subscriptions" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "appuser" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "appsecret" }

Write-Host "=== PostgreSQL 인덱스 효용 확인 ===" -ForegroundColor Cyan
Write-Host ""

# Docker 컨테이너 상태 확인
$containerStatus = docker ps -a --filter "name=subs_pg" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "오류: PostgreSQL 컨테이너(subs_pg)를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "Docker 컨테이너를 먼저 시작하세요: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "컨테이너 상태: $containerStatus" -ForegroundColor Green
Write-Host ""

# SQL 쿼리 실행
$sqlQuery = @"
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
"@

Write-Host "PostgreSQL에 쿼리 실행 중..." -ForegroundColor Yellow
docker exec -i subs_pg psql -U $DB_USER -d $DB_NAME <<< $sqlQuery

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 완료 ===" -ForegroundColor Green
    Write-Host "인덱스 사용 여부를 확인하려면 위의 실행 계획에서 'Index Scan' 또는 'Bitmap Index Scan'을 찾으세요." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "오류: 쿼리 실행 실패" -ForegroundColor Red
}

