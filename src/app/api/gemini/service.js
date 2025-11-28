/**
 * Gemini API 호출 서비스
 * Google Gemini 2.5 Pro API를 사용하여 텍스트 요약 및 QnA 기능 제공
 */
import api from "../../../lib/api";

//const MODEL_NAME = "gemini-1.5-flash";
//const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

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
  } else if (promptType === 'recommend') {
    // recommend 타입은 프롬프트가 이미 완성되어 전달되므로 그대로 사용
    systemPrompt = text;
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

    // Gemini API 응답 구조 파싱 (optional chaining 사용)
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
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

/**
 * 대화 히스토리를 포함하여 QnA 답변을 생성합니다.
 *
 * @param {string} question - 사용자 질문
 * @param {Array} subscriptions - 사용자의 구독 서비스 목록 (컨텍스트 제공용)
 * @param {Array} conversationHistory - 대화 히스토리 [{ role: 'user'|'model', text: string }]
 * @returns {Promise<string>} 답변 텍스트
 */
export async function generateQnAAnswerWithHistory(question, subscriptions = [], conversationHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  if (!question || question.trim().length === 0) {
    return '질문을 입력해주세요.';
  }

  // 구독 서비스 정보를 컨텍스트로 추가
  let contextText = '';
  if (subscriptions && subscriptions.length > 0) {
    const subscriptionList = subscriptions
      .map((sub) => `- ${sub.name || '알 수 없음'} (${sub.category || '기타'}) - 월 ${sub.price || 0}원`)
      .join('\n');
    contextText = `\n\n현재 구독 중인 서비스:\n${subscriptionList}`;
  }

  // 시스템 프롬프트 구성
  const systemPrompt = `당신은 구독 서비스 관리 전문가입니다. 사용자의 질문에 대해 친절하고 정확하게 답변해주세요.
구독 서비스 관련 질문에 대해 실용적이고 도움이 되는 답변을 제공해주세요.

중요: 답변 중에 구독 서비스를 추천할 때는 반드시 답변 텍스트 끝에 다음 형식으로 JSON을 포함해주세요:

\`\`\`json
{
  "recommendations": [
    {
      "name": "서비스 이름",
      "description": "서비스에 대한 간단한 설명",
      "category": "카테고리명",
      "price": 월구독료숫자
    }
  ]
}
\`\`\`

카테고리는 다음 중 하나여야 합니다: 스트리밍, 음악, 소프트웨어, 게임, 클라우드, 뉴스/잡지, 피트니스, 교육, 기타
price는 숫자만 입력하세요 (예: 13500, 9900)
추천할 서비스가 없으면 recommendations 배열을 빈 배열 []로 두세요.
JSON은 반드시 \`\`\`json으로 시작하고 \`\`\`로 끝나야 합니다.`;

  // 대화 히스토리를 Gemini API 형식으로 변환
  const contents = [];

  // 시스템 프롬프트를 첫 메시지로 추가
  contents.push({
    role: 'user',
    parts: [{ text: systemPrompt + contextText }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: '알겠습니다. 구독 서비스 관련 질문에 대해 도움을 드리겠습니다.' }]
  });

  // 대화 히스토리 추가
  conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'model') {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
  });

  // 현재 질문 추가
  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response || response.status < 200 || response.status >= 300) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: '응답을 파싱할 수 없습니다.' };
      }
      throw new Error(
        `Gemini API 호출 실패: ${response?.status || 'Unknown'} ${response?.statusText || 'Unknown'}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Gemini API 응답 구조 파싱 (optional chaining 사용)
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    //const content =
    //    data?.candidates?.[0]?.content?.[0]?.text ||   // 기존 방식
    //    data?.candidates?.[0]?.output?.[0]?.content?.[0]?.text || // 새 구조 대응
    //    data?.messages?.[0]?.content?.[0]?.text; // 혹시 messages 배열일 경우

      if (content) {
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
 * Gemini 응답에서 추천 서비스를 파싱합니다.
 *
 * @param {string} responseText - Gemini API 응답 텍스트
 * @returns {Array} 추천 서비스 목록
 */
export function parseRecommendationsFromResponse(responseText) {
  if (!responseText || responseText.trim().length === 0) {
    return [];
  }

  try {
    // JSON 블록 찾기 (```json ... ``` 형식 우선)
    let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      // ```json이 없으면 일반 JSON 객체 찾기
      jsonMatch = responseText.match(/\{[\s\S]*?"recommendations"[\s\S]*?\}/);
    }

    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      let parsed;

      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        // JSON 파싱 실패 시 정리 후 재시도
        const cleanedJson = jsonText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        parsed = JSON.parse(cleanedJson);
      }

      if (parsed && parsed.recommendations && Array.isArray(parsed.recommendations)) {
        // 유효성 검사 및 정규화
        const validRecommendations = parsed.recommendations
          .filter(rec => {
            // 필수 필드 검증
            return rec &&
                   rec.name &&
                   typeof rec.name === 'string' &&
                   rec.name.trim().length > 0 &&
                   rec.category &&
                   typeof rec.category === 'string' &&
                   (typeof rec.price === 'number' || typeof rec.price === 'string');
          })
          .map(rec => {
            // 가격 정규화
            let price = 0;
            if (typeof rec.price === 'number') {
              price = Math.max(0, rec.price);
            } else if (typeof rec.price === 'string') {
              // 문자열에서 숫자 추출 (예: "13,500원" -> 13500)
              const priceMatch = rec.price.match(/(\d{1,3}(?:,\d{3})*)/);
              if (priceMatch) {
                price = parseInt(priceMatch[1].replace(/,/g, ''));
              }
            }

            // 카테고리 정규화
            const validCategories = ['스트리밍', '음악', '소프트웨어', '게임', '클라우드', '뉴스/잡지', '피트니스', '교육', '기타'];
            let category = rec.category.trim();
            if (!validCategories.includes(category)) {
              // 유사 카테고리 찾기
              const found = validCategories.find(cat => category.includes(cat) || cat.includes(category));
              category = found || '기타';
            }

            return {
              name: rec.name.trim(),
              description: (rec.description || '').trim(),
              category: category,
              price: price
            };
          });

        return validRecommendations;
      }
    }

    // JSON 형식이 없으면 빈 배열 반환 (텍스트 파싱은 정확도가 낮아 제거)
    return [];
  } catch (error) {
    console.error('추천 서비스 파싱 오류:', error);
    return [];
  }
}

