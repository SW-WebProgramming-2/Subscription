/**
 * Django 백엔드에서 구독 서비스 데이터를 가져오는 함수
 * 현재는 더미 데이터를 반환하며, 실제 Django API 연동 시 URL만 변경하면 됩니다.
 */

const DJANGO_API_BASE_URL = process.env.DJANGO_API_URL || 'http://localhost:8000/api';

/**
 * Django API에서 사용자의 구독 서비스 목록을 가져옵니다.
 * 
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 구독 서비스 목록
 */
export async function fetchUserSubscriptions(userId) {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  // 실제 Django API 엔드포인트 URL
  const url = `${DJANGO_API_BASE_URL}/subscriptions/${userId}/`;

  try {
    // 실제 Django API 호출 (현재는 주석 처리)
    /*
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 인증 토큰이 필요한 경우
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Django API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.subscriptions || data || [];
    */

    // 더미 데이터 반환 (실제 Django API 연동 전까지 사용)
    console.log(`[더미 데이터] 사용자 ${userId}의 구독 서비스 조회 요청`);
    return getDummySubscriptions(userId);
  } catch (error) {
    console.error('Django API 호출 오류:', error);
    
    // 오류 발생 시에도 더미 데이터 반환 (개발 편의성)
    console.warn('Django API 호출 실패, 더미 데이터 반환');
    return getDummySubscriptions(userId);
  }
}

/**
 * 더미 구독 서비스 데이터 생성
 * 실제 Django API가 준비되면 이 함수는 제거됩니다.
 * 
 * @param {string} userId - 사용자 ID
 * @returns {Array} 더미 구독 서비스 목록
 */
function getDummySubscriptions(userId) {
  // 사용자별로 다른 더미 데이터를 반환할 수 있도록 userId 기반으로 변형
  const seed = userId ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  
  const allDummySubscriptions = [
    {
      id: 1,
      name: 'Netflix',
      category: '스트리밍',
      price: 13500,
      billingCycle: 'monthly',
      nextPayment: '2024-02-15',
      status: 'active',
    },
    {
      id: 2,
      name: 'Disney+',
      category: '스트리밍',
      price: 9900,
      billingCycle: 'monthly',
      nextPayment: '2024-02-20',
      status: 'active',
    },
    {
      id: 3,
      name: 'Spotify Premium',
      category: '음악',
      price: 10900,
      billingCycle: 'monthly',
      nextPayment: '2024-02-10',
      status: 'active',
    },
    {
      id: 4,
      name: 'YouTube Premium',
      category: '스트리밍',
      price: 11900,
      billingCycle: 'monthly',
      nextPayment: '2024-02-12',
      status: 'active',
    },
    {
      id: 5,
      name: 'Adobe Creative Cloud',
      category: '소프트웨어',
      price: 59000,
      billingCycle: 'monthly',
      nextPayment: '2024-02-25',
      status: 'active',
    },
    {
      id: 6,
      name: 'Microsoft 365',
      category: '소프트웨어',
      price: 10900,
      billingCycle: 'monthly',
      nextPayment: '2024-02-18',
      status: 'active',
    },
    {
      id: 7,
      name: 'Xbox Game Pass',
      category: '게임',
      price: 12900,
      billingCycle: 'monthly',
      nextPayment: '2024-02-14',
      status: 'active',
    },
    {
      id: 8,
      name: 'AWS',
      category: '클라우드',
      price: 15000,
      billingCycle: 'monthly',
      nextPayment: '2024-02-28',
      status: 'active',
    },
    {
      id: 9,
      name: 'The New York Times',
      category: '뉴스/잡지',
      price: 5000,
      billingCycle: 'monthly',
      nextPayment: '2024-02-22',
      status: 'active',
    },
    {
      id: 10,
      name: 'Peloton',
      category: '피트니스',
      price: 39000,
      billingCycle: 'monthly',
      nextPayment: '2024-02-16',
      status: 'active',
    },
    {
      id: 11,
      name: 'Coursera Plus',
      category: '교육',
      price: 49000,
      billingCycle: 'monthly',
      nextPayment: '2024-02-19',
      status: 'active',
    },
  ];

  // userId 기반으로 랜덤하게 선택 (일관성 유지)
  const selectedCount = 5 + (seed % 5); // 5~9개 선택
  const selected = [];
  
  for (let i = 0; i < selectedCount; i++) {
    const index = (seed + i * 7) % allDummySubscriptions.length;
    if (!selected.find(s => s.id === allDummySubscriptions[index].id)) {
      selected.push(allDummySubscriptions[index]);
    }
  }

  return selected.length > 0 ? selected : allDummySubscriptions.slice(0, 5);
}

/**
 * Django API 연결 상태를 확인합니다.
 * 
 * @returns {Promise<boolean>} 연결 가능 여부
 */
export async function checkDjangoConnection() {
  try {
    const response = await fetch(`${DJANGO_API_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

