#!/usr/bin/env python
"""
캐시 설정 및 작동 여부 확인 스크립트
"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.core.cache import cache
from django.conf import settings

print("=" * 60)
print("캐시 설정 확인")
print("=" * 60)

# 1. 캐시 백엔드 확인
print(f"\n1. 캐시 백엔드: {settings.CACHES['default']['BACKEND']}")
print(f"   Redis URL: {settings.CACHES['default']['LOCATION']}")

# 2. 캐시 테스트
print("\n2. 캐시 작동 테스트:")
try:
    # 테스트 키 설정
    test_key = "test_cache_key"
    test_value = "test_value_12345"
    
    # 캐시에 저장
    cache.set(test_key, test_value, timeout=60)
    print(f"   ✓ cache.set('{test_key}', '{test_value}') 성공")
    
    # 캐시에서 조회
    cached_value = cache.get(test_key)
    if cached_value == test_value:
        print(f"   ✓ cache.get('{test_key}') = '{cached_value}' 성공")
        print("   ✅ 캐시 정상 작동!")
    else:
        print(f"   ✗ cache.get() 실패: 예상 '{test_value}', 실제 '{cached_value}'")
        print("   ❌ 캐시 작동 실패")
    
    # 캐시 삭제
    cache.delete(test_key)
    print(f"   ✓ cache.delete('{test_key}') 성공")
    
except Exception as e:
    print(f"   ❌ 캐시 테스트 실패: {e}")
    print(f"   오류 타입: {type(e).__name__}")

print("\n" + "=" * 60)

