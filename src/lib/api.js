// API 통신 및 데이터 관리 유틸리티

// API 기본 설정
// 프로덕션: Railway 배포 URL 사용
// 개발: localhost 사용
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://subscription-production-2c3d.up.railway.app/api'
    : 'http://localhost:8000/api');

// HTTP 클라이언트
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // 인증 토큰 추가
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient(API_BASE_URL);

// 인증 관련 API
export const authAPI = {
  // 소셜 로그인
  socialLogin: (provider, code) => 
    apiClient.post('/auth/social', { provider, code }),

  // 이메일 로그인
  emailLogin: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // 회원가입
  signup: (userData) =>
    apiClient.post('/auth/signup', userData),

  // 로그아웃
  logout: () =>
    apiClient.post('/auth/logout'),

  // 토큰 갱신
  refreshToken: () =>
    apiClient.post('/auth/refresh'),

  // 비밀번호 재설정
  resetPassword: (email) =>
    apiClient.post('/auth/reset-password', { email }),
};

// 구독 서비스 관련 API
export const subscriptionAPI = {
  // 구독 서비스 목록 조회
  getSubscriptions: (userId) =>
    apiClient.get(`/subscriptions?userId=${userId}`),

  // 구독 서비스 상세 조회
  getSubscription: (id) =>
    apiClient.get(`/subscriptions/${id}`),

  // 구독 서비스 추가
  createSubscription: (subscriptionData) =>
    apiClient.post('/subscriptions', subscriptionData),

  // 구독 서비스 수정
  updateSubscription: (id, subscriptionData) =>
    apiClient.put(`/subscriptions/${id}`, subscriptionData),

  // 구독 서비스 삭제
  deleteSubscription: (id) =>
    apiClient.delete(`/subscriptions/${id}`),

  // 구독 서비스 검색 (서비스명으로)
  searchSubscriptions: (query) =>
    apiClient.get(`/subscriptions/search?q=${encodeURIComponent(query)}`),

  // 인기 구독 서비스 목록
  getPopularSubscriptions: () =>
    apiClient.get('/subscriptions/popular'),

  // 카테고리별 구독 서비스
  getSubscriptionsByCategory: (category) =>
    apiClient.get(`/subscriptions/category/${category}`),
};

// AI 추천 관련 API
export const recommendationAPI = {
  // AI 구독 추천
  getRecommendations: (userId, preferences) =>
    apiClient.post('/recommendations', { userId, preferences }),

  // 절약 추천
  getSavingsRecommendations: (userId) =>
    apiClient.get(`/recommendations/savings?userId=${userId}`),

  // 대체 서비스 추천
  getAlternativeServices: (currentServiceId) =>
    apiClient.get(`/recommendations/alternatives/${currentServiceId}`),

  // 통합 구독 추천
  getBundledRecommendations: (preferences) =>
    apiClient.post('/recommendations/bundled', preferences),

  // 사용률 기반 추천
  getUsageRecommendations: (userId) =>
    apiClient.get(`/recommendations/usage?userId=${userId}`),
};

// 분석 및 대시보드 API
export const analyticsAPI = {
  // 월별 지출 분석
  getMonthlySpending: (userId, year, month) =>
    apiClient.get(`/analytics/spending?userId=${userId}&year=${year}&month=${month}`),

  // 카테고리별 분석
  getCategoryAnalysis: (userId, period) =>
    apiClient.get(`/analytics/categories?userId=${userId}&period=${period}`),

  // 사용률 분석
  getUsageAnalysis: (userId) =>
    apiClient.get(`/analytics/usage?userId=${userId}`),

  // 예측 분석
  getSpendingForecast: (userId) =>
    apiClient.get(`/analytics/forecast?userId=${userId}`),

  // 절약 가능 금액 분석
  getSavingsAnalysis: (userId) =>
    apiClient.get(`/analytics/savings?userId=${userId}`),
};

