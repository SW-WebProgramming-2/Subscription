import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { bankCode, redirectUri } = await request.json();

    if (!bankCode || !redirectUri) {
      return NextResponse.json(
        { error: '은행 코드와 리다이렉트 URI가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 오픈뱅킹 API 연동
    // 한국금융결제원 오픈뱅킹 API 사용 시:
    // 1. Client ID, Client Secret 필요
    // 2. 오픈뱅킹 인증 URL 생성
    // 3. state 파라미터 생성 (CSRF 방지)

    const state = generateRandomString(32);
    const clientId = process.env.OPENBANKING_CLIENT_ID || 'test_client_id';
    
    // 오픈뱅킹 인증 URL 생성
    // 실제 구현 시 한국금융결제원 오픈뱅킹 API 엔드포인트 사용
    const authUrl = `https://testapi.openbanking.or.kr/oauth/2.0/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=login inquiry transfer&` +
      `state=${state}&` +
      `auth_type=0&` +
      `bank_tran_id=${generateBankTranId()}&` +
      `bank_code_std=${bankCode}`;

    // state를 세션에 저장 (실제로는 Redis 등 사용)
    // 여기서는 간단히 응답에 포함

    return NextResponse.json({
      authUrl,
      state
    });
  } catch (error) {
    console.error('오픈뱅킹 인증 URL 생성 오류:', error);
    return NextResponse.json(
      { error: '오픈뱅킹 인증 URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 랜덤 문자열 생성 (state, bank_tran_id용)
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 은행 거래 ID 생성 (오픈뱅킹 API 요구사항)
function generateBankTranId() {
  const timestamp = Date.now();
  const random = generateRandomString(9);
  return `M202400000U${timestamp}${random}`;
}

