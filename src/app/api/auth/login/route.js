import { NextResponse } from 'next/server';
import { getUserByUsername } from '../users';

export async function POST(request) {
  try {
    const body = await request.json();
    let { username, password } = body;

    // 공백 제거
    username = username?.trim();
    password = password?.trim();

    // 입력 검증
    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    // 실제로는 데이터베이스에서 조회
    const user = getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    // 실제로는 해시화된 비밀번호와 비교해야 함 (bcrypt 등)
    if (user.password !== password) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성 (간단한 예시, 실제로는 jwt 라이브러리 사용)
    // 프로덕션에서는 jwt.sign() 사용
    const token = generateSimpleToken(user.id);

    // 성공 응답
    return NextResponse.json(
      {
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 간단한 토큰 생성 (개발용)
// 프로덕션에서는 jsonwebtoken 라이브러리 사용 권장
function generateSimpleToken(userId) {
  const payload = {
    userId,
    timestamp: Date.now(),
    // 실제로는 만료 시간 등 추가
  };
  // Base64 인코딩 (실제로는 JWT 사용)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

