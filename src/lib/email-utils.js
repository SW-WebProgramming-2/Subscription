// 이메일 발송 유틸리티 함수
import { notificationAPI } from './api';

/**
 * 회원에게 이메일 알림 발송
 * @param {string} userId - 회원 ID
 * @param {string} subject - 이메일 제목
 * @param {string} message - 이메일 본문
 * @returns {Promise<Object>} 발송 결과
 */
export async function sendEmailToUser(userId, subject, message) {
  try {
    const result = await notificationAPI.sendEmailNotification(userId, subject, message);
    return {
      success: true,
      data: result,
      message: '이메일이 성공적으로 발송되었습니다.'
    };
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return {
      success: false,
      error: error.message || '이메일 발송에 실패했습니다.'
    };
  }
}

/**
 * 여러 회원에게 동시에 이메일 발송
 * @param {string[]} userIds - 회원 ID 배열
 * @param {string} subject - 이메일 제목
 * @param {string} message - 이메일 본문
 * @returns {Promise<Object>} 발송 결과
 */
export async function sendEmailToUsers(userIds, subject, message) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendEmailToUser(userId, subject, message))
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failCount = results.length - successCount;

  return {
    total: userIds.length,
    success: successCount,
    failed: failCount,
    results: results.map((r, i) => ({
      userId: userIds[i],
      ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message })
    }))
  };
}

