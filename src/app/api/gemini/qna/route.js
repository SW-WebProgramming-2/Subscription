import { NextResponse } from 'next/server';
import { processQnARequest, validateQnARequest } from '../controller.js';

/**
 * POST /api/gemini/qna
 * Gemini AI를 사용한 QnA 기능 제공 (대화 기반)
 * 
 * Request Body:
 * {
 *   question: string (required) - 사용자 질문
 *   userId: string (required) - 사용자 ID
 *   conversationHistory: Array (optional) - 대화 히스토리 [{ role: 'user'|'model', text: string }]
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   answer: string - AI 답변
 *   recommendations: Array - 대화에서 추출된 추천 구독 서비스 목록
 * }
 */
export async function POST(request) {
  try {
    // 요청 본문 파싱
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: '요청 본문을 파싱할 수 없습니다.',
          details: error.message,
        },
        { status: 400 }
      );
    }

    const { question, userId, conversationHistory } = requestBody;

    // 요청 유효성 검사
    const validation = validateQnARequest(question, userId);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Gemini API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    // QnA 요청 처리
    const result = await processQnARequest(question, userId, conversationHistory || []);

    // 성공 응답
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('QnA API 엔드포인트 오류:', error);

    // 오류 응답
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        answer: '죄송합니다. 질문에 대한 답변을 생성하는 중 오류가 발생했습니다.',
        recommendations: [],
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gemini/qna
 * API 사용법 및 정보 제공
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'Gemini AI QnA API',
      description: 'POST 요청을 통해 구독 서비스 관련 질문에 대한 답변을 받을 수 있습니다.',
      usage: {
        method: 'POST',
        endpoint: '/api/gemini/qna',
        body: {
          question: 'string (required) - 사용자 질문',
          userId: 'string (required) - 사용자 ID',
          conversationHistory: 'Array (optional) - 대화 히스토리',
        },
        response: {
          success: 'boolean',
          answer: 'string - AI 답변',
          recommendations: 'Array - 추천 구독 서비스 목록',
        },
      },
    },
    { status: 200 }
  );
}

