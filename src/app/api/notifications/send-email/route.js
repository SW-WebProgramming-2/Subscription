import { NextResponse } from 'next/server';
import { getUserById } from '../../auth/users';
import nodemailer from 'nodemailer';

// 이메일 발송 함수
async function sendEmail(to, subject, text, html) {
  // 환경 변수에서 이메일 설정 가져오기
  // 실제 운영 환경에서는 환경 변수로 설정해야 합니다
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  // 이메일 설정이 없으면 에러 반환
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    throw new Error('이메일 서버 설정이 필요합니다. SMTP_USER와 SMTP_PASS 환경 변수를 설정해주세요.');
  }

  // nodemailer transporter 생성
  const transporter = nodemailer.createTransport(emailConfig);

  // 이메일 옵션 설정
  const mailOptions = {
    from: `"구독 관리 서비스" <${emailConfig.auth.user}>`,
    to: to,
    subject: subject,
    text: text,
    html: html || text,
  };

  // 이메일 발송
  const info = await transporter.sendMail(mailOptions);
  return info;
}

// 특정 회원에게 이메일 알림 발송
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

    // 요청 본문에서 데이터 추출
    const body = await request.json();
    const { userId, subject, message } = body;

    // 필수 파라미터 검증
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: '제목과 메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 회원정보 조회
    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이메일이 없으면 에러 반환
    if (!user.email) {
      return NextResponse.json(
        { error: '해당 사용자의 이메일 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // HTML 형식의 이메일 본문 생성
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">구독 관리 서비스 알림</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #1f2937; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          이 메일은 구독 관리 서비스에서 자동으로 발송되었습니다.
        </p>
      </div>
    `;

    // 이메일 발송
    try {
      const info = await sendEmail(user.email, subject, message, htmlMessage);

      return NextResponse.json(
        {
          message: '이메일이 성공적으로 발송되었습니다.',
          email: user.email,
          messageId: info.messageId
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error('이메일 발송 오류:', emailError);
      return NextResponse.json(
        { error: `이메일 발송에 실패했습니다: ${emailError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

