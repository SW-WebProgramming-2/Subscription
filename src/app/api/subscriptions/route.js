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

// 구독 목록 조회 - Django 백엔드 우선, 실패 시 메모리 저장소로 폴백
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

    // Django 백엔드로 요청 전달 (데이터베이스에서 조회)
    const djangoUrl = `${DJANGO_API_URL}/api/subscriptions/`;
    const urlWithParams = userId ? `${djangoUrl}?userId=${userId}` : djangoUrl;
    
    try {
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
      }

      // Django 백엔드 오류 시 메모리 저장소로 폴백
      console.warn('Django 백엔드 조회 실패, 메모리 저장소로 폴백합니다.');
    } catch (fetchError) {
      // Django 백엔드 연결 실패 시 메모리 저장소로 폴백
      console.warn('Django 백엔드 연결 실패, 메모리 저장소로 폴백합니다:', fetchError.message);
    }

    // 메모리 저장소로 폴백 (관리자 권한 체크 포함)
    let subscriptions;
    if (auth.isAdmin && !userId) {
      // 관리자는 모든 구독 조회 가능
      subscriptions = getAllSubscriptions();
    } else {
      // 일반 사용자는 자신의 구독만 조회 (userId 파라미터가 있어도 자신의 것만)
      const targetUserId = userId && auth.isAdmin ? userId : auth.userId;
      subscriptions = getSubscriptionsByUserId(targetUserId);
    }

    // 구독 조회 페이지 형식에 맞게 데이터 변환
    const formattedSubscriptions = subscriptions.map(sub => {
      // 다음 결제일 계산: 사용자가 설정한 nextPaymentDate를 우선 사용
      let nextPaymentDate = null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // 1순위: 사용자가 직접 설정한 nextPaymentDate
      if (sub.nextPaymentDate) {
        const userSetDate = new Date(sub.nextPaymentDate);
        userSetDate.setHours(0, 0, 0, 0);
        
        // 과거 날짜인 경우 다음 결제일 계산
        if (userSetDate < now) {
          if (sub.billingCycle === 'monthly') {
            // 다음 달 같은 날짜
            nextPaymentDate = new Date(userSetDate.getFullYear(), userSetDate.getMonth() + 1, userSetDate.getDate());
          } else if (sub.billingCycle === 'yearly') {
            // 다음 해 같은 날짜
            nextPaymentDate = new Date(userSetDate.getFullYear() + 1, userSetDate.getMonth(), userSetDate.getDate());
          } else {
            // 기본값: 다음 달
            nextPaymentDate = new Date(userSetDate.getFullYear(), userSetDate.getMonth() + 1, userSetDate.getDate());
          }
        } else {
          nextPaymentDate = userSetDate;
        }
      } else if (sub.createdAt) {
        // 2순위: createdAt 기반 계산 (하위 호환용)
        const createdDate = new Date(sub.createdAt);
        
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
        description: sub.description || '',
        userId: sub.userId,
        username: username,
        accountId: sub.accountId || null,
        accountNumber: sub.accountNumber || null,
        bankCode: sub.bankCode || null,
        logo_url: sub.logo_url || null,
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

// 구독 추가 - Django 백엔드 우선, 실패 시 메모리 저장소로 폴백
export async function POST(request) {
  try {
    const auth = checkAuth(request);
    
    // 개발 환경에서 인증 토큰이 없으면 임시 사용자로 처리
    if (!auth.authorized) {
      if (process.env.NODE_ENV === 'development') {
        // 개발 환경: 임시 사용자 ID 사용
        const tempAuth = { authorized: true, userId: 'temp_user_1', isAdmin: false };
        const body = await request.json();
        const { name, price, billingCycle, category, nextPaymentDate, description, accountId, accountNumber, bankCode } = body;
        
        if (!name || !price) {
          return NextResponse.json(
            { error: '구독 서비스명과 가격은 필수입니다.' },
            { status: 400 }
          );
        }

        // Django 백엔드로 먼저 시도
        try {
          const djangoUrl = `${DJANGO_API_URL}/api/subscriptions/`;
          const response = await fetch(djangoUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: tempAuth.userId,
              name,
              price: parseFloat(price),
              billingCycle: billingCycle || 'monthly',
              category: category || '',
              accountId: accountId || null,
              accountNumber: accountNumber || null,
              bankCode: bankCode || null,
              description: description || '',
              logo_url: null,
              next_payment_date: nextPaymentDate || null,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json(data, { status: 201 });
          }
        } catch (fetchError) {
          console.warn('Django 백엔드 연결 실패, 메모리 저장소로 폴백합니다.');
        }

        // 메모리 저장소로 폴백
        const subscriptionData = {
          userId: tempAuth.userId,
          name,
          price: parseFloat(price),
          billingCycle: billingCycle || 'monthly',
          category: category || '',
          nextPaymentDate: nextPaymentDate || null,
          description: description || '',
          accountId: accountId || null,
          accountNumber: accountNumber || null,
          bankCode: bankCode || null
        };

        const { createdAt } = body;
        if (createdAt) {
          subscriptionData.createdAt = createdAt;
        }

        const subscription = addSubscription(subscriptionData);
        return NextResponse.json(
          { 
            message: '구독 서비스가 추가되었습니다.',
            subscription 
          },
          { status: 201 }
        );
      }
      
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, billingCycle, category, nextPaymentDate, description, accountId, accountNumber, bankCode, logo_url, createdAt } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: '구독 서비스명과 가격은 필수입니다.' },
        { status: 400 }
      );
    }

    // Django 백엔드로 요청 전달 (데이터베이스에 저장)
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
          logo_url: logo_url || null,
          next_payment_date: nextPaymentDate || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
      }

      // Django 백엔드 오류 시 메모리 저장소로 폴백
      console.warn('Django 백엔드 저장 실패, 메모리 저장소로 폴백합니다.');
    } catch (fetchError) {
      // Django 백엔드 연결 실패 시 메모리 저장소로 폴백
      console.warn('Django 백엔드 연결 실패, 메모리 저장소로 폴백합니다:', fetchError.message);
    }

    // 메모리 저장소로 폴백
    const subscriptionData = {
      userId: auth.userId,
      name,
      price: parseFloat(price),
      billingCycle: billingCycle || 'monthly',
      category: category || '',
      nextPaymentDate: nextPaymentDate || null,
      description: description || '',
      accountId: accountId || null,
      accountNumber: accountNumber || null,
      bankCode: bankCode || null
    };

    // 테스트용: createdAt이 제공되면 사용 (개발 환경에서만)
    if (createdAt && process.env.NODE_ENV === 'development') {
      subscriptionData.createdAt = createdAt;
    }

    const subscription = addSubscription(subscriptionData);
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

    // Django 백엔드로 삭제 요청 (선택적 - Django에 삭제 API가 있다면)
    // 현재는 메모리 저장소에서만 삭제

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
