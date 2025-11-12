import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { accountId, accessToken, userSeqNo, bankCode, startDate, endDate } = await request.json();

    if (!accountId || !accessToken || !userSeqNo || !bankCode) {
      return NextResponse.json(
        { error: '계좌 정보와 인증 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 날짜 기본값 설정 (최근 1개월)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const transactionStartDate = startDate || oneMonthAgo.toISOString().split('T')[0].replace(/-/g, '');
    const transactionEndDate = endDate || today.toISOString().split('T')[0].replace(/-/g, '');

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
      console.error('거래 내역 조회 실패:', errorText);
      
      // 개발 환경에서는 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        const mockTransactions = [
          {
            tran_date: today.toISOString().split('T')[0].replace(/-/g, ''),
            tran_time: '120000',
            inout_type: '2', // 1: 입금, 2: 출금
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

      throw new Error(`거래 내역 조회 실패: ${transactionsResponse.status}`);
    }

    const transactionsData = await transactionsResponse.json();
    
    // 거래 내역 정보 가공
    const transactions = (transactionsData.res_list || []).map(transaction => ({
      date: transaction.tran_date,
      time: transaction.tran_time,
      type: transaction.inout_type === '1' ? '입금' : '출금',
      amount: parseInt(transaction.tran_amt || '0', 10),
      balance: parseInt(transaction.after_balance_amt || '0', 10),
      description: transaction.print_content || transaction.tran_amt_content || '',
      counterparty: transaction.account_holder_name || '',
      branch: transaction.branch_name || ''
    }));

    return NextResponse.json({
      transactions,
      totalCount: transactions.length,
      startDate: transactionStartDate,
      endDate: transactionEndDate
    });
  } catch (error) {
    console.error('거래 내역 조회 오류:', error);
    
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
      { 
        error: '거래 내역 조회 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// 은행 거래 ID 생성
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateBankTranId() {
  const random = generateRandomString(10);
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `F${randomNum}${random}`;
}

