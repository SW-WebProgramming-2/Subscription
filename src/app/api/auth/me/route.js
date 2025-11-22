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
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 사용자 조회
    const user = getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다. 서버가 재시작되어 데이터가 초기화되었을 수 있습니다.' },
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
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

