import { NextResponse } from 'next/server';
import { processGeminiRequest, validateRequest } from './controller.js';

/**
 * POST /api/gemini
 * Gemini AI를 사용한 구독 서비스 분석, 요약, QnA, 추천 기능 제공
 * 
 * Request Body:
 * {
 *   text: string (optional) - 사용자 질문 또는 요약 요청 텍스트
 *   userId: string (required) - 사용자 ID
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   summary: string - 구독 서비스 요약
 *   qnaAnswer: string - 질문에 대한 답변
 *   categories: Array - 파이 차트 데이터
 *   recommendations: Array - 추천 구독 서비스 목록
 *   subscriptionCount: number - 구독 서비스 개수
 *   totalMonthlyPrice: number - 월간 총 비용
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

    const { text, userId } = requestBody;

    // 요청 유효성 검사
    const validation = validateRequest(text, userId);
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
      // API 키가 없어도 더미 데이터는 반환 가능
    }

    // 요청 처리
    const result = await processGeminiRequest(text || '', userId);

    // 성공 응답
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Gemini API 엔드포인트 오류:', error);

    // 오류 응답
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        summary: '구독 서비스 데이터를 처리하는 중 오류가 발생했습니다.',
        qnaAnswer: '질문에 대한 답변을 생성하는 중 오류가 발생했습니다.',
        categories: [],
        recommendations: [],
        subscriptionCount: 0,
        totalMonthlyPrice: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gemini
 * API 사용법 및 정보 제공
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'Gemini AI 구독 서비스 분석 API',
      description: 'POST 요청을 통해 구독 서비스 분석, 요약, QnA, 추천 기능을 사용할 수 있습니다.',
      usage: {
        method: 'POST',
        endpoint: '/api/gemini',
        body: {
          text: 'string (optional) - 사용자 질문 또는 요약 요청 텍스트',
          userId: 'string (required) - 사용자 ID',
        },
        response: {
          success: 'boolean',
          summary: 'string - 구독 서비스 요약',
          qnaAnswer: 'string - 질문에 대한 답변',
          categories: 'Array - 파이 차트 데이터',
          recommendations: 'Array - 추천 구독 서비스 목록',
          subscriptionCount: 'number - 구독 서비스 개수',
          totalMonthlyPrice: 'number - 월간 총 비용',
        },
      },
    },
    { status: 200 }
  );
}

