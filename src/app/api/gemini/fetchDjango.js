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


  } catch (error) {
    console.error('Django API 호출 오류:', error);
    
    console.warn('Django API 호출 실패');
  }
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

