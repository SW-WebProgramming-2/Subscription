import { NextResponse } from 'next/server';
import { addUser, getUserByEmail, getUserByUsername, getAllUsers } from '../users';

export async function POST(request) {
  try {
    const body = await request.json();
    let { name, username, email, password } = body;

    // 공백 제거
    name = name?.trim();
    username = username?.trim();
    email = email?.trim();
    password = password?.trim();

    // 입력 검증
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 아이디 형식 검증
    if (username.length < 4) {
      return NextResponse.json(
        { error: '아이디는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (username.length > 20) {
      return NextResponse.json(
        { error: '아이디는 최대 20자까지 사용할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: '아이디는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.' },
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

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (password.length > 100) {
      return NextResponse.json(
        { error: '비밀번호는 최대 100자까지 사용할 수 있습니다.' },
        { status: 400 }
      );
    }

    // Django 백엔드로 사용자 생성 요청
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Django 백엔드에서 오류 응답
        return NextResponse.json(
          { error: data.error || '회원가입에 실패했습니다.' },
          { status: response.status }
        );
      }

      // 성공 응답
      return NextResponse.json(
        {
          message: data.message || '회원가입이 완료되었습니다.',
          user: data.user
        },
        { status: 201 }
      );
    } catch (fetchError) {
      console.error('Django 백엔드 연결 오류:', fetchError);
      
      // Django 백엔드 연결 실패 시 메모리 기반으로 폴백
      // 중복 아이디 확인
      const existingUsername = getUserByUsername(username);
      if (existingUsername) {
        return NextResponse.json(
          { error: '이미 사용 중인 아이디입니다.' },
          { status: 409 }
        );
      }

      // 중복 이메일 확인
      const existingUser = getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: '이미 사용 중인 이메일입니다.' },
          { status: 409 }
        );
      }

      // 메모리 기반 사용자 생성 (폴백)
      const newUser = {
        id: Date.now().toString(),
        name,
        username,
        email,
        password,
        createdAt: new Date().toISOString()
      };

      addUser(newUser);

      return NextResponse.json(
        {
          message: '회원가입이 완료되었습니다. (로컬 저장)',
          user: {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email
          }
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개발/테스트용: 사용자 목록 조회 (실제로는 제거하거나 인증 필요)
export async function GET() {
  try {
    // Django 백엔드에서 사용자 목록 조회
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/users/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(
          {
            users: data.users || []
          },
          { status: 200 }
        );
      }
    } catch (fetchError) {
      console.error('Django 백엔드 연결 오류:', fetchError);
    }

    // Django 백엔드 연결 실패 시 메모리 기반으로 폴백
    return NextResponse.json(
      {
        users: getAllUsers()
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        users: getAllUsers()
      },
      { status: 200 }
    );
  }
}

