'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OpenBankingCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setTimeout(() => {
        router.push('/add/openbanking');
      }, 3000);
      return;
    }

    if (code && state) {
      // 오픈뱅킹 인증 코드로 토큰 교환 및 계좌 정보 조회
      handleCallback(code, state);
    }
  }, [searchParams, router]);

  const handleCallback = async (code, state) => {
    try {
      // 백엔드 API를 통해 토큰 교환 및 계좌 정보 조회
      const response = await fetch('/api/openbanking/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        throw new Error('오픈뱅킹 연동 실패');
      }

      const data = await response.json();
      
      console.log('콜백에서 받은 데이터:', {
        hasAccounts: !!data.accounts,
        accountsCount: data.accounts?.length || 0,
        hasToken: !!data.accessToken,
        hasUserSeqNo: !!data.userSeqNo
      });
      
      // 계좌 정보와 인증 정보를 세션 스토리지에 저장
      if (data.accounts && data.accounts.length > 0) {
        sessionStorage.setItem('openbankingAccounts', JSON.stringify(data.accounts));
        console.log('계좌 정보 저장 완료:', data.accounts);
      }
      
      if (data.accessToken) {
        sessionStorage.setItem('openbankingAccessToken', data.accessToken);
        console.log('AccessToken 저장 완료');
      }
      
      if (data.userSeqNo) {
        sessionStorage.setItem('openbankingUserSeqNo', data.userSeqNo);
        console.log('UserSeqNo 저장 완료:', data.userSeqNo);
      }
      
      // 저장 확인
      const savedAccounts = sessionStorage.getItem('openbankingAccounts');
      const savedToken = sessionStorage.getItem('openbankingAccessToken');
      const savedUserSeqNo = sessionStorage.getItem('openbankingUserSeqNo');
      
      console.log('저장 확인:', {
        savedAccounts: !!savedAccounts,
        savedToken: !!savedToken,
        savedUserSeqNo: !!savedUserSeqNo
      });
      
      setStatus('success');
      
      // 세션 스토리지 저장이 완료된 후 리다이렉트
      setTimeout(() => {
        router.push('/add/openbanking');
      }, 2000);
    } catch (error) {
      console.error('오픈뱅킹 콜백 처리 오류:', error);
      setStatus('error');
      setTimeout(() => {
        router.push('/add/openbanking');
      }, 3000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }} />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              오픈뱅킹 인증 처리 중...
            </h2>
            <p style={{ color: '#6b7280' }}>
              잠시만 기다려주세요.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              인증 완료
            </h2>
            <p style={{ color: '#6b7280' }}>
              계좌 연동이 완료되었습니다.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
              color: 'white'
            }}>
              ✕
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              인증 실패
            </h2>
            <p style={{ color: '#6b7280' }}>
              오픈뱅킹 인증 중 오류가 발생했습니다.
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

