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
    const clientId = process.env.OPENBANKING_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'OPENBANKING_CLIENT_ID 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    // bank_tran_id 생성 (오픈뱅킹 API 요구사항: 고유한 거래번호)
    const bankTranId = generateBankTranId();
    
    // 오픈뱅킹 인증 URL 생성
    // 오픈뱅킹 API 스펙에 맞게 파라미터 구성
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'login inquiry transfer', // 공백으로 구분된 scope
      state: state,
      auth_type: '0', // 최초인증
      bank_tran_id: bankTranId,
      bank_code_std: bankCode
    });
    
    const authUrl = `https://testapi.openbanking.or.kr/oauth/2.0/authorize?${params.toString()}`;

    // 디버깅용 로그 (프로덕션에서는 제거)
    console.log('오픈뱅킹 인증 URL 생성:', {
      clientId: clientId.substring(0, 10) + '...', // 일부만 표시
      redirectUri,
      bankCode,
      bankTranId,
      state: state.substring(0, 10) + '...'
    });

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
// 형식: F{숫자9자리}{랜덤문자10자리} 또는 M{숫자9자리}U{타임스탬프}{랜덤문자9자리}
function generateBankTranId() {
  const timestamp = Date.now();
  const random = generateRandomString(10);
  // 오픈뱅킹 API 요구 형식: 최대 20자, 영문자와 숫자 조합
  // 형식: F{9자리숫자}{10자리랜덤문자}
  const randomNum = Math.floor(100000000 + Math.random() * 900000000); // 9자리 숫자
  return `F${randomNum}${random}`;
}

