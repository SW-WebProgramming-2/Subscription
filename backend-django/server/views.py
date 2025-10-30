"""
API views for subscription manager.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


def health_check(request):
    """Health check endpoint."""
    return JsonResponse({'status': 'ok', 'message': 'Django backend is running'})


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

