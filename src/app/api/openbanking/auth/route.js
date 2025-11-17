import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getRateLimitInfo,
  generateSecureRandomString,
  generateSecureState,
  sanitizeInput,
  validateBankCode,
  validateRedirectUri,
  validateEnvironmentVariables,
  getClientIp,
  createSafeErrorMessage,
  sanitizeForLogging,
  enforceHttps,
  getSecurityHeaders,
  validateRequestSize,
  validateOrigin,
  auditLog,
  generateRequestId,
  isIpWhitelisted,
  isIpBlacklisted,
  detectSuspiciousActivity
} from '@/lib/security';

// State 저장소 (프로덕션에서는 Redis 사용 권장)
const stateStore = new Map();

export async function POST(request) {
  const requestId = generateRequestId();
  let clientIp;
  
  try {
    // HTTPS 강제 (프로덕션)
    enforceHttps(request);
    
    // 클라이언트 IP 추출
    clientIp = getClientIp(request);
    
    // IP 블랙리스트 검증
    if (isIpBlacklisted(clientIp)) {
      auditLog('BLACKLISTED_IP_ACCESS_ATTEMPT', { ip: clientIp, requestId });
      return NextResponse.json(
        { error: '접근이 거부되었습니다.' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }
    
    // IP 화이트리스트 검증 (설정된 경우)
    if (!isIpWhitelisted(clientIp)) {
      auditLog('NON_WHITELISTED_IP_ACCESS_ATTEMPT', { ip: clientIp, requestId });
      return NextResponse.json(
        { error: '접근이 거부되었습니다.' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }
    
    // Origin 검증
    const origin = request.headers.get('origin');
    if (origin && !validateOrigin(origin)) {
      auditLog('INVALID_ORIGIN_ACCESS_ATTEMPT', { ip: clientIp, origin, requestId });
      detectSuspiciousActivity(clientIp, false);
      return NextResponse.json(
        { error: '허용되지 않은 Origin입니다.' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }
    
    // 요청 크기 검증
    const contentLength = request.headers.get('content-length');
    if (!validateRequestSize(contentLength, 10 * 1024)) { // 10KB 제한
      auditLog('OVERSIZED_REQUEST_ATTEMPT', { ip: clientIp, size: contentLength, requestId });
      return NextResponse.json(
        { error: '요청 크기가 너무 큽니다.' },
        { status: 413, headers: getSecurityHeaders() }
      );
    }
    
    // Rate Limiting
    if (!checkRateLimit(clientIp, 5, 60000)) { // 1분에 5회 제한
      const rateLimitInfo = getRateLimitInfo(clientIp);
      auditLog('RATE_LIMIT_EXCEEDED', { ip: clientIp, requestId });
      detectSuspiciousActivity(clientIp, false);
      return NextResponse.json(
        { 
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((rateLimitInfo?.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitInfo?.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitInfo?.resetTime),
            'X-Request-Id': requestId
          }
        }
      );
    }

    // 환경 변수 검증
    try {
      validateEnvironmentVariables();
    } catch (envError) {
      console.error('환경 변수 검증 실패:', envError.message);
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 요청 본문 파싱
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: '요청 본문을 파싱할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 입력 값 sanitization
    const bankCode = sanitizeInput(requestBody.bankCode);
    const redirectUri = sanitizeInput(requestBody.redirectUri);

    // 입력 검증
    if (!bankCode || !redirectUri) {
      return NextResponse.json(
        { error: '은행 코드와 리다이렉트 URI가 필요합니다.' },
        { status: 400 }
      );
    }

    // 은행 코드 검증
    if (!validateBankCode(bankCode)) {
      return NextResponse.json(
        { error: '유효하지 않은 은행 코드입니다.' },
        { status: 400 }
      );
    }

    // 리다이렉트 URI 검증
    if (!validateRedirectUri(redirectUri)) {
      return NextResponse.json(
        { error: '유효하지 않은 리다이렉트 URI입니다.' },
        { status: 400 }
      );
    }

    const clientId = process.env.OPENBANKING_CLIENT_ID;
    const clientSecret = process.env.OPENBANKING_CLIENT_SECRET;
    
    // 안전한 state 생성 (CSRF 방지)
    const stateValue = generateSecureRandomString(32);
    const stateSecret = clientSecret || process.env.STATE_SECRET || 'default-secret-change-in-production';
    const stateSignature = generateSecureState(stateSecret, stateValue);
    const state = `${stateValue}.${stateSignature}`;
    
    // State를 저장 (만료 시간: 10분)
    const stateExpiry = Date.now() + 10 * 60 * 1000;
    stateStore.set(stateValue, {
      redirectUri,
      bankCode,
      expiry: stateExpiry,
      ip: clientIp
    });
    
    // bank_tran_id 생성 (오픈뱅킹 API 요구사항: 고유한 거래번호)
    const bankTranId = generateBankTranId();
    
    // 오픈뱅킹 인증 URL 생성
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'login inquiry transfer',
      state: state,
      auth_type: '0',
      bank_tran_id: bankTranId,
      bank_code_std: bankCode
    });
    
    const authUrl = `https://testapi.openbanking.or.kr/oauth/2.0/authorize?${params.toString()}`;

    // 감사 로그 기록
    auditLog('AUTH_URL_GENERATED', {
      ip: clientIp,
      bankCode,
      requestId
    });

    // 안전한 로깅 (민감 정보 제거)
    if (process.env.NODE_ENV === 'development') {
      console.log('오픈뱅킹 인증 URL 생성:', sanitizeForLogging({
        bankCode,
        redirectUri: redirectUri.substring(0, 50) + '...',
        bankTranId,
        requestId
      }));
    }

    // 성공 시 의심스러운 활동 카운트 감소
    detectSuspiciousActivity(clientIp, true);

    return NextResponse.json({
      authUrl,
      state
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Request-Id': requestId,
        ...getSecurityHeaders()
      }
    });
  } catch (error) {
    const errorMessage = createSafeErrorMessage(error, process.env.NODE_ENV === 'development');
    console.error('오픈뱅킹 인증 URL 생성 오류:', errorMessage);
    
    // 에러 감사 로그
    auditLog('AUTH_ERROR', {
      ip: clientIp || 'unknown',
      requestId,
      error: error.message
    });
    
    if (clientIp) {
      detectSuspiciousActivity(clientIp, false);
    }
    
    return NextResponse.json(
      errorMessage,
      { 
        status: 500,
        headers: {
          'X-Request-Id': requestId,
          ...getSecurityHeaders()
        }
      }
    );
  }
}

// State 검증 함수 (다른 파일에서 사용)
export function verifyAndGetState(state, clientIp) {
  if (!state || typeof state !== 'string') {
    return null;
  }
  
  const [stateValue, signature] = state.split('.');
  if (!stateValue || !signature) {
    return null;
  }
  
  const stateData = stateStore.get(stateValue);
  if (!stateData) {
    return null;
  }
  
  // 만료 확인
  if (Date.now() > stateData.expiry) {
    stateStore.delete(stateValue);
    return null;
  }
  
  // IP 주소 확인 (추가 보안)
  if (stateData.ip !== clientIp && clientIp !== 'unknown') {
    console.warn('State IP 불일치:', { stored: stateData.ip, current: clientIp });
    // IP가 다르더라도 계속 진행 (프록시 환경 고려)
  }
  
  // State 검증
  const stateSecret = process.env.OPENBANKING_CLIENT_SECRET || process.env.STATE_SECRET || 'default-secret-change-in-production';
  const expectedSignature = generateSecureState(stateSecret, stateValue);
  
  if (signature !== expectedSignature) {
    return null;
  }
  
  // 사용된 state는 삭제 (재사용 방지)
  stateStore.delete(stateValue);
  
  return stateData;
}

// 은행 거래 ID 생성 (오픈뱅킹 API 요구사항)
function generateBankTranId() {
  const random = generateSecureRandomString(10);
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `F${randomNum}${random}`;
}

// 만료된 state 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of stateStore.entries()) {
    if (now > data.expiry) {
      stateStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5분마다 정리

