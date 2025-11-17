import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getRateLimitInfo,
  sanitizeInput,
  validateAccountId,
  validateDate,
  validateDateRange,
  getClientIp,
  createSafeErrorMessage,
  sanitizeForLogging,
  enforceHttps,
  maskToken,
  decryptToken,
  deserializeEncryptedToken,
  getSecurityHeaders,
  validateRequestSize,
  validateOrigin,
  generateSecureRandomString
} from '@/lib/security';

export async function POST(request) {
  try {
    // HTTPS 강제 (프로덕션)
    enforceHttps(request);
    
    // Origin 검증
    const origin = request.headers.get('origin');
    if (origin && !validateOrigin(origin)) {
      return NextResponse.json(
        { error: '허용되지 않은 Origin입니다.' },
        { status: 403, headers: getSecurityHeaders() }
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
    if (!checkRateLimit(clientIp, 20, 60000)) { // 1분에 20회 제한
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
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0'
          }
        }
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
    const accountId = sanitizeInput(requestBody.accountId);
    let accessToken = requestBody.accessToken; // 암호화된 토큰이므로 sanitizeInput 사용 안 함
    const userSeqNo = sanitizeInput(requestBody.userSeqNo);
    const bankCode = sanitizeInput(requestBody.bankCode);
    const startDate = sanitizeInput(requestBody.startDate);
    const endDate = sanitizeInput(requestBody.endDate);

    // 필수 필드 검증
    if (!accountId || !accessToken || !userSeqNo || !bankCode) {
      return NextResponse.json(
        { error: '계좌 정보와 인증 정보가 필요합니다.' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // 토큰 복호화 시도 (ENCRYPT_TOKEN이 활성화된 경우만)
    const shouldDecryptToken = process.env.ENCRYPT_TOKEN === 'true';
    if (shouldDecryptToken) {
      try {
        if (typeof accessToken === 'string' && accessToken.startsWith('{')) {
          // JSON 형식의 암호화된 토큰인 경우
          const encryptedData = deserializeEncryptedToken(accessToken);
          accessToken = decryptToken(encryptedData);
        }
        // 이미 복호화된 토큰이거나 일반 토큰인 경우 그대로 사용
      } catch (decryptError) {
        // 복호화 실패 시 개발 환경에서는 그대로 진행, 프로덕션에서는 에러
        if (process.env.NODE_ENV === 'production') {
          console.error('토큰 복호화 실패:', maskToken(accessToken));
          return NextResponse.json(
            { error: '유효하지 않은 인증 토큰입니다.' },
            { status: 401, headers: getSecurityHeaders() }
          );
        }
      }
    }

    // 계좌 ID 검증
    if (!validateAccountId(accountId)) {
      return NextResponse.json(
        { error: '유효하지 않은 계좌 ID입니다.' },
        { status: 400 }
      );
    }

    // 날짜 기본값 설정 및 검증
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const transactionStartDate = startDate || oneMonthAgo.toISOString().split('T')[0].replace(/-/g, '');
    const transactionEndDate = endDate || today.toISOString().split('T')[0].replace(/-/g, '');

    // 날짜 형식 검증
    if (!validateDate(transactionStartDate) || !validateDate(transactionEndDate)) {
      return NextResponse.json(
        { error: '유효하지 않은 날짜 형식입니다. (YYYYMMDD 형식 필요)' },
        { status: 400 }
      );
    }

    // 날짜 범위 검증 (최대 90일)
    if (!validateDateRange(transactionStartDate, transactionEndDate, 90)) {
      return NextResponse.json(
        { error: '조회 기간은 최대 90일까지 가능합니다.' },
        { status: 400 }
      );
    }

    // 오픈뱅킹 거래 내역 조회 API 호출
    // API 엔드포인트는 은행별로 다를 수 있음
    const transactionsResponse = await fetch('https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bank_tran_id: generateBankTranId(),
        fintech_use_num: accountId, // 계좌번호 또는 핀테크 이용번호
        inquiry_type: 'A', // A: 전체, I: 입금, O: 출금
        inquiry_base: 'D', // D: 일자, T: 시간
        from_date: transactionStartDate, // YYYYMMDD 형식
        to_date: transactionEndDate, // YYYYMMDD 형식
        sort_order: 'D', // D: 내림차순, A: 오름차순
        tran_dtime: '', // 거래일시 (선택)
        befor_inquiry_trace_info: '' // 이전 조회 추적정보 (선택)
      })
    });

    if (!transactionsResponse.ok) {
      const errorText = await transactionsResponse.text();
      
      // 안전한 로깅
      console.error('거래 내역 조회 실패:', {
        status: transactionsResponse.status,
        accountId: maskToken(accountId),
        error: errorText.substring(0, 100)
      });
      
      // 개발 환경에서는 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        const mockTransactions = [
          {
            tran_date: today.toISOString().split('T')[0].replace(/-/g, ''),
            tran_time: '120000',
            inout_type: '2',
            print_content: 'Netflix',
            tran_amt: '13500',
            after_balance_amt: '986500',
            branch_name: '인터넷뱅킹'
          },
          {
            tran_date: oneMonthAgo.toISOString().split('T')[0].replace(/-/g, ''),
            tran_time: '150000',
            inout_type: '2',
            print_content: 'Spotify',
            tran_amt: '10900',
            after_balance_amt: '1000000',
            branch_name: '인터넷뱅킹'
          }
        ];

        return NextResponse.json({
          transactions: mockTransactions,
          totalCount: mockTransactions.length
        });
      }

      return NextResponse.json(
        { error: '거래 내역을 조회할 수 없습니다.' },
        { status: transactionsResponse.status }
      );
    }

    const transactionsData = await transactionsResponse.json();
    
    // 거래 내역 정보 가공 및 sanitization
    const transactions = (transactionsData.res_list || []).map(transaction => {
      // 민감 정보 sanitization
      const description = sanitizeInput(transaction.print_content || transaction.tran_amt_content || '');
      const counterparty = sanitizeInput(transaction.account_holder_name || '');
      const branch = sanitizeInput(transaction.branch_name || '');
      
      return {
        date: transaction.tran_date || '',
        time: transaction.tran_time || '',
        type: transaction.inout_type === '1' ? '입금' : '출금',
        amount: parseInt(transaction.tran_amt || '0', 10),
        balance: parseInt(transaction.after_balance_amt || '0', 10),
        description: description.substring(0, 100), // 최대 길이 제한
        counterparty: counterparty.substring(0, 50),
        branch: branch.substring(0, 50)
      };
    });

    // 안전한 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('거래 내역 조회 성공:', {
        accountId: maskToken(accountId),
        transactionCount: transactions.length,
        dateRange: { start: transactionStartDate, end: transactionEndDate }
      });
    }

    return NextResponse.json({
      transactions,
      totalCount: transactions.length,
      startDate: transactionStartDate,
      endDate: transactionEndDate
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // 1분 캐시
        ...getSecurityHeaders()
      }
    });
  } catch (error) {
    console.error('거래 내역 조회 오류:', createSafeErrorMessage(error, process.env.NODE_ENV === 'development'));
    
    // 개발 환경에서는 모의 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      const mockTransactions = [
        {
          date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
          time: '120000',
          type: '출금',
          amount: 13500,
          balance: 986500,
          description: 'Netflix',
          counterparty: '',
          branch: '인터넷뱅킹'
        }
      ];

      return NextResponse.json({
        transactions: mockTransactions,
        totalCount: mockTransactions.length
      });
    }

    return NextResponse.json(
      createSafeErrorMessage(error, false),
      { status: 500 }
    );
  }
}

// 은행 거래 ID 생성 (보안 강화)
function generateBankTranId() {
  const random = generateSecureRandomString(10);
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `F${randomNum}${random}`;
}

