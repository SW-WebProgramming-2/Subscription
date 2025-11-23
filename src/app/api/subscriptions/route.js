import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const subscriptionData = await request.json();

    // Django 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Django 백엔드로 구독 정보 저장 요청
    const response = await fetch(`${backendUrl}/api/subscriptions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Django 백엔드 응답 오류:', errorText);
      throw new Error(`구독 정보 저장 실패: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('구독 정보 저장 오류:', error);
    
    // 개발 환경에서는 모의 성공 응답 반환
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        status: 'success',
        message: '구독 서비스가 추가되었습니다.',
        subscription: subscriptionData
      }, { status: 201 });
    }

    return NextResponse.json(
      { 
        error: '구독 정보 저장 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Django 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Django 백엔드로 구독 목록 조회 요청
    const response = await fetch(`${backendUrl}/api/subscriptions/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`구독 목록 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('구독 목록 조회 오류:', error);
    
    // 개발 환경에서는 모의 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        subscriptions: []
      });
    }

    return NextResponse.json(
      { 
        error: '구독 목록 조회 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

