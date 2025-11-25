"""
API views for subscription manager.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError
from django.utils import timezone
from datetime import datetime, timedelta
import json

User = get_user_model()
from .models import Subscription


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
        try:
            # 쿼리 파라미터에서 userId 가져오기 (선택적)
            user_id = request.GET.get('userId')
            
            if user_id:
                # 특정 사용자의 구독만 조회
                subscriptions = Subscription.objects.filter(user_id=user_id)
            else:
                # 모든 구독 조회 (관리자용)
                subscriptions = Subscription.objects.all()
            
            # 구독 목록을 JSON 형식으로 변환
            subscriptions_data = []
            for sub in subscriptions:
                # 다음 결제일 계산
                next_payment_date = sub.next_payment_date
                if not next_payment_date and sub.created_at:
                    # 결제일이 없으면 생성일 기준으로 계산
                    created_date = sub.created_at.date()
                    now = timezone.now().date()
                    
                    if sub.billing_cycle == 'monthly':
                        payment_day = created_date.day
                        next_payment_date = datetime(now.year, now.month, payment_day).date()
                        if next_payment_date < now:
                            if now.month == 12:
                                next_payment_date = datetime(now.year + 1, 1, payment_day).date()
                            else:
                                next_payment_date = datetime(now.year, now.month + 1, payment_day).date()
                    elif sub.billing_cycle == 'yearly':
                        next_payment_date = datetime(now.year, created_date.month, created_date.day).date()
                        if next_payment_date < now:
                            next_payment_date = datetime(now.year + 1, created_date.month, created_date.day).date()
                    else:
                        next_payment_date = now + timedelta(days=30)
                
                subscriptions_data.append({
                    'id': sub.id,
                    'name': sub.name,
                    'price': float(sub.price),
                    'billingCycle': sub.billing_cycle,
                    'category': sub.category or '기타',
                    'next_payment_date': next_payment_date.isoformat() if next_payment_date else None,
                    'userId': sub.user.id,
                    'username': sub.user.username,
                    'accountId': sub.account_id,
                    'accountNumber': sub.account_number,
                    'bankCode': sub.bank_code,
                    'logo_url': sub.logo_url,
                    'description': sub.description,
                    'createdAt': sub.created_at.isoformat() if sub.created_at else None,
                    'updatedAt': sub.updated_at.isoformat() if sub.updated_at else None,
                })
            
            return JsonResponse({'subscriptions': subscriptions_data})
        except Exception as e:
            return JsonResponse({
                'error': '서버 오류가 발생했습니다.',
                'details': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # 필수 필드 검증
            name = data.get('name', '').strip()
            price = data.get('price')
            user_id = data.get('userId')
            
            if not name or not price:
                return JsonResponse({
                    'error': '구독 서비스명과 가격은 필수입니다.'
                }, status=400)
            
            # 사용자 확인
            if not user_id:
                return JsonResponse({
                    'error': '사용자 ID가 필요합니다.'
                }, status=400)
            
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({
                    'error': '사용자를 찾을 수 없습니다.'
                }, status=404)
            
            # 구독 서비스 생성
            subscription = Subscription.objects.create(
                user=user,
                name=name,
                price=price,
                billing_cycle=data.get('billingCycle', 'monthly'),
                category=data.get('category', ''),
                description=data.get('description', ''),
                logo_url=data.get('logo_url', ''),
                account_id=data.get('accountId'),
                account_number=data.get('accountNumber'),
                bank_code=data.get('bankCode'),
                next_payment_date=data.get('next_payment_date') if data.get('next_payment_date') else None,
            )
            
            return JsonResponse({
                'message': '구독 서비스가 추가되었습니다.',
                'subscription': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'price': float(subscription.price),
                    'billingCycle': subscription.billing_cycle,
                    'category': subscription.category or '기타',
                    'userId': subscription.user.id,
                    'accountId': subscription.account_id,
                    'accountNumber': subscription.account_number,
                    'bankCode': subscription.bank_code,
                    'createdAt': subscription.created_at.isoformat() if subscription.created_at else None,
                }
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({
                'error': '잘못된 요청입니다.'
            }, status=400)
        except IntegrityError as e:
            return JsonResponse({
                'error': '데이터베이스 오류가 발생했습니다.',
                'details': str(e)
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': '서버 오류가 발생했습니다.',
                'details': str(e)
            }, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def subscription_detail(request, subscription_id):
    """
    GET: 구독 서비스 상세 조회
    PUT: 구독 서비스 수정
    DELETE: 구독 서비스 삭제
    """
    try:
        subscription = Subscription.objects.get(id=subscription_id)
    except Subscription.DoesNotExist:
        return JsonResponse({
            'error': '구독 서비스를 찾을 수 없습니다.'
        }, status=404)
    
    if request.method == 'GET':
        # 다음 결제일 계산
        next_payment_date = subscription.next_payment_date
        if not next_payment_date and subscription.created_at:
            created_date = subscription.created_at.date()
            now = timezone.now().date()
            
            if subscription.billing_cycle == 'monthly':
                payment_day = created_date.day
                next_payment_date = datetime(now.year, now.month, payment_day).date()
                if next_payment_date < now:
                    if now.month == 12:
                        next_payment_date = datetime(now.year + 1, 1, payment_day).date()
                    else:
                        next_payment_date = datetime(now.year, now.month + 1, payment_day).date()
            elif subscription.billing_cycle == 'yearly':
                next_payment_date = datetime(now.year, created_date.month, created_date.day).date()
                if next_payment_date < now:
                    next_payment_date = datetime(now.year + 1, created_date.month, created_date.day).date()
            else:
                next_payment_date = now + timedelta(days=30)
        
        return JsonResponse({
            'subscription': {
                'id': subscription.id,
                'name': subscription.name,
                'price': float(subscription.price),
                'billingCycle': subscription.billing_cycle,
                'category': subscription.category or '기타',
                'next_payment_date': next_payment_date.isoformat() if next_payment_date else None,
                'userId': subscription.user.id,
                'username': subscription.user.username,
                'accountId': subscription.account_id,
                'accountNumber': subscription.account_number,
                'bankCode': subscription.bank_code,
                'logo_url': subscription.logo_url,
                'description': subscription.description,
                'createdAt': subscription.created_at.isoformat() if subscription.created_at else None,
                'updatedAt': subscription.updated_at.isoformat() if subscription.updated_at else None,
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # 필드 업데이트
            if 'name' in data:
                subscription.name = data['name'].strip()
            if 'price' in data:
                subscription.price = data['price']
            if 'billingCycle' in data:
                subscription.billing_cycle = data['billingCycle']
            if 'category' in data:
                subscription.category = data['category']
            if 'description' in data:
                subscription.description = data.get('description', '')
            if 'logo_url' in data:
                subscription.logo_url = data.get('logo_url', '')
            if 'next_payment_date' in data:
                subscription.next_payment_date = data['next_payment_date'] if data['next_payment_date'] else None
            if 'accountId' in data:
                subscription.account_id = data.get('accountId')
            if 'accountNumber' in data:
                subscription.account_number = data.get('accountNumber')
            if 'bankCode' in data:
                subscription.bank_code = data.get('bankCode')
            
            subscription.save()
            
            return JsonResponse({
                'message': '구독 서비스가 수정되었습니다.',
                'subscription': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'price': float(subscription.price),
                    'billingCycle': subscription.billing_cycle,
                    'category': subscription.category or '기타',
                    'userId': subscription.user.id,
                    'accountId': subscription.account_id,
                    'accountNumber': subscription.account_number,
                    'bankCode': subscription.bank_code,
                    'updatedAt': subscription.updated_at.isoformat() if subscription.updated_at else None,
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'error': '잘못된 요청입니다.'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': '서버 오류가 발생했습니다.',
                'details': str(e)
            }, status=500)
    
    elif request.method == 'DELETE':
        try:
            subscription.delete()
            return JsonResponse({
                'message': '구독 서비스가 삭제되었습니다.'
            })
        except Exception as e:
            return JsonResponse({
                'error': '서버 오류가 발생했습니다.',
                'details': str(e)
            }, status=500)
