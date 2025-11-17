import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getRateLimitInfo,
  sanitizeInput,
  validateEnvironmentVariables,
  getClientIp,
  createSafeErrorMessage,
  sanitizeForLogging,
  enforceHttps,
  maskToken,
  encryptToken,
  serializeEncryptedToken,
  getSecurityHeaders,
  validateRequestSize,
  validateOrigin,
  auditLog,
  generateRequestId,
  isIpWhitelisted,
  isIpBlacklisted,
  detectSuspiciousActivity,
  validateTokenExpiry
} from '@/lib/security';
import { verifyAndGetState } from '../auth/route';

export async function POST(request) {
  const requestId = generateRequestId();
  let clientIp;
  
  try {
    // HTTPS 강제 (프로덕션)
    enforceHttps(request);
    
    // 클라이언트 IP 추출
    clientIp = getClientIp(request);
    
    // IP 블랙리스트/화이트리스트 검증
    if (isIpBlacklisted(clientIp) || !isIpWhitelisted(clientIp)) {
      auditLog('BLOCKED_IP_CALLBACK_ATTEMPT', { ip: clientIp, requestId });
      return NextResponse.json(
        { error: '접근이 거부되었습니다.' },
        { status: 403, headers: { ...getSecurityHeaders(), 'X-Request-Id': requestId } }
      );
    }
    
    // Origin 검증
    const origin = request.headers.get('origin');
    if (origin && !validateOrigin(origin)) {
      auditLog('INVALID_ORIGIN_CALLBACK_ATTEMPT', { ip: clientIp, origin, requestId });
      detectSuspiciousActivity(clientIp, false);
      return NextResponse.json(
        { error: '허용되지 않은 Origin입니다.' },
        { status: 403, headers: { ...getSecurityHeaders(), 'X-Request-Id': requestId } }
      );
    }
    
    // 요청 크기 검증
    const contentLength = request.headers.get('content-length');
    if (!validateRequestSize(contentLength, 10 * 1024)) {
      return NextResponse.json(
        { error: '요청 크기가 너무 큽니다.' },
        { status: 413, headers: getSecurityHeaders() }
      );
    }
    
    // Rate Limiting
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp, 3, 60000)) { // 1분에 3회 제한
      const rateLimitInfo = getRateLimitInfo(clientIp);
      return NextResponse.json(
        { 
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((rateLimitInfo?.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitInfo?.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0'
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

    // 입력 값 sanitization 및 검증
    const code = sanitizeInput(requestBody.code);
    const state = sanitizeInput(requestBody.state);

    if (!code || !state) {
      return NextResponse.json(
        { error: '인증 코드와 state가 필요합니다.' },
        { status: 400 }
      );
    }

    // State 검증 (CSRF 방지)
    const stateData = verifyAndGetState(state, clientIp);
    if (!stateData) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 인증 요청입니다.' },
        { status: 400 }
      );
    }

    const clientId = process.env.OPENBANKING_CLIENT_ID;
    const clientSecret = process.env.OPENBANKING_CLIENT_SECRET;
    
    // 리다이렉트 URI는 state에서 가져온 값 사용 (보안 강화)
    const redirectUri = stateData.redirectUri || 
      (process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/add/openbanking/callback`
        : process.env.OPENBANKING_REDIRECT_URI || 'https://subscription-production-2c3d.up.railway.app/add/openbanking/callback');

    // 액세스 토큰 교환
    const tokenResponse = await fetch('https://testapi.openbanking.or.kr/oauth/2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      
      // 안전한 로깅 (민감 정보 제거)
      console.error('액세스 토큰 교환 실패:', {
        status: tokenResponse.status,
        error: errorText.substring(0, 100) // 일부만 로깅
      });
      
      // 개발 환경에서는 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        const mockAccounts = [
          {
            accountId: '1234567890',
            accountName: 'KB국민은행 입출금통장',
            accountNumber: '123-456-789012',
            balance: 1000000,
            bankCode: '004'
          },
          {
            accountId: '0987654321',
            accountName: 'KB국민은행 적금통장',
            accountNumber: '098-765-432109',
            balance: 5000000,
            bankCode: '004'
          }
        ];

        return NextResponse.json({
          accounts: mockAccounts,
          accessToken: 'mock_access_token',
          userSeqNo: 'mock_user_seq_no'
        });
      }

      return NextResponse.json(
        { error: '인증 토큰 교환에 실패했습니다.' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const userSeqNo = tokenData.user_seq_no;

    // 토큰 검증
    if (!accessToken || !userSeqNo) {
      auditLog('TOKEN_EXCHANGE_FAILED', { ip: clientIp, requestId });
      detectSuspiciousActivity(clientIp, false);
      return NextResponse.json(
        { error: '인증 정보를 받아오지 못했습니다.' },
        { status: 401, headers: { ...getSecurityHeaders(), 'X-Request-Id': requestId } }
      );
    }

    // 토큰 만료 시간 검증
    if (!validateTokenExpiry(tokenData)) {
      auditLog('EXPIRED_TOKEN_ATTEMPT', { ip: clientIp, requestId });
      return NextResponse.json(
        { error: '만료된 인증 토큰입니다.' },
        { status: 401, headers: { ...getSecurityHeaders(), 'X-Request-Id': requestId } }
      );
    }

    // 계좌 목록 조회
    const accountsResponse = await fetch('https://testapi.openbanking.or.kr/v2.0/account/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_seq_no: userSeqNo,
        include_cancel_yn: 'N',
        sort_order: 'D'
      })
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('계좌 목록 조회 실패:', {
        status: accountsResponse.status,
        error: errorText.substring(0, 100)
      });
      
      return NextResponse.json(
        { error: '계좌 목록을 조회할 수 없습니다.' },
        { status: accountsResponse.status }
      );
    }

    const accountsData = await accountsResponse.json();
    
    // 계좌 정보 가공 및 검증
    const accounts = (accountsData.res_list || []).map(account => {
      const accountId = account.account_num || account.fintech_use_num;
      const accountNumber = account.account_num_masked || account.account_num;
      
      // 계좌 번호 마스킹 (보안)
      const maskedAccountNumber = accountNumber ? 
        accountNumber.replace(/(\d{3})-?(\d{3})-?(\d{4})(\d+)/, '$1-***-****$4') : 
        '***';
      
      return {
        accountId: accountId || '',
        accountName: account.account_name || account.account_holder_name || '',
        accountNumber: maskedAccountNumber,
        balance: parseInt(account.balance_amt || '0', 10),
        bankCode: account.bank_code_std || account.bank_code || stateData.bankCode
      };
    }).filter(account => account.accountId); // 유효한 계좌만 반환

    // 감사 로그 기록
    auditLog('ACCOUNTS_RETRIEVED', {
      ip: clientIp,
      accountCount: accounts.length,
      bankCode: stateData.bankCode,
      requestId
    });

    // 안전한 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('계좌 목록 조회 성공:', {
        accountCount: accounts.length,
        bankCode: stateData.bankCode,
        requestId
      });
    }

    // 성공 시 의심스러운 활동 카운트 감소
    detectSuspiciousActivity(clientIp, true);

    // 토큰 암호화 (환경 변수로 제어 가능)
    // ENCRYPT_TOKEN=true로 설정하면 토큰을 암호화하여 반환
    const shouldEncryptToken = process.env.ENCRYPT_TOKEN === 'true';
    let finalToken = accessToken;
    
    if (shouldEncryptToken) {
      try {
        const encrypted = encryptToken(accessToken);
        finalToken = serializeEncryptedToken(encrypted);
      } catch (encryptError) {
        console.error('토큰 암호화 실패:', encryptError);
        // 암호화 실패 시 개발 환경에서는 마스킹, 프로덕션에서는 에러
        if (process.env.NODE_ENV === 'development') {
          finalToken = maskToken(accessToken);
        } else {
          console.error('프로덕션 환경에서 토큰 암호화 실패');
          // 프로덕션에서는 암호화 실패 시 원본 토큰 반환하지 않음
          return NextResponse.json(
            { error: '토큰 처리 중 오류가 발생했습니다.' },
            { status: 500, headers: getSecurityHeaders() }
          );
        }
      }
    }

    return NextResponse.json({
      accounts,
      accessToken: finalToken, // 암호화 여부에 따라 다른 형식 반환
      userSeqNo,
      // 클라이언트가 암호화 여부를 알 수 있도록 플래그 추가 (선택사항)
      ...(shouldEncryptToken && { tokenEncrypted: true })
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
    console.error('오픈뱅킹 콜백 처리 오류:', errorMessage);
    
    // 에러 감사 로그
    auditLog('CALLBACK_ERROR', {
      ip: clientIp || 'unknown',
      requestId,
      error: error.message
    });
    
    if (clientIp) {
      detectSuspiciousActivity(clientIp, false);
    }
    
    // 개발 환경에서는 모의 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      const mockAccounts = [
        {
          accountId: '1234567890',
          accountName: 'KB국민은행 입출금통장',
          accountNumber: '123-***-****',
          balance: 1000000,
          bankCode: '004'
        }
      ];

      return NextResponse.json({
        accounts: mockAccounts,
        accessToken: 'mock_access_token'
      });
    }

    return NextResponse.json(
      createSafeErrorMessage(error, false),
      { status: 500 }
    );
  }
}

