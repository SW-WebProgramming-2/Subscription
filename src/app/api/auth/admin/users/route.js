import { NextResponse } from 'next/server';
import { getAllUsers, getUserById, deleteUserById } from '../../users';

// 관리자 권한 확인 함수
function checkAdminAuth(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: '인증 토큰이 필요합니다.' };
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);
    
    if (!payload.isAdmin) {
      return { authorized: false, error: '관리자 권한이 필요합니다.' };
    }
    
    return { authorized: true, userId: payload.userId };
  } catch (error) {
    return { authorized: false, error: '유효하지 않은 토큰입니다.' };
  }
}

// 전체 회원 목록 조회
export async function GET(request) {
  try {
    const auth = checkAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const users = getAllUsers();
    
    return NextResponse.json(
      {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 회원 상세 조회
export async function POST(request) {
  try {
    const auth = checkAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
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

    const user = getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 제외하고 반환
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 회원 삭제
export async function DELETE(request) {
  try {
    const auth = checkAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
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

    // 자기 자신은 삭제할 수 없도록
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const deleted = deleteUserById(userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: '회원이 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

