// 구독 정보 데이터 저장소 (공통 모듈)
// 실제로는 데이터베이스로 교체 필요

// Next.js 서버리스 환경에서 모듈이 재로드될 수 있으므로 전역 변수 사용
// Node.js의 global 객체를 사용하여 데이터 유지
if (!global.subscriptions) {
  global.subscriptions = [];
}

const subscriptions = global.subscriptions;

export function addSubscription(subscription) {
  const newSubscription = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...subscription,
    createdAt: new Date().toISOString()
  };
  subscriptions.push(newSubscription);
  return newSubscription;
}

export function getSubscriptionsByUserId(userId) {
  // userId로 필터링하여 해당 사용자의 구독만 반환
  return subscriptions.filter(sub => String(sub.userId) === String(userId));
}

export function getSubscriptionById(id) {
  return subscriptions.find(sub => String(sub.id) === String(id));
}

export function getAllSubscriptions() {
  return subscriptions;
}

export function updateSubscriptionById(id, updates) {
  const index = subscriptions.findIndex(sub => String(sub.id) === String(id));
  if (index !== -1) {
    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return subscriptions[index];
  }
  return null;
}

export function deleteSubscriptionById(id) {
  const index = subscriptions.findIndex(sub => String(sub.id) === String(id));
  if (index !== -1) {
    subscriptions.splice(index, 1);
    return true;
  }
  return false;
}

// 특정 사용자의 모든 구독 정보(오픈뱅킹 정보 포함) 삭제
export function deleteSubscriptionsByUserId(userId) {
  const initialLength = global.subscriptions.length;
  // 필터링하여 해당 사용자의 구독 제거
  const filtered = global.subscriptions.filter(
    sub => String(sub.userId) !== String(userId)
  );
  global.subscriptions = filtered;
  const finalLength = global.subscriptions.length;
  const deleted = finalLength < initialLength;
  return deleted;
}

