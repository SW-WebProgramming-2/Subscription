#!/usr/bin/env python
"""
JWT 토큰 발급 테스트 스크립트
"""
import os
import sys
import django
import requests
import json

# Django 설정 초기화
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

User = get_user_model()

# 테스트 설정
TEST_USERNAME = 'testuser'
TEST_PASSWORD = 'testpass123'
API_BASE_URL = 'http://localhost:8000'  # Django 서버 주소

def create_test_user():
    """테스트용 사용자 생성"""
    print("=" * 50)
    print("테스트용 사용자 생성 중...")
    print("=" * 50)
    
    # 기존 사용자 확인
    if User.objects.filter(username=TEST_USERNAME).exists():
        print(f"사용자 '{TEST_USERNAME}'가 이미 존재합니다.")
        user = User.objects.get(username=TEST_USERNAME)
        # 비밀번호 업데이트
        user.set_password(TEST_PASSWORD)
        user.save()
        print(f"사용자 '{TEST_USERNAME}'의 비밀번호를 업데이트했습니다.")
    else:
        user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_PASSWORD,
            email='test@example.com'
        )
        print(f"새 사용자 '{TEST_USERNAME}'를 생성했습니다.")
    
    print(f"사용자 ID: {user.id}")
    print(f"사용자명: {user.username}")
    print(f"이메일: {user.email}")
    print()

def test_jwt_token_obtain():
    """JWT 토큰 발급 테스트"""
    print("=" * 50)
    print("JWT 토큰 발급 테스트")
    print("=" * 50)
    
    url = f"{API_BASE_URL}/api/auth/token/"
    data = {
        'username': TEST_USERNAME,
        'password': TEST_PASSWORD
    }
    
    print(f"요청 URL: {url}")
    print(f"요청 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
    print()
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        
        print(f"응답 상태 코드: {response.status_code}")
        print(f"응답 헤더: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            print("[성공] 토큰 발급 성공!")
            print()
            print("응답 데이터:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print()
            
            access_token = result.get('access')
            refresh_token = result.get('refresh')
            
            if access_token:
                print(f"액세스 토큰 (처음 50자): {access_token[:50]}...")
                print(f"액세스 토큰 길이: {len(access_token)}")
            if refresh_token:
                print(f"리프레시 토큰 (처음 50자): {refresh_token[:50]}...")
                print(f"리프레시 토큰 길이: {len(refresh_token)}")
            
            return result
        else:
            print("[실패] 토큰 발급 실패!")
            print(f"에러 응답: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("[오류] 서버에 연결할 수 없습니다.")
        print(f"서버가 {API_BASE_URL}에서 실행 중인지 확인하세요.")
        return None
    except Exception as e:
        print(f"[오류] 오류 발생: {str(e)}")
        return None

def test_jwt_token_refresh(refresh_token):
    """JWT 토큰 갱신 테스트"""
    if not refresh_token:
        print("리프레시 토큰이 없어 갱신 테스트를 건너뜁니다.")
        return None
    
    print("=" * 50)
    print("JWT 토큰 갱신 테스트")
    print("=" * 50)
    
    url = f"{API_BASE_URL}/api/auth/token/refresh/"
    data = {
        'refresh': refresh_token
    }
    
    print(f"요청 URL: {url}")
    print(f"리프레시 토큰 (처음 50자): {refresh_token[:50]}...")
    print()
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        
        print(f"응답 상태 코드: {response.status_code}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            print("[성공] 토큰 갱신 성공!")
            print()
            print("응답 데이터:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print()
            
            new_access_token = result.get('access')
            if new_access_token:
                print(f"새 액세스 토큰 (처음 50자): {new_access_token[:50]}...")
            
            return result
        else:
            print("[실패] 토큰 갱신 실패!")
            print(f"에러 응답: {response.text}")
            return None
            
    except Exception as e:
        print(f"[오류] 오류 발생: {str(e)}")
        return None

def test_protected_endpoint(access_token):
    """보호된 엔드포인트에 토큰 사용 테스트"""
    if not access_token:
        print("액세스 토큰이 없어 보호된 엔드포인트 테스트를 건너뜁니다.")
        return
    
    print("=" * 50)
    print("보호된 엔드포인트 테스트")
    print("=" * 50)
    
    # 구독 목록 조회 엔드포인트 테스트
    url = f"{API_BASE_URL}/api/subscriptions/"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"요청 URL: {url}")
    print(f"Authorization 헤더: Bearer {access_token[:50]}...")
    print()
    
    try:
        response = requests.get(url, headers=headers)
        
        print(f"응답 상태 코드: {response.status_code}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            print("[성공] 보호된 엔드포인트 접근 성공!")
            print()
            print("응답 데이터:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        elif response.status_code == 401:
            print("[실패] 인증 실패 (401 Unauthorized)")
            print("토큰이 유효하지 않거나 만료되었을 수 있습니다.")
        else:
            print(f"응답: {response.text}")
            
    except Exception as e:
        print(f"[오류] 오류 발생: {str(e)}")

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("JWT 토큰 발급 테스트 시작")
    print("=" * 50 + "\n")
    
    # 1. 테스트용 사용자 생성
    create_test_user()
    
    # 2. JWT 토큰 발급 테스트
    token_result = test_jwt_token_obtain()
    
    if token_result:
        access_token = token_result.get('access')
        refresh_token = token_result.get('refresh')
        
        # 3. JWT 토큰 갱신 테스트
        if refresh_token:
            print()
            test_jwt_token_refresh(refresh_token)
        
        # 4. 보호된 엔드포인트 테스트
        if access_token:
            print()
            test_protected_endpoint(access_token)
    
    print("\n" + "=" * 50)
    print("테스트 완료")
    print("=" * 50 + "\n")

