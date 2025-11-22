import { NextResponse } from 'next/server';
import { getUserById } from '../users';

export async function POST(request) {
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

    // 토큰 디코딩
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

    // 요청 본문에서 비밀번호 추출
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
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

    // 비밀번호 확인
    // 실제로는 해시화된 비밀번호와 비교해야 함 (bcrypt 등)
    if (user.password !== password) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      { message: '비밀번호 확인 성공' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

