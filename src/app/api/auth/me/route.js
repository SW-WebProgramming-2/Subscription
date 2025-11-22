import { NextResponse } from 'next/server';
import { getUserById } from '../users';

export async function GET(request) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 디코딩 (간단한 예시)
    // 프로덕션에서는 jwt.verify() 사용
    let payload;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (error) {
      console.error('토큰 디코딩 오류:', error);
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 디버깅: userId 확인
    console.log('토큰에서 추출한 userId:', payload.userId, '타입:', typeof payload.userId);

    // 사용자 조회
    const user = getUserById(payload.userId);
    
    // 디버깅: 사용자 조회 결과
    console.log('조회된 사용자:', user ? { id: user.id, username: user.username } : 'null');
    const { getUsers } = await import('../users');
    const allUsers = getUsers();
    console.log('전체 사용자 수:', allUsers.length);
    console.log('전체 사용자 ID 목록:', allUsers.map(u => ({ id: u.id, type: typeof u.id })));

    if (!user) {
      console.error('사용자를 찾을 수 없음:', {
        찾는UserId: payload.userId,
        전체사용자수: allUsers.length,
        전체사용자ID: allUsers.map(u => u.id)
      });
      return NextResponse.json(
        { 
          error: '사용자를 찾을 수 없습니다. 서버가 재시작되어 데이터가 초기화되었을 수 있습니다.',
          debug: process.env.NODE_ENV === 'development' ? {
            userId: payload.userId,
            userCount: allUsers.length
          } : undefined
        },
        { status: 404 }
      );
    }

    // 사용자 정보 반환 (비밀번호 제외)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

