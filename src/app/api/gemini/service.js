/**
 * Gemini API 호출 서비스
 * Google Gemini 2.5 Pro API를 사용하여 텍스트 요약 및 QnA 기능 제공
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Gemini API를 호출하여 텍스트를 분석하고 응답을 생성합니다.
 * 
 * @param {string} text - 사용자가 입력한 텍스트
 * @param {string} promptType - 'summary' 또는 'qna'
 * @returns {Promise<string>} Gemini API 응답 텍스트
 */
export async function callGeminiAPI(text, promptType = 'summary') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('입력 텍스트가 필요합니다.');
  }

  // 프롬프트 타입에 따라 다른 시스템 프롬프트 사용
  let systemPrompt = '';
  
  if (promptType === 'summary') {
    systemPrompt = `당신은 구독 서비스 관리 전문가입니다. 사용자의 구독 서비스 목록을 분석하고 요약해주세요.
다음 정보를 포함하여 간결하고 유용한 요약을 제공해주세요:
- 전체 구독 서비스 개수
- 주요 카테고리 분포
- 월간 총 비용
- 개선 제안사항

사용자 구독 정보:
${text}`;
  } else if (promptType === 'qna') {
    systemPrompt = `당신은 구독 서비스 관리 전문가입니다. 사용자의 질문에 대해 친절하고 정확하게 답변해주세요.
구독 서비스 관련 질문에 대해 실용적이고 도움이 되는 답변을 제공해주세요.

사용자 질문:
${text}`;
  } else {
    systemPrompt = text;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API 호출 실패: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Gemini API 응답 구조 파싱
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      return content.trim();
    } else {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    
    // 네트워크 오류나 기타 오류 처리
    if (error.message.includes('fetch')) {
      throw new Error('Gemini API 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    }
    
    throw error;
  }
}

/**
 * 구독 서비스 목록을 기반으로 요약을 생성합니다.
 * 
 * @param {Array} subscriptions - 구독 서비스 목록
 * @returns {Promise<string>} 요약 텍스트
 */
export async function generateSummary(subscriptions) {
  if (!subscriptions || subscriptions.length === 0) {
    return '현재 구독 중인 서비스가 없습니다.';
  }

  // 구독 서비스 정보를 텍스트로 변환
  const subscriptionText = subscriptions
    .map((sub, index) => {
      return `${index + 1}. ${sub.name || '알 수 없음'} (${sub.category || '기타'}) - 월 ${sub.price || 0}원`;
    })
    .join('\n');

  const totalPrice = subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0);
  const text = `구독 서비스 목록:\n${subscriptionText}\n\n월간 총 비용: ${totalPrice}원`;

  return await callGeminiAPI(text, 'summary');
}

/**
 * 사용자의 질문에 대한 답변을 생성합니다.
 * 
 * @param {string} question - 사용자 질문
 * @param {Array} subscriptions - 사용자의 구독 서비스 목록 (컨텍스트 제공용)
 * @returns {Promise<string>} 답변 텍스트
 */
export async function generateQnAAnswer(question, subscriptions = []) {
  if (!question || question.trim().length === 0) {
    return '질문을 입력해주세요.';
  }

  // 구독 서비스 정보를 컨텍스트로 추가
  let contextText = '';
  if (subscriptions && subscriptions.length > 0) {
    const subscriptionList = subscriptions
      .map((sub) => `- ${sub.name || '알 수 없음'} (${sub.category || '기타'})`)
      .join('\n');
    contextText = `\n\n현재 구독 중인 서비스:\n${subscriptionList}`;
  }

  const fullQuestion = `${question}${contextText}`;
  return await callGeminiAPI(fullQuestion, 'qna');
}

