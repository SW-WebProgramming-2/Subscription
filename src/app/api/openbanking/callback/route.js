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

    const clientId = process.env.OPENBANKING_CLIENT_ID || 'test_client_id';
    const clientSecret = process.env.OPENBANKING_CLIENT_SECRET || 'test_client_secret';
    // 프로덕션 URL을 콜백 URL로 사용 (금융 API는 localhost를 허용하지 않음)
    const redirectUri = process.env.OPENBANKING_REDIRECT_URI 
      || (process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/add/openbanking/callback`
        : 'https://subscription-production-2c3d.up.railway.app/add/openbanking/callback');

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
      console.error('액세스 토큰 교환 실패:', errorText);
      
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

      throw new Error(`액세스 토큰 교환 실패: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const userSeqNo = tokenData.user_seq_no; // 사용자 일련번호

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
      throw new Error(`계좌 목록 조회 실패: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    
    // 계좌 정보 가공 (API 응답 구조에 맞게 수정)
    // 오픈뱅킹 API 응답 구조: res_list 배열에 계좌 정보 포함
    const accounts = (accountsData.res_list || []).map(account => ({
      accountId: account.account_num || account.fintech_use_num,
      accountName: account.account_name || account.account_holder_name,
      accountNumber: account.account_num_masked || account.account_num,
      balance: parseInt(account.balance_amt || '0', 10),
      bankCode: account.bank_code_std || account.bank_code
    }));

    return NextResponse.json({
      accounts,
      accessToken,
      userSeqNo
    });
  } catch (error) {
    console.error('오픈뱅킹 콜백 처리 오류:', error);
    
    // 개발 환경에서는 모의 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      const mockAccounts = [
        {
          accountId: '1234567890',
          accountName: 'KB국민은행 입출금통장',
          accountNumber: '123-456-789012',
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
      { 
        error: '오픈뱅킹 콜백 처리 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

