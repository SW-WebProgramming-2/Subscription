/**
 * Gemini API 컨트롤러
 * 요청을 처리하고 각 서비스 함수를 조합하여 최종 응답을 생성합니다.
 */

import { fetchUserSubscriptions } from './fetchDjango.js';
import { generateSummary, generateQnAAnswer, generateQnAAnswerWithHistory, parseRecommendationsFromResponse } from './service.js';
import { convertToPieChartData } from './analyzeCategories.js';
import { recommendSubscriptions } from './recommend.js';

/**
 * 사용자 요청을 처리하고 통합 응답을 생성합니다.
 * 
 * @param {string} text - 사용자가 입력한 텍스트 (요약용 또는 질문)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 통합 응답 객체
 */
export async function processGeminiRequest(text, userId) {
  try {
    // 1. Django에서 사용자 구독 서비스 데이터 가져오기
    const subscriptions = await fetchUserSubscriptions(userId);

    // 2. Gemini를 사용하여 요약 생성
    let summary = '';
    try {
      summary = await generateSummary(subscriptions);
    } catch (error) {
      console.error('요약 생성 오류:', error);
      summary = `현재 ${subscriptions.length}개의 구독 서비스를 이용 중입니다.`;
    }

    // 3. Gemini를 사용하여 QnA 답변 생성
    let qnaAnswer = '';
    if (text && text.trim().length > 0) {
      try {
        qnaAnswer = await generateQnAAnswer(text, subscriptions);
      } catch (error) {
        console.error('QnA 답변 생성 오류:', error);
        qnaAnswer = 'controller : 죄송합니다. 질문에 대한 답변을 생성하는 중 오류가 발생했습니다.';
      }
    } else {
      qnaAnswer = '질문을 입력해주시면 답변해드리겠습니다.';
    }

    // 4. 카테고리 분석 및 파이 차트 데이터 생성
    const categories = convertToPieChartData(subscriptions);

    // 5. AI 기반 추천 서비스 생성
    let recommendations = [];
    try {
      recommendations = await recommendSubscriptions(subscriptions, {
        maxRecommendations: 5,
      });
    } catch (error) {
      console.error('추천 서비스 생성 오류:', error);
      recommendations = [];
    }

    // 6. 통합 응답 객체 생성
    return {
      success: true,
      summary: summary,
      qnaAnswer: qnaAnswer,
      categories: categories,
      recommendations: recommendations,
      subscriptionCount: subscriptions.length,
      totalMonthlyPrice: subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0),
    };
  } catch (error) {
    console.error('Gemini 요청 처리 오류:', error);
    
    // 오류 발생 시 기본 응답 반환
    return {
      success: false,
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      summary: '구독 서비스 데이터를 불러오는 중 오류가 발생했습니다.',
      qnaAnswer: '질문에 대한 답변을 생성하는 중 오류가 발생했습니다.',
      categories: [],
      recommendations: [],
      subscriptionCount: 0,
      totalMonthlyPrice: 0,
    };
  }
}

/**
 * 요청 유효성 검사
 * 
 * @param {string} text - 사용자 입력 텍스트
 * @param {string} userId - 사용자 ID
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateRequest(text, userId) {
  if (!userId || userId.trim().length === 0) {
    return {
      valid: false,
      error: '사용자 ID가 필요합니다.',
    };
  }

  // text는 선택사항이므로 검증하지 않음
  // text가 없어도 요약과 추천은 제공 가능

  return {
    valid: true,
  };
}

/**
 * QnA 요청을 처리하고 대화 기반 답변 및 추천을 생성합니다.
 * 
 * @param {string} question - 사용자 질문
 * @param {string} userId - 사용자 ID
 * @param {Array} conversationHistory - 대화 히스토리 [{ role: 'user'|'model', text: string }]
 * @returns {Promise<Object>} QnA 응답 객체
 */
export async function processQnARequest(question, userId, conversationHistory = []) {
  try {
    // 1. Django에서 사용자 구독 서비스 데이터 가져오기 (컨텍스트 제공용)
    const subscriptions = await fetchUserSubscriptions(userId);

    // 2. 대화 히스토리를 포함하여 QnA 답변 생성
    let answer = '';
    try {
      answer = await generateQnAAnswerWithHistory(question, subscriptions, conversationHistory);
    } catch (error) {
      console.error('QnA 답변 생성 오류:', error);
      answer = 'controller process : 죄송합니다. 질문에 대한 답변을 생성하는 중 오류가 발생했습니다.';
    }
    //answer = await generateQnAAnswerWithHistory(question, subscriptions, conversationHistory);
    //onsole.error("QnA detailed error :  ", error);

    // 3. 답변에서 추천 서비스 파싱
    let recommendations = [];
    try {
      recommendations = parseRecommendationsFromResponse(answer);
    } catch (error) {
      console.error('추천 서비스 파싱 오류:', error);
      recommendations = [];
    }

    // 4. 응답 객체 생성
    return {
      success: true,
      answer: answer,
      recommendations: recommendations,
    };
  } catch (error) {
    console.error('QnA 요청 처리 오류:', error);
    
    // 오류 발생 시 기본 응답 반환
    return {
      success: false,
      error: error.message || '알 수 없는 오류가 발생했습니다.',
      answer: '죄송합니다. 질문에 대한 답변을 생성하는 중 오류가 발생했습니다.',
      recommendations: [],
    };
  }
}

/**
 * QnA 요청 유효성 검사
 * 
 * @param {string} question - 사용자 질문
 * @param {string} userId - 사용자 ID
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateQnARequest(question, userId) {
  if (!userId || userId.trim().length === 0) {
    return {
      valid: false,
      error: '사용자 ID가 필요합니다.',
    };
  }

  if (!question || question.trim().length === 0) {
    return {
      valid: false,
      error: '질문을 입력해주세요.',
    };
  }

  return {
    valid: true,
  };
}

