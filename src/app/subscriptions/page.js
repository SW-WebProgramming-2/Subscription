'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { subscriptionAPI } from '@/lib/api';

export default function SubscriptionsPage() {
  const router = useRouter();
  // 구독 데이터 (API에서 불러옴)
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date()); // 현재 보고 있는 달력의 월
  const [selectedDate, setSelectedDate] = useState(null); // 클릭한 날짜

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
  }, []);

  // 구독 목록 불러오기 (구독 추가에서 사용하는 것과 동일한 API)
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 인증 토큰을 통해 자동으로 자신의 구독만 조회됨
        const response = await subscriptionAPI.getSubscriptions();
        
        // API 응답 형식에 맞게 데이터 변환
        // 백엔드 응답: { subscriptions: [...] }
        const subscriptionsData = response.subscriptions || response || [];
        
        // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
        const transformedSubscriptions = subscriptionsData.map(sub => {
          // 백엔드: name, price, next_payment_date, billingCycle
          // 프론트엔드: serviceName, monthlyPrice, paymentDay, originalNextPayment, billingCycle
          const nextPaymentDate = sub.next_payment_date || sub.nextPaymentDate;
          const paymentDay = nextPaymentDate ? new Date(nextPaymentDate).getDate() : null;
          
          return {
            id: sub.id,
            serviceName: sub.name || sub.serviceName,
            monthlyPrice: sub.price || sub.monthlyPrice,
            paymentDay: paymentDay || sub.paymentDay,
            originalNextPayment: nextPaymentDate || sub.originalNextPayment,
            billingCycle: sub.billingCycle || 'monthly', // 결제 주기 추가
            category: sub.category || '기타',
            description: sub.description || '', // 설명 추가
            userId: sub.userId || null, // admin 조회 시 사용자 ID
            username: sub.username || null, // 사용자 이름
          };
        });
        
        setSubscriptions(transformedSubscriptions);
      } catch (err) {
        console.error('구독 목록 불러오기 오류:', err);
        setError('구독 목록을 불러오는 중 오류가 발생했습니다.');
        // 에러 발생 시 빈 배열로 설정
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // admin 여부 확인
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.isAdmin || false);
      } catch (e) {
        setIsAdmin(false);
      }
    }

    fetchSubscriptions();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // [유틸리티] 현재 보고 있는 월에 맞춰 결제일 계산 (billingCycle 고려)
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

  // [로직 수정] 현재 월 기준 표시할 구독 리스트 필터링
  const displayedSubscriptions = useMemo(() => {
    // 1. 현재 보고 있는 달(currentDate) 기준으로 모든 구독의 결제일 계산
    const currentMonthSubs = subscriptions.map(sub => {
      // 데이터에 paymentDay가 없으면 원본 날짜에서 추출
      const day = sub.paymentDay || new Date(sub.originalNextPayment).getDate();
      const billingCycle = sub.billingCycle || 'monthly';
      const paymentDate = getPaymentDateForView(day, currentDate, billingCycle, sub.originalNextPayment);

      return {
        ...sub,
        calculatedPaymentDate: paymentDate // 현재 월 기준 결제일 추가
      };
    });

    // 2. 날짜 선택 여부에 따라 필터링
    if (selectedDate === null) {
      // 월 보기: 현재 보고 있는 달에 결제일이 있는 구독만 반환
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      return currentMonthSubs
        .filter(sub => {
          const paymentYear = sub.calculatedPaymentDate.getFullYear();
          const paymentMonth = sub.calculatedPaymentDate.getMonth();
          
          // 연간 결제 주기인 경우, 원본 결제일의 월과 일이 현재 보고 있는 월과 일치하는지 확인
          if (sub.billingCycle === 'yearly' && sub.originalNextPayment) {
            const originalDate = new Date(sub.originalNextPayment);
            return paymentYear === currentYear && paymentMonth === currentMonth && 
                   paymentMonth === originalDate.getMonth();
          }
          
          // 월간 결제 주기인 경우 기존 로직
          return paymentYear === currentYear && paymentMonth === currentMonth;
        })
        .sort((a, b) => a.calculatedPaymentDate - b.calculatedPaymentDate);
    } else {
      // 일 보기: 선택한 날짜와 정확히 일치하는 구독만 반환
      return currentMonthSubs.filter(sub => {
        return (
            sub.calculatedPaymentDate.getDate() === selectedDate.getDate() &&
            sub.calculatedPaymentDate.getMonth() === selectedDate.getMonth() &&
            sub.calculatedPaymentDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
  }, [subscriptions, selectedDate, currentDate]);

  // totalAmount 계산
  const totalAmount = useMemo(() => {
    return displayedSubscriptions.reduce((sum, sub) => sum + (sub.monthlyPrice || 0), 0);
  }, [displayedSubscriptions]);

  // 통화 포맷팅 함수
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + ' KRW';
  };

  // 캘린더 헬퍼 함수
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // [버그 수정] 월의 첫 날 요일 계산 (0: 일요일 ~ 6: 토요일)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null); // 달이 바뀌면 선택 초기화
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null); // 달이 바뀌면 선택 초기화
  };

  const handleDateClick = (date, isCurrentMonth) => {
    // 현재 달이 아닌 날짜를 클릭하면 해당 달로 이동
    if (!isCurrentMonth) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
      setSelectedDate(null);
      return;
    }

    // 이미 선택된 날짜를 다시 누르면 선택 해제
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  const handleDeleteSubscription = async (id) => {
    const confirmed = window.confirm('정말로 이 구독을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        let errorMessage = `구독 삭제에 실패했습니다. (status: ${res.status})`;
        try {
          const data = await res.json();
          if (data && data.error) {
            errorMessage = data.error;
          }
        } catch (e) {
          // ignore JSON parse error
        }
        throw new Error(errorMessage);
      }

      // 삭제 성공 시 로컬 상태에서 제거
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      console.error('구독 삭제 오류:', err);
      window.alert(err.message || '구독 삭제 중 오류가 발생했습니다.');
    }
  };

  // [버그 수정] 특정 날짜에 결제일이 있는지 확인하는 함수 (인디케이터용)
  const hasPaymentOnDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    return subscriptions.some(sub => {
      const billingCycle = sub.billingCycle || 'monthly';
      
      // 연간 결제 주기인 경우
      if (billingCycle === 'yearly' && sub.originalNextPayment) {
        const originalDate = new Date(sub.originalNextPayment);
        const originalMonth = originalDate.getMonth();
        const originalDay = originalDate.getDate();
        // 원본 결제일의 월과 일이 현재 날짜와 일치하는지 확인
        return originalDay === day && originalMonth === month && year === currentDate.getFullYear();
      }
      
      // 월간 결제 주기인 경우
      const pDay = sub.paymentDay || new Date(sub.originalNextPayment).getDate();
      // 현재 보고 있는 달의 해당 날짜와 결제일이 일치하는지 확인
      return pDay === day && month === currentDate.getMonth() && year === currentDate.getFullYear();
    });
  };

  // [고정 6주 그리드] 42개 셀을 가진 캘린더 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 현재 달의 첫 날과 마지막 날
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInCurrentMonth = getDaysInMonth(currentDate);

    // 이전 달의 마지막 날짜들
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(new Date(prevYear, prevMonth, 1));

    const days = [];

    // 1. 이전 달의 마지막 날짜들 (firstDay 개수만큼)
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(prevYear, prevMonth, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // 2. 현재 달의 모든 날짜들
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }

    // 3. 다음 달의 초반 날짜들 (총 42개가 되도록)
    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }

    return days;
  }, [currentDate]);

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        background: '#f9fafb'
      }}>
        {/* 네비게이션 바 */}
        <nav style={{
          background: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          padding: '0 2rem',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', cursor: 'pointer' }}>
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
          </Link>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>구독 조회</a>
            <Link href="/recommendations" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>AI 추천</Link>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {isLoggedIn ? (
              <>
                <Link href="/profile" style={{
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
                </Link>
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
                <Link href="/login" style={{
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
                </Link>
                <Link href="/signup" style={{
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
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* 메인 컨텐츠 */}
        <main style={{ flex: 1, padding: '2rem 2rem 4rem 2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '600px'
          }}>
            {/* 좌측: 월별 캘린더 */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <button onClick={handlePrevMonth} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.2rem', color: '#667eea' }}>←</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                </h2>
                <button onClick={handleNextMonth} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1.2rem', color: '#667eea' }}>→</button>
              </div>

              {/* 요일 헤더 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {dayNames.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280', fontSize: '0.875rem', padding: '0.5rem' }}>{day}</div>
                ))}
              </div>

              {/* 캘린더 그리드 - 고정 42개 셀 (7일 × 6주) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', flex: 1 }}>
                {calendarDays.map((calendarDay, index) => {
                  const { date, day, isCurrentMonth } = calendarDay;
                  const hasPayment = hasPaymentOnDate(date);
                  const isSelected = selectedDate &&
                      date.getTime() === selectedDate.getTime();
                  const today = new Date();
                  const isToday = isCurrentMonth &&
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();

                  return (
                      <button
                          key={`${date.getFullYear()}-${date.getMonth()}-${day}-${index}`}
                          onClick={() => handleDateClick(date, isCurrentMonth)}
                          style={{
                            aspectRatio: '1',
                            border: isSelected ? '2px solid #667eea' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            background: isSelected ? '#eff6ff' : isToday ? '#fef3c7' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: '0.5rem',
                            position: 'relative',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = isToday ? '#fef3c7' : 'white';
                          }}
                      >
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isSelected
                            ? '#667eea'
                            : isCurrentMonth
                                ? '#1f2937'
                                : '#d1d5db' // 현재 달이 아닌 날짜는 연한 색
                      }}>
                        {day}
                      </span>

                        {/* 결제일 인디케이터 (보라색 점) - 현재 달에만 표시 */}
                        {hasPayment && isCurrentMonth && (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#667eea',
                              marginTop: 'auto',
                              marginBottom: '4px'
                            }} />
                        )}
                      </button>
                  );
                })}
              </div>
            </div>

            {/* 우측: 구독 목록 + 총액 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              {/* 구독 목록 영역 */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxHeight: '500px' // 스크롤을 위한 높이 제한
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {selectedDate
                        ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 결제 예정`
                        : `${currentDate.getMonth() + 1}월 전체 결제 예정`}
                  </h3>
                  {selectedDate && (
                      <button
                          onClick={() => setSelectedDate(null)}
                          style={{ fontSize: '0.8rem', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        전체 보기
                      </button>
                  )}
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                      <p style={{ fontSize: '1rem', margin: 0 }}>구독 정보를 불러오는 중...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#ef4444' }}>
                      <p style={{ fontSize: '1rem', margin: 0 }}>{error}</p>
                    </div>
                ) : displayedSubscriptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                      <p style={{ fontSize: '1rem', margin: 0 }}>
                        {selectedDate
                            ? '이 날짜에는 결제 예정인 구독이 없습니다.'
                            : '이번 달에는 예정된 결제가 없습니다.'}
                      </p>
                    </div>
                ) : (
                    displayedSubscriptions.map(sub => (
                        <div
                            key={sub.id}
                            onClick={() => setSelectedSubscription(sub)}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f9fafb';
                              e.currentTarget.style.borderColor = '#667eea';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                        >
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                              {sub.serviceName}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                              {/* [버그 수정] 현재 달력 기준 날짜 표시 */}
                              결제일: {sub.calculatedPaymentDate.toLocaleDateString('ko-KR')}
                              {isAdmin && sub.username && (
                                <span style={{ marginLeft: '0.5rem', color: '#667eea', fontWeight: '500' }}>
                                  ({sub.username})
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#667eea' }}>
                              {formatCurrency(sub.monthlyPrice)}
                            </div>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #ef4444',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                    ))
                )}
              </div>

              {/* 총 결제 금액 (하단 Sticky Footer 스타일) */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                color: 'white',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '500', margin: '0 0 0.5rem 0', opacity: 0.9 }}>
                      {selectedDate ? '선택 일자 합계' : '이번 달 총 합계'}
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>💳</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 구독 설명 모달 */}
        {selectedSubscription && (
          <div
            onClick={() => setSelectedSubscription(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {selectedSubscription.serviceName}
                </h2>
                <button
                  onClick={() => setSelectedSubscription(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#1f2937';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  카테고리
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedSubscription.category}
                </div>
              </div>

              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  월 구독료
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  {formatCurrency(selectedSubscription.monthlyPrice || 0)}
                </div>
              </div>

              {selectedSubscription.description ? (
                <div style={{
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    설명
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1f2937',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {selectedSubscription.description}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  설명이 없습니다.
                </div>
              )}

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedSubscription(null)}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#5568d3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#667eea';
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 (기존 유지) */}
        <footer style={{ background: '#1f2937', color: 'white', padding: '3rem 2rem 2rem 2rem', marginTop: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
            &copy; 2024 SubManager. All rights reserved.
          </div>
        </footer>
      </div>
  );
}