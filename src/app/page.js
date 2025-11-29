'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionAPI } from '@/lib/api';
import Chart from '@/components/Chart';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // 로그인 상태 확인 및 구독 정보 불러오기
    const token = localStorage.getItem('authToken');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    setIsLoading(false);

    if (!loggedIn) {
      setSubscriptions([]);
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        setIsSubsLoading(true);
        const response = await subscriptionAPI.getSubscriptions();
        const subscriptionsData = response.subscriptions || response || [];

        // 구독 조회 페이지에서 사용하는 형식과 유사하게 변환
        const transformed = subscriptionsData.map((sub) => {
          const nextPaymentDate = sub.next_payment_date || sub.nextPaymentDate;
          const paymentDay = nextPaymentDate
            ? new Date(nextPaymentDate).getDate()
            : null;

          return {
            id: sub.id,
            serviceName: sub.name || sub.serviceName,
            monthlyPrice: sub.price || sub.monthlyPrice,
            paymentDay: paymentDay || sub.paymentDay,
            originalNextPayment: nextPaymentDate || sub.originalNextPayment,
            billingCycle: sub.billingCycle || 'monthly', // 결제 주기 추가
            category: sub.category || '기타',
          };
        });

        setSubscriptions(transformed);
      } catch (error) {
        console.error('메인 페이지 구독 불러오기 오류:', error);
        setSubscriptions([]);
      } finally {
        setIsSubsLoading(false);
      }
    };

    fetchSubscriptions();
    
    // 추천 서비스 불러오기
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setRecommendations([]);
          return;
        }
        
        // 현재 사용자 ID 가져오기
        let userId = null;
        try {
          const decoded = atob(token);
          const payload = JSON.parse(decoded);
          userId = payload.userId || null;
        } catch (e) {
          console.error('토큰 디코딩 오류:', e);
          if (process.env.NODE_ENV === 'development') {
            userId = 'temp_user_1';
          }
        }
        
        if (!userId) {
          setRecommendations([]);
          return;
        }
        
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '',
            userId: userId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recommendations) {
            setRecommendations(data.recommendations || []);
          }
        }
      } catch (error) {
        console.error('추천 서비스 불러오기 오류:', error);
        setRecommendations([]);
      }
    };
    
    if (loggedIn) {
      fetchRecommendations();
    }
  }, []);

  // 설문 기반 개인 선호도 불러오기 (AI 추천과 동일한 로직 참고)
  useEffect(() => {
    try {
      // 현재 로그인한 사용자 ID 가져오기
      const token = localStorage.getItem('authToken');
      let userId = null;
      
      if (token) {
        try {
          const decoded = atob(token);
          const payload = JSON.parse(decoded);
          userId = payload.userId || null;
        } catch (e) {
          console.error('토큰 디코딩 오류:', e);
        }
      }
      
      if (!userId) {
        setPreferences(null);
        return;
      }
      
      // 사용자별 설문 데이터 가져오기
      const surveyKey = `surveyAnswers_${userId}`;
      const savedData = localStorage.getItem(surveyKey);
      
      if (!savedData) {
        setPreferences(null);
        return;
      }

      const surveyData = JSON.parse(savedData);
      // 저장된 사용자 ID와 현재 사용자 ID가 일치하는지 확인
      if (surveyData.userId !== userId || !surveyData.answers) {
        setPreferences(null);
        return;
      }
      
      const prefs = calculatePreferencesFromSurvey(surveyData.answers || {});
      setPreferences(prefs);
    } catch (error) {
      console.error('메인 페이지 설문 선호도 로딩 오류:', error);
      setPreferences(null);
    }
  }, []);

  // 설문 답변을 기반으로 카테고리별 선호도(1~5) 계산
  const calculatePreferencesFromSurvey = (answers) => {
    // answers가 없거나 빈 객체면 null 반환
    if (!answers || Object.keys(answers).length === 0) {
      return null;
    }

    const categoryMapping = {
      '스트리밍': 'streaming_preference',
      '음악': 'music_preference',
      '소프트웨어': 'software_preference',
      '게임': 'game_preference',
      '클라우드': 'cloud_preference',
      '뉴스/잡지': 'news_preference',
      '피트니스': 'fitness_preference',
      '교육': 'education_preference',
      '기타': 'preferred_category',
    };

    const preferenceScores = {
      '매우 높음': 5,
      '높음': 4,
      '보통': 3,
      '낮음': 2,
      '매우 낮음': 1,
    };

    const result = {};
    const categories = Object.keys(categoryMapping);
    let hasAnyAnswer = false;

    categories.forEach((category) => {
      const questionId = categoryMapping[category];
      if (answers[questionId]) {
        hasAnyAnswer = true;
        const answer = answers[questionId];
        if (preferenceScores[answer] !== undefined) {
          result[category] = preferenceScores[answer];
        } else if (answer === category) {
          // preferred_category 질문의 경우
          result[category] = 5;
        } else {
          result[category] = 3;
        }
      }
    });

    // 하나도 답변이 없으면 null 반환
    if (!hasAnyAnswer) {
      return null;
    }

    return result;
  };

  // 구독 조회 페이지와 동일한 로직: 현재 월에 맞춰 결제일 계산 (billingCycle 고려)
  const getPaymentDateForView = (paymentDay, viewDate, billingCycle, originalNextPayment) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // 연간 결제 주기인 경우, 원본 결제일의 월과 일을 기준으로 계산
    if (billingCycle === 'yearly' && originalNextPayment) {
      const originalDate = new Date(originalNextPayment);
      const originalMonth = originalDate.getMonth();
      const originalDay = originalDate.getDate();
      
      // 현재 보고 있는 연도에서 원본 결제일의 월/일을 사용
      // 해당 월의 말일 확인
      const lastDayOfMonth = new Date(year, originalMonth + 1, 0).getDate();
      const actualDay = Math.min(originalDay, lastDayOfMonth);
      
      return new Date(year, originalMonth, actualDay);
    }
    
    // 월간 결제 주기인 경우 기존 로직 사용
    // 해당 월의 말일 확인 (예: 2월 30일은 없으므로 2월 28일/29일로 처리해야 함)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualDay = Math.min(paymentDay, lastDayOfMonth);

    return new Date(year, month, actualDay);
  };

  // 이번 달에 결제 예정인 구독 필터링 (구독 조회 페이지와 동일한 로직)
  const currentMonthSubscriptions = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = new Date(currentYear, currentMonth, 1);
    
    // 1. 현재 달 기준으로 모든 구독의 결제일 계산
    const currentMonthSubs = subscriptions.map(sub => {
      // 데이터에 paymentDay가 없으면 원본 날짜에서 추출
      const day = sub.paymentDay || (sub.originalNextPayment ? new Date(sub.originalNextPayment).getDate() : null);
      if (!day) return null;
      
      const billingCycle = sub.billingCycle || 'monthly';
      const paymentDate = getPaymentDateForView(day, currentDate, billingCycle, sub.originalNextPayment);

      return {
        ...sub,
        calculatedPaymentDate: paymentDate
      };
    }).filter(sub => sub !== null);

    // 2. 현재 보고 있는 달에 결제일이 있는 구독만 반환
    return currentMonthSubs
      .filter(sub => {
        const paymentYear = sub.calculatedPaymentDate.getFullYear();
        const paymentMonth = sub.calculatedPaymentDate.getMonth();
        
        // 연간 결제 주기인 경우, 원본 결제일의 월이 현재 보고 있는 월과 일치하는지 확인
        if (sub.billingCycle === 'yearly' && sub.originalNextPayment) {
          const originalDate = new Date(sub.originalNextPayment);
          const originalMonth = originalDate.getMonth();
          // 원본 결제일의 월이 현재 월과 일치하면 포함
          return originalMonth === currentMonth;
        }
        
        // 월간 결제 주기인 경우, 계산된 결제일이 현재 월과 일치하는지 확인
        return paymentYear === currentYear && paymentMonth === currentMonth;
      });
  }, [subscriptions]);

  // 이번 달 지출(구독 조회 페이지의 "이번 달 총 합계"와 동일한 로직)
  const currentMonthSpending = useMemo(() => {
    return currentMonthSubscriptions.reduce((sum, sub) => sum + (sub.monthlyPrice || 0), 0);
  }, [currentMonthSubscriptions]);

  // 활성 구독 개수 (현재 기준으로 nextPayment가 아직 지나지 않은 것만 카운트)
  const activeSubscriptionsCount = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return 0;
    const today = new Date();
    return subscriptions.filter((sub) => {
      if (!sub.originalNextPayment) return true; // 날짜 정보 없으면 일단 활성으로 간주
      const next = new Date(sub.originalNextPayment);
      return next >= new Date(today.getFullYear(), today.getMonth(), 1);
    }).length;
  }, [subscriptions]);

  // 절약 가능 금액 계산: 현재 구독 서비스와 추천 서비스를 비교
  const possibleSavings = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0 || !recommendations || recommendations.length === 0) {
      // 추천 서비스가 없으면 기본값 (월 구독 총합의 20%)
      return Math.round(currentMonthSpending * 0.2);
    }
    
    let totalSavings = 0;
    
    // 현재 구독 서비스를 카테고리별로 그룹화
    const subscriptionsByCategory = {};
    subscriptions.forEach(sub => {
      const category = sub.category || '기타';
      if (!subscriptionsByCategory[category]) {
        subscriptionsByCategory[category] = [];
      }
      subscriptionsByCategory[category].push(sub);
    });
    
    // 추천 서비스와 비교하여 절약 가능 금액 계산
    recommendations.forEach(rec => {
      const recCategory = rec.category || '기타';
      const recPrice = rec.price || 0;
      
      // 같은 카테고리인 현재 구독 서비스 찾기
      const sameCategorySubs = subscriptionsByCategory[recCategory] || [];
      
      sameCategorySubs.forEach(currentSub => {
        const currentPrice = currentSub.monthlyPrice || 0;
        
        // 추천 서비스가 더 저렴하면 절약 가능 금액 계산
        if (recPrice > 0 && currentPrice > recPrice) {
          const savings = currentPrice - recPrice;
          totalSavings += savings;
        }
      });
    });
    
    // 절약 가능 금액이 있으면 그 값을 사용, 없으면 기본값
    return totalSavings > 0 ? totalSavings : Math.round(currentMonthSpending * 0.2);
  }, [subscriptions, recommendations, currentMonthSpending]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  const handleAddSubscription = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      alert('구독을 추가하려면 로그인이 필요합니다.');
      router.push('/login');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 네비게이션 바 */}
      <nav style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '0 2rem',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            S
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>SubManager</span>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="/subscriptions" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>구독 조회</a>
          <a href="/recommendations" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>AI 추천</a>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isLoading ? (
            <div style={{ color: '#6b7280' }}>로딩 중...</div>
          ) : isLoggedIn ? (
            <>
              <a href="/profile" style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                회원 정보 조회
              </a>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <a href="/login" style={{
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                로그인
              </a>
              <a href="/signup" style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                회원가입
              </a>
            </>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main style={{ flex: 1, padding: '0 2rem' }}>
        {/* 히어로 섹션 */}
        <section style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4rem 0',
          textAlign: 'center',
          margin: '0 -2rem 3rem -2rem'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold',
              marginBottom: '1rem',
              lineHeight: 1.2
            }}>
              구독 서비스 관리의 모든 것
            </h1>
            
            <p style={{ 
              fontSize: '1.25rem', 
              marginBottom: '2rem',
              opacity: 0.9
            }}>
              모든 구독 서비스를 한 곳에서 관리하고, 불필요한 지출을 줄여보세요
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a 
                href={isLoggedIn ? "/add/openbanking" : "#"}
                onClick={handleAddSubscription}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                구독 추가하기
              </a>
              <a href="/recommendations" style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '1rem 2rem',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                AI 추천 받기
              </a>
            </div>
          </div>
        </section>

        {/* 대시보드 통계 */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>이번 달 지출</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                {isLoggedIn && !isSubsLoading ? formatCurrency(currentMonthSpending) : '₩0'}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>활성 구독</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                {isLoggedIn && !isSubsLoading ? `${activeSubscriptionsCount}개` : '0개'}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>절약 가능</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                {isLoggedIn && !isSubsLoading ? formatCurrency(possibleSavings) : '₩0'}
              </p>
            </div>
          </div>
        </section>

        {/* 구독 서비스 목록 */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>내 구독 서비스</h2>
            <a 
              href={isLoggedIn ? "/add/openbanking" : "#"}
              onClick={handleAddSubscription}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              + 구독 추가
            </a>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#1f2937'
          }}>
            {isSubsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                구독 정보를 불러오는 중입니다...
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>아직 등록된 구독 서비스가 없습니다.</p>
                <p style={{ fontSize: '1.1rem' }}>구독 서비스를 추가해보세요!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      background: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                        {sub.serviceName}
                      </h3>
                      <span style={{
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        background: '#eef2ff',
                        color: '#4f46e5',
                        fontWeight: 500
                      }}>
                        {sub.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#111827' }}>
                        {formatCurrency(sub.monthlyPrice || 0)}
                      </div>
                      {sub.originalNextPayment && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          다음 결제일:{' '}
                          {new Date(sub.originalNextPayment).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 분석 섹션 */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>지출 분석</h2>
          {isLoggedIn && currentMonthSubscriptions.length > 0 ? (
            <Chart data={currentMonthSubscriptions} preferences={preferences} />
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}>
              <p>차트가 여기에 표시됩니다</p>
            </div>
          )}
        </section>
      </main>

      {/* 푸터 */}
      <footer style={{
        background: '#1f2937',
        color: 'white',
        padding: '3rem 2rem 2rem 2rem',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '3rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  S
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SubManager</span>
              </div>
              <p style={{ color: '#d1d5db', lineHeight: 1.6, marginBottom: '2rem' }}>
                모든 구독 서비스를 한 곳에서 관리하고, 스마트한 소비를 위한 AI 추천 서비스를 제공합니다.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['📘', '🐦', '📷', '💼'].map((icon, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: '#374151',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>서비스</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="/subscriptions" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>구독 관리</a>
                <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>대시보드</a>
                <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>AI 추천</a>
                <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>지출 분석</a>
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>지원</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['도움말', '자주 묻는 질문', '문의하기', '서비스 상태'].map((item, index) => (
                  <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>법적 정보</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['개인정보처리방침', '이용약관', '쿠키 정책', '보안'].map((item, index) => (
                  <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid #374151',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: '0.25rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                &copy; 2024 SubManager. All rights reserved.
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                구독 관리 서비스로 스마트한 소비를 시작하세요.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { icon: '🔒', text: 'SSL 보안' },
                { icon: '🛡️', text: '데이터 보호' },
                { icon: '⚡', text: '빠른 처리' }
              ].map((badge, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#374151',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#d1d5db'
                }}>
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
