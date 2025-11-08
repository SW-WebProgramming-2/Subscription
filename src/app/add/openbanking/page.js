'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OpenBankingPage() {
  const router = useRouter();
  const [selectedBank, setSelectedBank] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    category: ''
  });

  // 컴포넌트 마운트 시 세션 스토리지에서 계좌 정보 불러오기
  useEffect(() => {
    const savedAccounts = sessionStorage.getItem('openbankingAccounts');
    if (savedAccounts) {
      try {
        const accounts = JSON.parse(savedAccounts);
        setAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedBank(accounts[0].bankCode);
        }
        // 사용 후 세션 스토리지에서 제거
        sessionStorage.removeItem('openbankingAccounts');
      } catch (error) {
        console.error('계좌 정보 파싱 오류:', error);
      }
    }
  }, []);

  // 한국 주요 은행 목록
  const banks = [
    { code: '001', name: '한국은행', logo: '🏦' },
    { code: '002', name: '산업은행', logo: '🏦' },
    { code: '003', name: '기업은행', logo: '🏦' },
    { code: '004', name: 'KB국민은행', logo: '🏦' },
    { code: '011', name: 'NH농협은행', logo: '🏦' },
    { code: '020', name: '우리은행', logo: '🏦' },
    { code: '023', name: 'SC제일은행', logo: '🏦' },
    { code: '027', name: '한국씨티은행', logo: '🏦' },
    { code: '032', name: '대구은행', logo: '🏦' },
    { code: '034', name: '광주은행', logo: '🏦' },
    { code: '037', name: '전북은행', logo: '🏦' },
    { code: '039', name: '경남은행', logo: '🏦' },
    { code: '045', name: '새마을금고', logo: '🏦' },
    { code: '048', name: '신협', logo: '🏦' },
    { code: '050', name: '저축은행', logo: '🏦' },
    { code: '071', name: '우체국', logo: '🏦' },
    { code: '081', name: '하나은행', logo: '🏦' },
    { code: '088', name: '신한은행', logo: '🏦' },
    { code: '089', name: '케이뱅크', logo: '🏦' },
    { code: '090', name: '카카오뱅크', logo: '🏦' },
    { code: '092', name: '토스뱅크', logo: '🏦' },
    { code: '218', name: 'KB증권', logo: '🏦' },
    { code: '238', name: '미래에셋증권', logo: '🏦' },
    { code: '240', name: '삼성증권', logo: '🏦' },
    { code: '243', name: '한국투자증권', logo: '🏦' },
    { code: '247', name: 'NH투자증권', logo: '🏦' },
    { code: '261', name: '교보증권', logo: '🏦' },
    { code: '262', name: '하이투자증권', logo: '🏦' },
    { code: '263', name: 'HMC투자증권', logo: '🏦' },
    { code: '264', name: '키움증권', logo: '🏦' },
    { code: '265', name: '이베스트투자증권', logo: '🏦' },
    { code: '266', name: 'SK증권', logo: '🏦' },
    { code: '267', name: '대신증권', logo: '🏦' },
    { code: '268', name: '미래에셋대우', logo: '🏦' },
    { code: '269', name: '한국포스증권', logo: '🏦' },
    { code: '270', name: 'DB금융투자', logo: '🏦' },
    { code: '278', name: '신한금융투자', logo: '🏦' },
    { code: '279', name: 'IBK투자증권', logo: '🏦' },
    { code: '280', name: '유진투자증권', logo: '🏦' },
    { code: '287', name: '메리츠종합금융증권', logo: '🏦' },
    { code: '288', name: 'NH-아이오티스페이', logo: '🏦' },
    { code: '290', name: '부국증권', logo: '🏦' },
    { code: '291', name: '신영증권', logo: '🏦' },
    { code: '292', name: 'LIG투자증권', logo: '🏦' },
    { code: '293', name: '한화투자증권', logo: '🏦' }
  ];

  // 오픈뱅킹 API 호출 함수
  const handleOpenBankingAuth = async () => {
    if (!selectedBank) {
      alert('은행을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 오픈뱅킹 인증 URL 생성 (실제 구현 시 백엔드 API를 통해 처리)
      // 여기서는 시뮬레이션으로 처리
      const authUrl = await initiateOpenBankingAuth(selectedBank);
      
      // 오픈뱅킹 인증 페이지로 리다이렉트
      // 실제 오픈뱅킹 인증 페이지로 이동
      window.location.href = authUrl;
    } catch (error) {
      console.error('오픈뱅킹 인증 오류:', error);
      const errorMessage = error.message || '오픈뱅킹 인증 중 오류가 발생했습니다.';
      alert(`오픈뱅킹 인증 오류: ${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`);
      setIsLoading(false);
    }
  };

  // 오픈뱅킹 인증 시작 (백엔드 API 호출)
  const initiateOpenBankingAuth = async (bankCode) => {
    // 프로덕션 URL을 콜백 URL로 사용 (금융 API는 localhost를 허용하지 않음)
    // 환경 변수가 설정되어 있으면 사용하고, 없으면 프로덕션 URL을 기본값으로 사용
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/add/openbanking/callback`
      : 'https://subscription-production-2c3d.up.railway.app/add/openbanking/callback';
    
    // 실제 구현 시 백엔드 API를 호출하여 오픈뱅킹 인증 URL을 받아옴
    const response = await fetch('/api/openbanking/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bankCode: bankCode,
        redirectUri: callbackUrl
      })
    });

    if (!response.ok) {
      // 에러 응답의 상세 정보 확인
      let errorMessage = '오픈뱅킹 인증 URL 생성 실패';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('API 에러 응답:', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error('API 에러 응답 (텍스트):', errorText);
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`${errorMessage} (상태 코드: ${response.status})`);
    }

    const data = await response.json();
    
    if (!data.authUrl) {
      throw new Error('인증 URL이 응답에 포함되지 않았습니다.');
    }
    
    return data.authUrl;
  };

  // 구독 정보 저장
  const handleSaveSubscription = async () => {
    if (!selectedAccount) {
      alert('계좌를 선택해주세요.');
      return;
    }

    if (!subscriptionInfo.name || !subscriptionInfo.price) {
      alert('구독 서비스 정보를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 구독 정보 저장 API 호출
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subscriptionInfo,
          accountId: selectedAccount.accountId,
          accountNumber: selectedAccount.accountNumber,
          bankCode: selectedAccount.bankCode
        })
      });

      if (!response.ok) {
        throw new Error('구독 정보 저장 실패');
      }

      alert('구독 서비스가 성공적으로 추가되었습니다.');
      router.push('/subscriptions');
    } catch (error) {
      console.error('구독 정보 저장 오류:', error);
      alert('구독 정보 저장 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            구독 서비스 추가
          </h1>
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* 오픈뱅킹 연동 섹션 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            1. 은행 계좌 연동
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              은행 선택
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              disabled={isLoading || accounts.length > 0}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                background: accounts.length > 0 ? '#f3f4f6' : 'white'
              }}
            >
              <option value="">은행을 선택하세요</option>
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>
                  {bank.logo} {bank.name}
                </option>
              ))}
            </select>
          </div>

          {accounts.length === 0 && (
            <button
              onClick={handleOpenBankingAuth}
              disabled={!selectedBank || isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: selectedBank && !isLoading ? '#667eea' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: selectedBank && !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              {isLoading ? '인증 중...' : '오픈뱅킹 인증하기'}
            </button>
          )}

          {/* 계좌 목록 */}
          {accounts.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                계좌 선택
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(account => (
                  <div
                    key={account.accountId}
                    onClick={() => setSelectedAccount(account)}
                    style={{
                      padding: '1rem',
                      border: selectedAccount?.accountId === account.accountId 
                        ? '2px solid #667eea' 
                        : '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedAccount?.accountId === account.accountId 
                        ? '#f0f4ff' 
                        : 'white'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {account.accountName}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {account.accountNumber}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {account.balance.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 구독 정보 입력 섹션 */}
        {selectedAccount && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              2. 구독 서비스 정보 입력
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  서비스명 *
                </label>
                <input
                  type="text"
                  value={subscriptionInfo.name}
                  onChange={(e) => setSubscriptionInfo({...subscriptionInfo, name: e.target.value})}
                  placeholder="예: Netflix, Spotify"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  월 구독료 (원) *
                </label>
                <input
                  type="number"
                  value={subscriptionInfo.price}
                  onChange={(e) => setSubscriptionInfo({...subscriptionInfo, price: e.target.value})}
                  placeholder="예: 13500"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  결제 주기
                </label>
                <select
                  value={subscriptionInfo.billingCycle}
                  onChange={(e) => setSubscriptionInfo({...subscriptionInfo, billingCycle: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="monthly">월간</option>
                  <option value="yearly">연간</option>
                  <option value="quarterly">분기</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  카테고리
                </label>
                <select
                  value={subscriptionInfo.category}
                  onChange={(e) => setSubscriptionInfo({...subscriptionInfo, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">카테고리 선택</option>
                  <option value="streaming">스트리밍</option>
                  <option value="music">음악</option>
                  <option value="software">소프트웨어</option>
                  <option value="cloud">클라우드</option>
                  <option value="gaming">게임</option>
                  <option value="news">뉴스/잡지</option>
                  <option value="fitness">피트니스</option>
                  <option value="education">교육</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* 저장 버튼 */}
        {selectedAccount && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSaveSubscription}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: isLoading ? '#d1d5db' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '저장 중...' : '구독 추가하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

