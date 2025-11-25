import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json(
        { error: '인증 코드와 state가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 오픈뱅킹 API 연동
    // 1. 인증 코드로 액세스 토큰 교환
    // 2. 액세스 토큰으로 계좌 목록 조회
    // 3. 계좌 정보 반환

    const clientId = process.env.OPENBANKING_CLIENT_ID;
    const clientSecret = process.env.OPENBANKING_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('오픈뱅킹 인증 정보 누락:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      return NextResponse.json(
        { 
          error: '오픈뱅킹 인증 정보가 설정되지 않았습니다.',
          message: 'OPENBANKING_CLIENT_ID와 OPENBANKING_CLIENT_SECRET 환경 변수를 확인해주세요.'
        },
        { status: 500 }
      );
    }
    
    // 프로덕션 URL을 콜백 URL로 사용 (금융 API는 localhost를 허용하지 않음)
    const redirectUri = process.env.OPENBANKING_REDIRECT_URI 
      || (process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/add/openbanking/callback`
        : 'https://subscription-production-2c3d.up.railway.app/add/openbanking/callback');
    
    console.log('오픈뱅킹 콜백 처리 시작:', {
      hasCode: !!code,
      hasState: !!state,
      redirectUri: redirectUri,
      clientIdPrefix: clientId.substring(0, 10) + '...'
    });

    // 액세스 토큰 교환
    const tokenParams = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    console.log('토큰 교환 요청 파라미터:', {
      code: code.substring(0, 10) + '...',
      client_id: clientId.substring(0, 10) + '...',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://testapi.openbanking.or.kr/oauth/2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams
    });

    if (!tokenResponse.ok) {
      let errorText = '';
      let errorJson = null;
      
      try {
        errorText = await tokenResponse.text();
        console.error('액세스 토큰 교환 실패 (텍스트):', errorText);
        
        // JSON 파싱 시도
        try {
          errorJson = JSON.parse(errorText);
          console.error('액세스 토큰 교환 실패 (JSON):', errorJson);
        } catch (parseError) {
          console.error('에러 응답이 JSON 형식이 아닙니다:', parseError);
        }
      } catch (readError) {
        console.error('에러 응답 읽기 실패:', readError);
        errorText = '에러 응답을 읽을 수 없습니다.';
      }
      
      console.error('토큰 교환 응답 상태:', tokenResponse.status);
      console.error('토큰 교환 응답 헤더:', Object.fromEntries(tokenResponse.headers.entries()));
      
      // 에러 응답 반환 (모의 데이터 제거)
      return NextResponse.json(
        { 
          error: '액세스 토큰 교환에 실패했습니다.',
          message: errorJson?.message || errorJson?.error_description || errorText || '인증 코드가 유효하지 않거나 만료되었습니다.',
          details: errorJson || { status: tokenResponse.status, raw: errorText },
          httpStatus: tokenResponse.status
        },
        { status: tokenResponse.status }
      );
    }

    let tokenData;
    try {
      tokenData = await tokenResponse.json();
      console.log('토큰 교환 성공:', {
        hasAccessToken: !!tokenData.access_token,
        hasUserSeqNo: !!tokenData.user_seq_no,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      });
    } catch (parseError) {
      console.error('토큰 응답 JSON 파싱 실패:', parseError);
      const responseText = await tokenResponse.text();
      console.error('토큰 응답 원본:', responseText);
      return NextResponse.json(
        { 
          error: '토큰 응답을 파싱할 수 없습니다.',
          message: '오픈뱅킹 API 응답 형식이 올바르지 않습니다.',
          details: responseText
        },
        { status: 500 }
      );
    }
    
    const accessToken = tokenData.access_token;
    const userSeqNo = tokenData.user_seq_no; // 사용자 일련번호
    
    if (!accessToken || !userSeqNo) {
      console.error('토큰 데이터 누락:', {
        hasAccessToken: !!accessToken,
        hasUserSeqNo: !!userSeqNo,
        tokenData: tokenData
      });
      return NextResponse.json(
        { 
          error: '토큰 정보가 불완전합니다.',
          message: '액세스 토큰 또는 사용자 일련번호가 응답에 포함되지 않았습니다.',
          details: tokenData
        },
        { status: 500 }
      );
    }

    // 계좌 목록 조회 (오픈뱅킹 API는 POST 요청 사용)
    const accountsResponse = await fetch('https://testapi.openbanking.or.kr/v2.0/account/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_seq_no: userSeqNo,
        include_cancel_yn: 'N', // 해지 계좌 제외
        sort_order: 'D' // 정렬 순서 (D: 최신순)
      })
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('계좌 목록 조회 실패:', errorText);
      console.error('계좌 조회 응답 상태:', accountsResponse.status);
      
      // 에러 응답 반환 (모의 데이터 제거)
      return NextResponse.json(
        { 
          error: '계좌 목록 조회에 실패했습니다.',
          message: errorText || '계좌 정보를 가져올 수 없습니다.',
          details: `HTTP ${accountsResponse.status}`,
          accessToken,
          userSeqNo
        },
        { status: accountsResponse.status }
      );
    }

    const accountsData = await accountsResponse.json();
    
    console.log('오픈뱅킹 API 계좌 목록 응답:', JSON.stringify(accountsData, null, 2));
    
    // 계좌 정보 가공 (오픈뱅킹 API 실제 응답 구조에 맞게 수정)
    let accounts = [];
    
    // 오픈뱅킹 API 응답 구조: res_list 배열 또는 직접 배열
    if (accountsData.res_list && Array.isArray(accountsData.res_list)) {
      accounts = accountsData.res_list.map(account => ({
        accountId: account.fintech_use_num || account.account_num || '',
        accountName: account.account_name || account.account_holder_name || account.product_name || '',
        accountNumber: account.account_num_masked || account.account_num || '',
        balance: parseInt(account.balance_amt || account.available_amt || '0', 10),
        bankCode: account.bank_code_std || account.bank_code || '',
        bankName: account.bank_name || ''
      }));
    } else if (Array.isArray(accountsData)) {
      // 응답이 직접 배열인 경우
      accounts = accountsData.map(account => ({
        accountId: account.fintech_use_num || account.account_num || '',
        accountName: account.account_name || account.account_holder_name || account.product_name || '',
        accountNumber: account.account_num_masked || account.account_num || '',
        balance: parseInt(account.balance_amt || account.available_amt || '0', 10),
        bankCode: account.bank_code_std || account.bank_code || '',
        bankName: account.bank_name || ''
      }));
    } else if (accountsData.account_list && Array.isArray(accountsData.account_list)) {
      // account_list로 응답이 오는 경우
      accounts = accountsData.account_list.map(account => ({
        accountId: account.fintech_use_num || account.account_num || '',
        accountName: account.account_name || account.account_holder_name || account.product_name || '',
        accountNumber: account.account_num_masked || account.account_num || '',
        balance: parseInt(account.balance_amt || account.available_amt || '0', 10),
        bankCode: account.bank_code_std || account.bank_code || '',
        bankName: account.bank_name || ''
      }));
    }
    
    console.log('가공된 계좌 정보:', accounts);
    console.log('가공된 계좌 개수:', accounts.length);

    // 계좌가 없으면 빈 배열 반환 (모의 데이터 제거)
    if (accounts.length === 0) {
      console.log('계좌가 없습니다. 빈 배열을 반환합니다.');
      return NextResponse.json({
        accounts: [],
        accessToken,
        userSeqNo,
        message: '연동된 계좌가 없습니다.'
      });
    }

    return NextResponse.json({
      accounts,
      accessToken,
      userSeqNo
    });
  } catch (error) {
    console.error('오픈뱅킹 콜백 처리 오류:', error);
    
    // 에러 응답 반환 (모의 데이터 제거)
    return NextResponse.json(
      { 
        error: '오픈뱅킹 콜백 처리 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

