import { NextResponse } from 'next/server';
import {
  addSubscription,
  getSubscriptionsByUserId,
  getAllSubscriptions,
  deleteSubscriptionsByUserId
} from './subscriptions';
import { getUserById } from '../auth/users';

// Django 백엔드 URL
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

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

// 구독 목록 조회 - Django 백엔드로 프록시
export async function GET(request) {
  try {
    const auth = checkAuth(request);
    
    // 인증이 없으면 에러 반환 (개발 환경에서도 Django 백엔드 사용)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Django 백엔드로 요청 전달
    const djangoUrl = `${DJANGO_API_URL}/api/subscriptions/`;
    const urlWithParams = userId ? `${djangoUrl}?userId=${userId}` : djangoUrl;
    
    try {
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || '구독 목록 조회에 실패했습니다.' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } catch (fetchError) {
      console.error('Django 백엔드 연결 오류:', fetchError);
      // Django 백엔드 연결 실패 시 메모리 저장소로 폴백
      console.log('메모리 저장소로 폴백합니다.');
      
      const targetUserId = userId && auth.isAdmin ? userId : auth.userId;
      const subscriptions = getSubscriptionsByUserId(targetUserId);
      
      const formattedSubscriptions = subscriptions.map(sub => {
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
          }
        }
        
        const user = sub.userId ? getUserById(sub.userId) : null;
        const username = user ? user.username : null;
        
        return {
          id: sub.id,
          name: sub.name,
          price: sub.price,
          billingCycle: sub.billingCycle || 'monthly',
          category: sub.category || '기타',
          next_payment_date: nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null,
          userId: sub.userId,
          username: username,
          accountId: sub.accountId || null,
          accountNumber: sub.accountNumber || null,
          bankCode: sub.bankCode || null,
          createdAt: sub.createdAt
        };
      });
      
      return NextResponse.json({ subscriptions: formattedSubscriptions }, { status: 200 });
    }
  } catch (error) {
    console.error('구독 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 구독 추가 - Django 백엔드로 프록시
export async function POST(request) {
  try {
    const auth = checkAuth(request);
    
    // 인증이 없으면 에러 반환
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, billingCycle, category, accountId, accountNumber, bankCode, description, logo_url, next_payment_date } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: '구독 서비스명과 가격은 필수입니다.' },
        { status: 400 }
      );
    }

    // Django 백엔드로 요청 전달
    try {
      const djangoUrl = `${DJANGO_API_URL}/api/subscriptions/`;
      const response = await fetch(djangoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.userId,
          name,
          price: parseFloat(price),
          billingCycle: billingCycle || 'monthly',
          category: category || '',
          accountId: accountId || null,
          accountNumber: accountNumber || null,
          bankCode: bankCode || null,
          description: description || '',
          logo_url: logo_url || '',
          next_payment_date: next_payment_date || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || '구독 추가에 실패했습니다.' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 201 });
    } catch (fetchError) {
      console.error('Django 백엔드 연결 오류:', fetchError);
      // Django 백엔드 연결 실패 시 메모리 저장소로 폴백
      console.log('메모리 저장소로 폴백합니다.');
      
      const subscription = addSubscription({
        userId: auth.userId,
        name,
        price: parseFloat(price),
        billingCycle: billingCycle || 'monthly',
        category: category || '',
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
    }
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