// 알림 관련 API
export const notificationAPI = {
  // 알림 설정 조회
  getNotificationSettings: (userId) =>
    apiClient.get(`/notifications/settings?userId=${userId}`),

  // 알림 설정 업데이트
  updateNotificationSettings: (userId, settings) =>
    apiClient.put(`/notifications/settings/${userId}`, settings),

  // 알림 발송 (테스트용)
  sendTestNotification: (type, userId) =>
    apiClient.post('/notifications/test', { type, userId }),

  // 알림 히스토리
  getNotificationHistory: (userId) =>
    apiClient.get(`/notifications/history?userId=${userId}`),
};

// 사용자 설정 API
export const userAPI = {
  // 프로필 조회
  getProfile: (userId) =>
    apiClient.get(`/users/${userId}`),

  // 프로필 업데이트
  updateProfile: (userId, profileData) =>
    apiClient.put(`/users/${userId}`, profileData),

  // 알림 설정
  updateNotificationPreferences: (userId, preferences) =>
    apiClient.put(`/users/${userId}/notifications`, preferences),

  // 계정 삭제
  deleteAccount: (userId) =>
    apiClient.delete(`/users/${userId}`),
};

// 캘린더 및 일정 API
export const calendarAPI = {
  // 결제 일정 조회
  getPaymentSchedule: (userId, month, year) =>
    apiClient.get(`/calendar/payments?userId=${userId}&month=${month}&year=${year}`),

  // 결제 일정 업데이트
  updatePaymentSchedule: (subscriptionId, newDate) =>
    apiClient.put(`/calendar/payments/${subscriptionId}`, { nextPayment: newDate }),

  // 결제 리마인더 설정
  setPaymentReminder: (subscriptionId, reminderDays) =>
    apiClient.post(`/calendar/reminders/${subscriptionId}`, { days: reminderDays }),
};

// 파일 업로드 API
export const fileAPI = {
  // 이미지 업로드
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 구독 서비스 로고 업로드
  uploadServiceLogo: (serviceId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('serviceId', serviceId);
    
    return apiClient.post('/files/service-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// 에러 처리 유틸리티
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // 인증 오류 - 로그인 페이지로 리다이렉트
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // 권한 오류
    alert('접근 권한이 없습니다.');
  } else if (error.message.includes('404')) {
    // 리소스 없음
    alert('요청한 데이터를 찾을 수 없습니다.');
  } else if (error.message.includes('500')) {
    // 서버 오류
    alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } else {
    // 기타 오류
    alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
};

// API 응답 검증 유틸리티
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }
  
  expectedFields.forEach(field => {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  
  return response;
};

// 로컬 스토리지 유틸리티
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

// 오픈뱅킹 관련 API
export const openbankingAPI = {
  // 인증 URL 가져오기
  getAuthorizationUrl: (state) =>
    apiClient.post('/openbanking/auth-url/', { state }),

  // 인증 코드를 토큰으로 교환
  exchangeToken: (authorizationCode) =>
    apiClient.post('/openbanking/token/', { code: authorizationCode }),

  // 계좌 목록 조회
  getAccounts: (accessToken, userSeqNo) =>
    apiClient.post('/openbanking/accounts/', {
      access_token: accessToken,
      user_seq_no: userSeqNo
    }),

  // 거래 내역 조회 (구독 결제 확인용)
  getTransactions: (accessToken, fintechUseNum, bankTranId, fromDate, toDate) =>
    apiClient.post('/openbanking/transactions/', {
      access_token: accessToken,
      fintech_use_num: fintechUseNum,
      bank_tran_id: bankTranId,
      from_date: fromDate,
      to_date: toDate
    }),
};

export default {
  authAPI,
  subscriptionAPI,
  recommendationAPI,
  analyticsAPI,
  notificationAPI,
  userAPI,
  calendarAPI,
  fileAPI,
  openbankingAPI,
  handleApiError,
  validateApiResponse,
  storage
};
