import { NextResponse } from 'next/server';
import {
  getSubscriptionById,
  updateSubscriptionById,
  deleteSubscriptionById
} from '../subscriptions';

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

// 구독 상세 조회
export async function GET(request, { params }) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = params;
    const subscription = getSubscriptionById(id);

    if (!subscription) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자가 아니면 자신의 구독만 조회 가능
    if (!auth.isAdmin && String(subscription.userId) !== String(auth.userId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('구독 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 구독 수정
export async function PUT(request, { params }) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = params;
    const subscription = getSubscriptionById(id);

    if (!subscription) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자가 아니면 자신의 구독만 수정 가능
    if (!auth.isAdmin && String(subscription.userId) !== String(auth.userId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = updateSubscriptionById(id, body);

    return NextResponse.json(
      { 
        message: '구독 정보가 수정되었습니다.',
        subscription: updated 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('구독 수정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 구독 삭제
export async function DELETE(request, { params }) {
  try {
    const auth = checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = params;
    const subscription = getSubscriptionById(id);

    if (!subscription) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자가 아니면 자신의 구독만 삭제 가능
    if (!auth.isAdmin && String(subscription.userId) !== String(auth.userId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const deleted = deleteSubscriptionById(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: '구독 정보 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '구독 정보가 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('구독 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

