"""
오픈뱅킹 API 클라이언트
서버 사이드에서만 사용 가능 (Client Secret 보안)
"""
import os
import requests
import json
from typing import Dict, Optional


class OpenBankingClient:
    """오픈뱅킹 API 클라이언트"""
    
    def __init__(self):
        self.client_id = os.environ.get('OPENBANKING_CLIENT_ID')
        self.client_secret = os.environ.get('OPENBANKING_CLIENT_SECRET')
        self.api_url = os.environ.get(
            'OPENBANKING_API_URL',
            'https://openapi.openbanking.or.kr'
        )
        self.redirect_uri = os.environ.get('OPENBANKING_REDIRECT_URI')
        
        if not self.client_id or not self.client_secret:
            raise ValueError("OPENBANKING_CLIENT_ID and OPENBANKING_CLIENT_SECRET must be set")
    
    def get_access_token(self, authorization_code: str) -> Dict:
        """
        인증 코드로 액세스 토큰 발급
        
        Args:
            authorization_code: 오픈뱅킹 인증 후 받은 authorization code
        
        Returns:
            토큰 정보 (access_token, refresh_token 등)
        """
        url = f"{self.api_url}/oauth/2.0/token"
        
        data = {
            'code': authorization_code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()
    
    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        리프레시 토큰으로 액세스 토큰 갱신
        
        Args:
            refresh_token: 리프레시 토큰
        
        Returns:
            새로운 토큰 정보
        """
        url = f"{self.api_url}/oauth/2.0/token"
        
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()
    
    def get_account_list(self, access_token: str, user_seq_no: str) -> Dict:
        """
        계좌 목록 조회
        
        Args:
            access_token: 액세스 토큰
            user_seq_no: 사용자일련번호
        
        Returns:
            계좌 목록
        """
        url = f"{self.api_url}/v2.0/account/list"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        params = {
            'user_seq_no': user_seq_no
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_account_balance(self, access_token: str, fintech_use_num: str, 
                           bank_tran_id: str, account_num: str) -> Dict:
        """
        계좌 잔액 조회
        
        Args:
            access_token: 액세스 토큰
            fintech_use_num: 핀테크 이용번호
            bank_tran_id: 거래고유번호
            account_num: 계좌번호
        
        Returns:
            계좌 잔액 정보
        """
        url = f"{self.api_url}/v2.0/account/balance/fin_num"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        params = {
            'bank_tran_id': bank_tran_id,
            'fintech_use_num': fintech_use_num,
            'tran_dtime': self._get_tran_dtime()
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_transaction_list(self, access_token: str, fintech_use_num: str,
                            bank_tran_id: str, inquiry_type: str = 'A',
                            from_date: str = None, to_date: str = None) -> Dict:
        """
        거래 내역 조회
        
        Args:
            access_token: 액세스 토큰
            fintech_use_num: 핀테크 이용번호
            bank_tran_id: 거래고유번호
            inquiry_type: 조회구분 (A: 전체, I: 입금, O: 출금)
            from_date: 시작일자 (YYYYMMDD)
            to_date: 종료일자 (YYYYMMDD)
        
        Returns:
            거래 내역 리스트
        """
        url = f"{self.api_url}/v2.0/account/transaction_list/fin_num"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        params = {
            'bank_tran_id': bank_tran_id,
            'fintech_use_num': fintech_use_num,
            'inquiry_type': inquiry_type,
            'tran_dtime': self._get_tran_dtime()
        }
        
        if from_date:
            params['from_date'] = from_date
        if to_date:
            params['to_date'] = to_date
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_authorization_url(self, state: str = None) -> str:
        """
        오픈뱅킹 인증 URL 생성
        
        Args:
            state: 상태값 (CSRF 방지용)
        
        Returns:
            인증 URL
        """
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'login inquiry transfer',
            'state': state or 'random_state'
        }
        
        query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
        return f"{self.api_url}/oauth/2.0/authorize?{query_string}"
    
    @staticmethod
    def _get_tran_dtime() -> str:
        """거래일시 생성 (YYYYMMDDHHMMSS)"""
        from datetime import datetime
        return datetime.now().strftime('%Y%m%d%H%M%S')
    
    @staticmethod
    def generate_bank_tran_id() -> str:
        """거래고유번호 생성"""
        import uuid
        return str(uuid.uuid4()).replace('-', '')[:20]


# 싱글톤 인스턴스
_openbanking_client = None

def get_openbanking_client() -> OpenBankingClient:
    """오픈뱅킹 클라이언트 인스턴스 반환"""
    global _openbanking_client
    if _openbanking_client is None:
        _openbanking_client = OpenBankingClient()
    return _openbanking_client

