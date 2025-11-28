'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddSubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    category: '',
    nextPaymentDate: '',
    description: ''
  });

  // 구독 정보 저장
  const handleSaveSubscription = async () => {
    if (!subscriptionInfo.name || !subscriptionInfo.price) {
      alert('구독 서비스명과 가격은 필수입니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 인증 토큰 가져오기 (로컬 스토리지에서)
      const authToken = localStorage.getItem('authToken');
      
      // 구독 정보 저장 API 호출
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // 인증 토큰이 있으면 헤더에 추가
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          name: subscriptionInfo.name,
          price: subscriptionInfo.price,
          billingCycle: subscriptionInfo.billingCycle,
          category: subscriptionInfo.category || '',
          nextPaymentDate: subscriptionInfo.nextPaymentDate || null,
          description: subscriptionInfo.description || ''
        })
      });

      if (!response.ok) {
        // 에러 응답의 상세 정보 확인
        let errorMessage = '구독 정보 저장 실패';
        try {
          const errorText = await response.text();
          console.error('API 에러 응답 (텍스트):', errorText);
          
          // JSON 파싱 시도
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error('API 에러 응답 (JSON):', errorData);
          } catch (parseError) {
            // JSON이 아니면 텍스트 그대로 사용
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('에러 응답 읽기 실패:', e);
        }
        throw new Error(`${errorMessage} (상태 코드: ${response.status})`);
      }

      const data = await response.json();
      console.log('구독 정보 저장 성공:', data);
      
      alert('구독 서비스가 성공적으로 추가되었습니다.');
      router.push('/subscriptions');
    } catch (error) {
      console.error('구독 정보 저장 오류:', error);
      const errorMessage = error.message || '구독 정보 저장 중 오류가 발생했습니다.';
      alert(`구독 정보 저장 오류: ${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`);
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
        maxWidth: '600px',
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

        {/* 구독 정보 입력 섹션 */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                구독 서비스명 *
              </label>
              <input
                type="text"
                value={subscriptionInfo.name}
                onChange={(e) => setSubscriptionInfo({...subscriptionInfo, name: e.target.value})}
                placeholder="예: Netflix, Spotify, YouTube Premium"
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
                가격 (원) *
              </label>
              <input
                type="number"
                value={subscriptionInfo.price}
                onChange={(e) => setSubscriptionInfo({...subscriptionInfo, price: e.target.value})}
                placeholder="예: 13500"
                min="0"
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
                다음 결제일
              </label>
              <input
                type="date"
                value={subscriptionInfo.nextPaymentDate}
                onChange={(e) => setSubscriptionInfo({...subscriptionInfo, nextPaymentDate: e.target.value})}
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

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                설명 (선택사항)
              </label>
              <textarea
                value={subscriptionInfo.description}
                onChange={(e) => setSubscriptionInfo({...subscriptionInfo, description: e.target.value})}
                placeholder="구독 서비스에 대한 추가 정보를 입력하세요"
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </section>

        {/* 저장 버튼 */}
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
      </div>
    </div>
  );
}
