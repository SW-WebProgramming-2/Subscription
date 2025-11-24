"""
API views for subscription manager.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError
import json

User = get_user_model()


def health_check(request):
    """Health check endpoint."""
    return JsonResponse({'status': 'ok', 'message': 'Django backend is running'})


# 사용자 관련 API
@csrf_exempt
@require_http_methods(["GET", "POST"])
def users_list(request):
    """
    GET: 사용자 목록 조회 (관리자 전용)
    POST: 사용자 생성 (회원가입)
    """
    if request.method == 'GET':
        # TODO: 관리자 권한 확인
        users = User.objects.all().values('id', 'username', 'email', 'name', 'date_joined', 'created_at')
        return JsonResponse({
            'users': list(users)
        })
    
    elif request.method == 'POST':
        # 회원가입
        try:
            data = json.loads(request.body)
            name = data.get('name', '').strip()
            username = data.get('username', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()
            
            # 입력 검증
            if not name or not username or not email or not password:
                return JsonResponse({
                    'error': '모든 필드를 입력해주세요.'
                }, status=400)
            
            # 중복 확인
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'error': '이미 사용 중인 아이디입니다.'
                }, status=409)
            
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'error': '이미 사용 중인 이메일입니다.'
                }, status=409)
            
            # 사용자 생성
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                name=name
            )
            
            return JsonResponse({
                'message': '회원가입이 완료되었습니다.',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'email': user.email,
                    'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else user.date_joined.isoformat()
                }
            }, status=201)
            
        except IntegrityError as e:
            return JsonResponse({
                'error': '데이터베이스 오류가 발생했습니다.',
                'details': str(e)
            }, status=400)
        except json.JSONDecodeError:
            return JsonResponse({
                'error': '잘못된 요청입니다.'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': '서버 오류가 발생했습니다.',
                'details': str(e)
            }, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def user_detail(request, user_id):
    """
    GET: 사용자 상세 조회
    PUT: 사용자 정보 수정
    DELETE: 사용자 삭제
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            'error': '사용자를 찾을 수 없습니다.'
        }, status=404)
    
    if request.method == 'GET':
        return JsonResponse({
            'user': {
                'id': user.id,
                'name': user.name,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else user.date_joined.isoformat()
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            if 'name' in data:
                user.name = data['name']
            if 'email' in data:
                user.email = data['email']
            
            user.save()
            
            return JsonResponse({
                'message': '사용자 정보가 수정되었습니다.',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'email': user.email
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'error': '잘못된 요청입니다.'
            }, status=400)
    
    elif request.method == 'DELETE':
        user.delete()
        return JsonResponse({
            'message': '사용자가 삭제되었습니다.'
        })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def subscriptions_list(request):
    """
    GET: 구독 서비스 목록 조회
    POST: 구독 서비스 추가
    """
    if request.method == 'GET':
        # TODO: 데이터베이스에서 구독 서비스 목록 조회
        subscriptions = [
            {
                'id': 1,
                'name': 'Netflix',
                'price': 13500,
                'billing_cycle': 'monthly',
                'next_payment_date': '2025-11-15'
            },
            {
                'id': 2,
                'name': 'Spotify',
                'price': 10900,
                'billing_cycle': 'monthly',
                'next_payment_date': '2025-11-20'
            }
        ]
        return JsonResponse({'subscriptions': subscriptions})
    
    elif request.method == 'POST':
        # TODO: 구독 서비스 추가
        try:
            data = json.loads(request.body)
            return JsonResponse({
                'status': 'success',
                'message': '구독 서비스가 추가되었습니다.',
                'subscription': data
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': '잘못된 요청입니다.'
            }, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def subscription_detail(request, subscription_id):
    """
    GET: 구독 서비스 상세 조회
    PUT: 구독 서비스 수정
    DELETE: 구독 서비스 삭제
    """
    if request.method == 'GET':
        # TODO: 데이터베이스에서 구독 서비스 조회
        subscription = {
            'id': subscription_id,
            'name': 'Netflix',
            'price': 13500,
            'billing_cycle': 'monthly',
            'next_payment_date': '2025-11-15'
        }
        return JsonResponse({'subscription': subscription})
    
    elif request.method == 'PUT':
        # TODO: 구독 서비스 수정
        try:
            data = json.loads(request.body)
            return JsonResponse({
                'status': 'success',
                'message': '구독 서비스가 수정되었습니다.',
                'subscription': data
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': '잘못된 요청입니다.'
            }, status=400)
    
    elif request.method == 'DELETE':
        # TODO: 구독 서비스 삭제
        return JsonResponse({
            'status': 'success',
            'message': '구독 서비스가 삭제되었습니다.'
        })
