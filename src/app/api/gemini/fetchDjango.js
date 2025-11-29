/**
 * (임시 구현) Next.js 내부 구독 저장소에서 구독 서비스 데이터를 가져오는 함수
 * 기존에는 Django 백엔드를 호출하도록 설계되어 있었지만,
 * 현재 구독 추가 기능은 Next.js 인메모리 저장소(`src/app/api/subscriptions/subscriptions.js`)를 사용하므로
 * 여기서 직접 그 데이터를 조회하도록 변경했습니다.
 *
 * 나중에 Django에 실제 구독 데이터가 쌓이면,
 * 이 파일만 Django 호출 방식으로 다시 수정하면 됩니다.
 */

import { getSubscriptionsByUserId } from '../subscriptions/subscriptions';

/**
 * 사용자의 구독 서비스 목록을 가져옵니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 구독 서비스 목록
 */
export async function fetchUserSubscriptions(userId) {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  try {
    const subscriptions = getSubscriptionsByUserId(userId);
    return subscriptions || [];
  } catch (error) {
    console.error('구독 서비스 데이터 조회 오류:', error);
    // 오류 발생 시에도 상위 로직이 안전하게 동작하도록 빈 배열 반환
    return [];
  }
}


