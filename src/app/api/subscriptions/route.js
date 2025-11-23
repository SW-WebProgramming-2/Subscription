import { NextResponse } from 'next/server';
import {
  addSubscription,
  getSubscriptionsByUserId,
  getAllSubscriptions,
  deleteSubscriptionsByUserId
} from './subscriptions';
import { getUserById } from '../auth/users';

// 인증 확인 함수
function checkAuth(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: '인증 토큰이 필요합니다.', userId: null };
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
    return { authorized: true, userId: payload.userId, isAdmin: payload.isAdmin || false };
  } catch (error) {
    return { authorized: false, error: '유효하지 않은 토큰입니다.', userId: null };
  }
}

// 구독 목록 조회 - 각 회원은 자신의 구독만 조회 가능
export async function GET(request) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 관리자는 모든 구독 조회 가능, 일반 사용자는 자신의 구독만 조회
    if (auth.isAdmin && !userId) {
      const allSubscriptions = getAllSubscriptions();
      
      // 구독 조회 페이지 형식에 맞게 데이터 변환
      const formattedSubscriptions = allSubscriptions.map(sub => {
        // billingCycle 기반으로 다음 결제일 계산
        let nextPaymentDate = null;
        if (sub.createdAt) {
          const createdDate = new Date(sub.createdAt);
          const now = new Date();
          
          if (sub.billingCycle === 'monthly') {
            const paymentDay = createdDate.getDate();
            nextPaymentDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);
            if (nextPaymentDate < now) {
              nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
            }
          } else if (sub.billingCycle === 'yearly') {
            nextPaymentDate = new Date(now.getFullYear(), createdDate.getMonth(), createdDate.getDate());
            if (nextPaymentDate < now) {
              nextPaymentDate = new Date(now.getFullYear() + 1, createdDate.getMonth(), createdDate.getDate());
            }
          } else {
            nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, createdDate.getDate());
          }
        }
        
        // userId로 사용자 정보 조회하여 username 가져오기
        const user = sub.userId ? getUserById(sub.userId) : null;
        const username = user ? user.username : null;
        
        return {
          id: sub.id,
          name: sub.name,
          price: sub.price,
          billingCycle: sub.billingCycle || 'monthly',
          category: sub.category || '기타',
          next_payment_date: nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null,
          userId: sub.userId, // admin 조회 시 사용자 ID 포함
          username: username, // 사용자 이름 포함
          accountId: sub.accountId || null,
          accountNumber: sub.accountNumber || null,
          bankCode: sub.bankCode || null,
          createdAt: sub.createdAt
        };
      });
      
      return NextResponse.json({ subscriptions: formattedSubscriptions }, { status: 200 });
    }

    // 일반 사용자는 자신의 구독만 조회 (userId 파라미터가 있어도 자신의 것만)
    const targetUserId = userId && auth.isAdmin ? userId : auth.userId;
    const subscriptions = getSubscriptionsByUserId(targetUserId);
    
    // 구독 조회 페이지 형식에 맞게 데이터 변환
    const formattedSubscriptions = subscriptions.map(sub => {
      // billingCycle 기반으로 다음 결제일 계산
      let nextPaymentDate = null;
      if (sub.createdAt) {
        const createdDate = new Date(sub.createdAt);
        const now = new Date();
        
        if (sub.billingCycle === 'monthly') {
          // 매월 같은 날짜
          const paymentDay = createdDate.getDate();
          nextPaymentDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);
          
          // 이미 지난 날짜면 다음 달로
          if (nextPaymentDate < now) {
            nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
          }
        } else if (sub.billingCycle === 'yearly') {
          // 매년 같은 날짜
          nextPaymentDate = new Date(now.getFullYear(), createdDate.getMonth(), createdDate.getDate());
          
          // 이미 지난 날짜면 다음 해로
          if (nextPaymentDate < now) {
            nextPaymentDate = new Date(now.getFullYear() + 1, createdDate.getMonth(), createdDate.getDate());
          }
        } else {
          // 기본값: 다음 달
          nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, createdDate.getDate());
        }
      }
      
      // userId로 사용자 정보 조회하여 username 가져오기
      const user = sub.userId ? getUserById(sub.userId) : null;
      const username = user ? user.username : null;
      
      return {
        id: sub.id,
        name: sub.name,
        price: sub.price,
        billingCycle: sub.billingCycle || 'monthly',
        category: sub.category || '기타',
        next_payment_date: nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null,
        userId: sub.userId, // 사용자 ID 포함
        username: username, // 사용자 이름 포함
        // 오픈뱅킹 정보도 포함
        accountId: sub.accountId || null,
        accountNumber: sub.accountNumber || null,
        bankCode: sub.bankCode || null,
        createdAt: sub.createdAt
      };
    });
    
    return NextResponse.json({ subscriptions: formattedSubscriptions }, { status: 200 });
  } catch (error) {
    console.error('구독 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 구독 추가
export async function POST(request) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, billingCycle, category, accountId, accountNumber, bankCode } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: '구독 서비스명과 가격은 필수입니다.' },
        { status: 400 }
      );
    }

    // 현재 로그인한 사용자의 ID로 구독 정보 저장
    const subscription = addSubscription({
      userId: auth.userId, // 각 회원의 구독은 자신의 userId로 저장
      name,
      price: parseFloat(price),
      billingCycle: billingCycle || 'monthly',
      category: category || '',
      // 오픈뱅킹 정보
      accountId: accountId || null,
      accountNumber: accountNumber || null,
      bankCode: bankCode || null
    });

    return NextResponse.json(
      { 
        message: '구독 서비스가 추가되었습니다.',
        subscription 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('구독 추가 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 ID로 구독 삭제 (관리자 전용 - admin이 사용자 삭제 시 호출)
export async function DELETE(request) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 해당 사용자의 모든 구독 정보(오픈뱅킹 정보 포함) 삭제
    const deleted = deleteSubscriptionsByUserId(userId);
    
    if (deleted) {
      return NextResponse.json(
        { message: '해당 사용자의 구독 정보와 오픈뱅킹 연동 정보가 모두 삭제되었습니다.' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: '삭제할 구독 정보가 없습니다.' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('구독 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

