'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OpenBankingPage() {
  const router = useRouter();
  const [selectedBank, setSelectedBank] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [userSeqNo, setUserSeqNo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    category: ''
  });

  // 계좌 선택 시 거래 내역 조회
  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    
    // 거래 내역 자동 조회
    if (accessToken && userSeqNo) {
      await fetchTransactions(account);
    }
  };

  // 컴포넌트 마운트 시 세션 스토리지에서 계좌 정보 불러오기
  useEffect(() => {
    const savedAccounts = sessionStorage.getItem('openbankingAccounts');
    const savedToken = sessionStorage.getItem('openbankingAccessToken');
    const savedUserSeqNo = sessionStorage.getItem('openbankingUserSeqNo');
    
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
    
    if (savedToken) {
      setAccessToken(savedToken);
      sessionStorage.removeItem('openbankingAccessToken');
    }
    
    if (savedUserSeqNo) {
      setUserSeqNo(savedUserSeqNo);
      sessionStorage.removeItem('openbankingUserSeqNo');
    }
  }, []);

  // 계좌 목록과 인증 정보가 모두 로드되면 첫 번째 계좌 자동 선택
  useEffect(() => {
    if (accounts.length > 0 && accessToken && userSeqNo && !selectedAccount) {
      const firstAccount = accounts[0];
      handleAccountSelect(firstAccount);
    }
  }, [accounts, accessToken, userSeqNo]);

  // 거래 내역 조회
  const fetchTransactions = async (account) => {
    if (!accessToken || !userSeqNo) {
      console.warn('인증 정보가 없어 거래 내역을 조회할 수 없습니다.');
      return;
    }

    setIsLoadingTransactions(true);

    try {
      const response = await fetch('/api/openbanking/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: account.accountId,
          accessToken: accessToken,
          userSeqNo: userSeqNo,
          bankCode: account.bankCode
        })
      });

      if (!response.ok) {
        throw new Error('거래 내역 조회 실패');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      
      // 거래 내역에서 구독 서비스 자동 감지
      detectSubscriptionFromTransactions(data.transactions || []);
    } catch (error) {
      console.error('거래 내역 조회 오류:', error);
      // 에러가 발생해도 계속 진행 (거래 내역 없이도 구독 추가 가능)
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // 거래 내역에서 구독 서비스 자동 감지
  const detectSubscriptionFromTransactions = (transactions) => {
    // 구독 서비스로 알려진 키워드 목록
    const subscriptionKeywords = [
      'netflix', 'spotify', 'youtube', 'disney', 'apple', 'google',
      'microsoft', 'amazon', 'prime', 'disney+', 'netflix',
      '넷플릭스', '스포티파이', '유튜브', '디즈니', '애플', '구글',
      '마이크로소프트', '아마존', '프라임'
    ];

    // 반복되는 거래 찾기 (구독 서비스는 정기적으로 결제됨)
    const recurringTransactions = transactions
      .filter(t => t.type === '출금' && t.amount > 0)
      .map(t => ({
        ...t,
        description: t.description.toLowerCase()
      }))
      .filter(t => 
        subscriptionKeywords.some(keyword => 
          t.description.includes(keyword.toLowerCase())
        )
      );

    if (recurringTransactions.length > 0) {
      // 가장 최근 거래를 기본값으로 설정
      const latestTransaction = recurringTransactions[0];
      const serviceName = extractServiceName(latestTransaction.description);
      
      setSubscriptionInfo(prev => ({
        ...prev,
        name: serviceName || prev.name,
        price: latestTransaction.amount.toString() || prev.price
      }));
    }
  };

  // 거래 내역 설명에서 서비스명 추출
  const extractServiceName = (description) => {
    const serviceMap = {
      'netflix': 'Netflix',
      '넷플릭스': 'Netflix',
      'spotify': 'Spotify',
      '스포티파이': 'Spotify',
      'youtube': 'YouTube Premium',
      '유튜브': 'YouTube Premium',
      'disney': 'Disney+',
      '디즈니': 'Disney+',
      'apple': 'Apple',
      '애플': 'Apple',
      'google': 'Google',
      '구글': 'Google',
      'microsoft': 'Microsoft',
      '마이크로소프트': 'Microsoft',
      'amazon': 'Amazon Prime',
      '아마존': 'Amazon Prime',
      'prime': 'Amazon Prime'
    };

    for (const [key, value] of Object.entries(serviceMap)) {
      if (description.includes(key)) {
        return value;
      }
    }

    // 매칭되지 않으면 원본 설명 반환 (처리된 형태)
    return description.split(' ')[0] || '';
  };

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
                계좌 선택 {selectedAccount && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ 선택됨</span>}
              </label>
              {!selectedAccount && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  💡 아래 계좌를 클릭하면 거래 내역이 자동으로 조회됩니다.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accounts.map(account => (
                  <div
                    key={account.accountId}
                    onClick={() => handleAccountSelect(account)}
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

        {/* 거래 내역 섹션 */}
        {selectedAccount && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                2. 최근 거래 내역
              </h2>
              {accessToken && userSeqNo && (
                <button
                  onClick={() => fetchTransactions(selectedAccount)}
                  disabled={isLoadingTransactions}
                  style={{
                    padding: '0.5rem 1rem',
                    background: isLoadingTransactions ? '#d1d5db' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: isLoadingTransactions ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoadingTransactions ? '조회 중...' : '거래 내역 조회'}
                </button>
              )}
            </div>
            
            {isLoadingTransactions ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                거래 내역 조회 중...
              </div>
            ) : transactions.length > 0 ? (
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: index < Math.min(transactions.length, 10) - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        {transaction.description || '거래 내역'}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {transaction.date ? `${transaction.date.substring(0, 4)}-${transaction.date.substring(4, 6)}-${transaction.date.substring(6, 8)}` : ''}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: transaction.type === '입금' ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.type === '입금' ? '+' : '-'}{transaction.amount.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                {accessToken && userSeqNo 
                  ? '거래 내역이 없거나 조회되지 않았습니다. 위의 "거래 내역 조회" 버튼을 클릭하세요.'
                  : '거래 내역을 조회하려면 오픈뱅킹 인증이 필요합니다.'}
              </div>
            )}
          </section>
        )}

        {/* 구독 정보 입력 섹션 */}
        {selectedAccount && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              {transactions.length > 0 ? '3. 구독 서비스 정보 입력' : '2. 구독 서비스 정보 입력'}
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

