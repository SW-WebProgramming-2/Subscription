"""
오픈뱅킹 API 뷰
서버 사이드에서만 호출 가능
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .client import get_openbanking_client


@csrf_exempt
@require_http_methods(["POST"])
def get_authorization_url(request):
    """
    오픈뱅킹 인증 URL 생성
    프론트엔드에서 이 엔드포인트를 호출하여 인증 URL을 받아 리다이렉트
    """
    try:
        client = get_openbanking_client()
        state = request.POST.get('state') or 'random_state'
        auth_url = client.get_authorization_url(state)
        
        return JsonResponse({
            'status': 'success',
            'authorization_url': auth_url
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def exchange_token(request):
    """
    인증 코드를 액세스 토큰으로 교환
    프론트엔드에서 인증 후 받은 code를 백엔드로 전달
    """
    try:
        data = json.loads(request.body)
        authorization_code = data.get('code')
        
        if not authorization_code:
            return JsonResponse({
                'status': 'error',
                'message': 'authorization code is required'
            }, status=400)
        
        client = get_openbanking_client()
        token_info = client.get_access_token(authorization_code)
        
        # TODO: 토큰을 데이터베이스에 저장 (사용자와 연결)
        
        return JsonResponse({
            'status': 'success',
            'token_info': token_info
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def get_accounts(request):
    """
    계좌 목록 조회
    프론트엔드에서 호출 불가, 백엔드에서만 사용
    """
    try:
        data = json.loads(request.body)
        access_token = data.get('access_token')
        user_seq_no = data.get('user_seq_no')
        
        if not access_token or not user_seq_no:
            return JsonResponse({
                'status': 'error',
                'message': 'access_token and user_seq_no are required'
            }, status=400)
        
        client = get_openbanking_client()
        account_list = client.get_account_list(access_token, user_seq_no)
        
        return JsonResponse({
            'status': 'success',
            'accounts': account_list
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def get_transactions(request):
    """
    거래 내역 조회 (구독 결제 내역 확인용)
    """
    try:
        data = json.loads(request.body)
        access_token = data.get('access_token')
        fintech_use_num = data.get('fintech_use_num')
        bank_tran_id = data.get('bank_tran_id')
        from_date = data.get('from_date')  # YYYYMMDD
        to_date = data.get('to_date')  # YYYYMMDD
        
        if not access_token or not fintech_use_num or not bank_tran_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Required fields are missing'
            }, status=400)
        
        client = get_openbanking_client()
        transactions = client.get_transaction_list(
            access_token,
            fintech_use_num,
            bank_tran_id,
            inquiry_type='O',  # 출금만 조회 (구독 결제)
            from_date=from_date,
            to_date=to_date
        )
        
        return JsonResponse({
            'status': 'success',
            'transactions': transactions
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

