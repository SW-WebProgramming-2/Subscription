#!/usr/bin/env python
"""
전체 설정 확인 스크립트
"""
import os
import sys
import django
from pathlib import Path

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.conf import settings
from django.core.cache import cache

print("=" * 70)
print("설정 확인 체크리스트")
print("=" * 70)

results = {}

# 1. Redis 도커 실행 확인
print("\n[1] Redis 도커 실행 확인")
try:
    import subprocess
    result = subprocess.run(
        ["docker", "ps", "--filter", "name=redis", "--format", "{{.Names}}"],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0 and result.stdout.strip():
        redis_containers = result.stdout.strip().split('\n')
        print(f"   ✅ Redis 컨테이너 실행 중: {', '.join(redis_containers)}")
        results['redis'] = True
    else:
        print("   ⚠️  Redis 컨테이너가 실행되지 않음 (로컬 메모리 캐시 사용 가능)")
        results['redis'] = False
except FileNotFoundError:
    print("   ⚠️  Docker가 설치되지 않았거나 실행 중이 아님")
    results['redis'] = False
except Exception as e:
    print(f"   ⚠️  Docker 확인 실패: {e}")
    results['redis'] = False

# 2. Django 캐시 설정 확인
print("\n[2] Django 캐시 설정 확인")
try:
    cache_backend = settings.CACHES['default']['BACKEND']
    cache_location = settings.CACHES['default']['LOCATION']
    print(f"   백엔드: {cache_backend}")
    print(f"   위치: {cache_location}")
    
    # 캐시 테스트
    test_key = "check_setup_test"
    test_value = "test_123"
    cache.set(test_key, test_value, timeout=10)
    cached = cache.get(test_key)
    
    if cached == test_value:
        print("   ✅ cache.set/get 정상 작동")
        results['cache'] = True
    else:
        print(f"   ❌ cache.get 실패: 예상 '{test_value}', 실제 '{cached}'")
        results['cache'] = False
    
    cache.delete(test_key)
except Exception as e:
    print(f"   ❌ 캐시 설정 오류: {e}")
    results['cache'] = False

# 3. 대시보드 캐싱 적용 확인
print("\n[3] 대시보드 캐싱 적용 확인")
try:
    from apps.subscriptions import services
    
    # 캐시 타임아웃 상수 확인
    has_timeout = hasattr(services, 'CACHE_TIMEOUT_MONTHLY_TOTAL')
    has_function = hasattr(services, 'get_monthly_total')
    
    if has_timeout and has_function:
        print("   ✅ 캐싱 함수 및 타임아웃 설정 확인됨")
        print(f"      - CACHE_TIMEOUT_MONTHLY_TOTAL: {services.CACHE_TIMEOUT_MONTHLY_TOTAL}초")
        print(f"      - CACHE_TIMEOUT_CATEGORY_BREAKDOWN: {services.CACHE_TIMEOUT_CATEGORY_BREAKDOWN}초")
        print(f"      - CACHE_TIMEOUT_UPCOMING_PAYMENTS: {services.CACHE_TIMEOUT_UPCOMING_PAYMENTS}초")
        results['dashboard_cache'] = True
    else:
        print("   ❌ 캐싱 함수 또는 설정이 없음")
        results['dashboard_cache'] = False
except Exception as e:
    print(f"   ❌ 확인 실패: {e}")
    results['dashboard_cache'] = False

# 4. 로그 파일 생성 확인
print("\n[4] 로그 파일 생성 확인")
base_dir = Path(settings.BASE_DIR)
logs_dir = base_dir / "logs"
info_log = logs_dir / "info.log"
error_log = logs_dir / "error.log"

if logs_dir.exists():
    print(f"   ✅ 로그 디렉토리 존재: {logs_dir}")
    results['logs_dir'] = True
else:
    print(f"   ❌ 로그 디렉토리 없음: {logs_dir}")
    results['logs_dir'] = False

if info_log.exists():
    print(f"   ✅ info.log 파일 존재: {info_log}")
    results['info_log'] = True
else:
    print(f"   ⚠️  info.log 파일 없음 (서버 실행 후 생성됨)")
    results['info_log'] = False

if error_log.exists():
    print(f"   ✅ error.log 파일 존재: {error_log}")
    results['error_log'] = True
else:
    print(f"   ⚠️  error.log 파일 없음 (서버 실행 후 생성됨)")
    results['error_log'] = False

# 5. Debug Toolbar 설정 확인
print("\n[5] Debug Toolbar 설정 확인")
try:
    from django.urls import reverse
    debug_toolbar_installed = "debug_toolbar" in settings.INSTALLED_APPS
    debug_toolbar_middleware = "debug_toolbar.middleware.DebugToolbarMiddleware" in settings.MIDDLEWARE
    
    if settings.DEBUG:
        if debug_toolbar_installed and debug_toolbar_middleware:
            print("   ✅ Debug Toolbar 설치 및 미들웨어 설정됨")
            print(f"      - DEBUG 모드: {settings.DEBUG}")
            print(f"      - URL: /__debug__/")
            results['debug_toolbar'] = True
        else:
            print("   ⚠️  Debug Toolbar가 설치되지 않았거나 미들웨어가 없음")
            results['debug_toolbar'] = False
    else:
        print("   ℹ️  DEBUG=False이므로 Debug Toolbar 비활성화됨 (정상)")
        results['debug_toolbar'] = True  # 의도적으로 비활성화된 것이므로 OK
except Exception as e:
    print(f"   ❌ 확인 실패: {e}")
    results['debug_toolbar'] = False

# 6. Sentry 연동 확인
print("\n[6] Sentry 연동 확인")
sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    print(f"   ✅ Sentry DSN 설정됨: {sentry_dsn[:20]}...")
    print("   ℹ️  실제 오류 발생 시 Sentry 대시보드로 전송됨")
    results['sentry'] = True
else:
    print("   ⚠️  SENTRY_DSN 환경변수가 설정되지 않음")
    print("   ℹ️  Sentry는 선택사항이며, 설정하지 않아도 정상 작동함")
    results['sentry'] = None  # 선택사항이므로 None

# 최종 결과
print("\n" + "=" * 70)
print("최종 결과 요약")
print("=" * 70)

checklist = {
    "Redis 도커 실행": results.get('redis', False),
    "Django 캐시 설정": results.get('cache', False),
    "대시보드 캐싱 적용": results.get('dashboard_cache', False),
    "로그 디렉토리": results.get('logs_dir', False),
    "Debug Toolbar": results.get('debug_toolbar', False),
    "Sentry 연동": results.get('sentry', None),
}

for item, status in checklist.items():
    if status is True:
        print(f"✅ {item}")
    elif status is None:
        print(f"ℹ️  {item} (선택사항)")
    else:
        print(f"❌ {item}")

print("=" * 70)

