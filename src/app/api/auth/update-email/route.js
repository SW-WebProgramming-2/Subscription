import { NextResponse } from 'next/server';
import { getUserById, getUserByEmail } from '../users';

export async function PUT(request) {
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

    // 요청 본문에서 새 이메일 추출
    const body = await request.json();
    let { email } = body;

    // 공백 제거
    email = email?.trim();

    // 입력 검증
    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 이메일과 동일한지 확인
    if (user.email === email) {
      return NextResponse.json(
        { error: '현재 이메일과 동일합니다.' },
        { status: 400 }
      );
    }

    // 중복 이메일 확인
    const existingUser = getUserByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 이메일 업데이트
    user.email = email;

    // 성공 응답
    return NextResponse.json(
      {
        message: '이메일이 변경되었습니다.',
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

