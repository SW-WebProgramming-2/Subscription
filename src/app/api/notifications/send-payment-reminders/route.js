import { NextResponse } from 'next/server';
import { getAllSubscriptions } from '../../subscriptions/subscriptions';
import { getUserById } from '../../auth/users';
import nodemailer from 'nodemailer';

// 이메일 발송 함수
async function sendEmail(to, subject, text, html) {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    throw new Error('이메일 서버 설정이 필요합니다. SMTP_USER와 SMTP_PASS 환경 변수를 설정해주세요.');
  }

  const transporter = nodemailer.createTransport(emailConfig);

  const mailOptions = {
    from: `"구독 관리 서비스" <${emailConfig.auth.user}>`,
    to: to,
    subject: subject,
    text: text,
    html: html || text,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// 결제일 계산 함수 (구독 추가 시 로직과 동일)
function calculateNextPaymentDate(subscription) {
  if (!subscription.createdAt) {
    return null;
  }

  const createdDate = new Date(subscription.createdAt);
  const now = new Date();

  let nextPaymentDate = null;

  if (subscription.billingCycle === 'monthly') {
    const paymentDay = createdDate.getDate();
    nextPaymentDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);
    if (nextPaymentDate < now) {
      nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, paymentDay);
    }
  } else if (subscription.billingCycle === 'yearly') {
    nextPaymentDate = new Date(now.getFullYear(), createdDate.getMonth(), createdDate.getDate());
    if (nextPaymentDate < now) {
      nextPaymentDate = new Date(now.getFullYear() + 1, createdDate.getMonth(), createdDate.getDate());
    }
  } else {
    // 기본값: 다음 달
    nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, createdDate.getDate());
  }

  return nextPaymentDate;
}

// 날짜가 하루 차이인지 확인 (결제일 하루 전)
function isOneDayBefore(paymentDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const payment = new Date(paymentDate);
  payment.setHours(0, 0, 0, 0);
  
  // paymentDate가 내일인지 확인
  return payment.getTime() === tomorrow.getTime();
}

// 결제 알림 이메일 템플릿 생성
function createPaymentReminderEmail(subscription, userName) {
  const paymentDate = new Date(subscription.nextPaymentDate);
  const formattedDate = paymentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const subject = `[구독 알림] ${subscription.name} 결제 예정 안내`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💳 결제 예정 알림</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          안녕하세요, <strong>${userName}</strong>님!
        </p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
            ${subscription.name}
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
            결제 예정일: <strong style="color: #ef4444;">${formattedDate}</strong>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
            결제 금액: <strong style="color: #1f2937;">${subscription.price.toLocaleString('ko-KR')}원</strong>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
            결제 주기: ${subscription.billingCycle === 'monthly' ? '월간' : subscription.billingCycle === 'yearly' ? '연간' : '기타'}
          </p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
            ⚠️ <strong>내일 결제가 예정되어 있습니다.</strong><br>
            계좌 잔액을 확인하시고, 필요하시면 구독을 취소하시기 바랍니다.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
            이 메일은 구독 관리 서비스에서 자동으로 발송되었습니다.<br>
            구독을 관리하시려면 서비스에 로그인해주세요.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
결제 예정 알림

안녕하세요, ${userName}님!

${subscription.name}의 결제가 예정되어 있습니다.

결제 예정일: ${formattedDate}
결제 금액: ${subscription.price.toLocaleString('ko-KR')}원
결제 주기: ${subscription.billingCycle === 'monthly' ? '월간' : subscription.billingCycle === 'yearly' ? '연간' : '기타'}

⚠️ 내일 결제가 예정되어 있습니다.
계좌 잔액을 확인하시고, 필요하시면 구독을 취소하시기 바랍니다.

이 메일은 구독 관리 서비스에서 자동으로 발송되었습니다.
  `;

  return { subject, text, html };
}

// 결제 알림 발송 (자동 실행)
export async function GET(request) {
  try {
    // 보안: API 키 확인 (선택사항 - 프로덕션에서는 필수)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // 환경 변수에 CRON_API_KEY가 설정되어 있으면 확인
    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 모든 구독 서비스 조회
    const allSubscriptions = getAllSubscriptions();
    
    // 오늘 날짜 기준
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 결제일 하루 전인 구독 찾기
    const subscriptionsToNotify = [];
    
    for (const sub of allSubscriptions) {
      // 다음 결제일 계산
      const nextPaymentDate = calculateNextPaymentDate(sub);
      
      if (!nextPaymentDate) continue;
      
      // 결제일이 하루 전인지 확인
      if (isOneDayBefore(nextPaymentDate)) {
        subscriptionsToNotify.push({
          ...sub,
          nextPaymentDate: nextPaymentDate
        });
      }
    }

    if (subscriptionsToNotify.length === 0) {
      return NextResponse.json(
        {
          message: '결제 예정 알림을 보낼 구독이 없습니다.',
          checked: allSubscriptions.length,
          notified: 0
        },
        { status: 200 }
      );
    }

    // 각 구독에 대해 이메일 발송
    const results = [];
    const errors = [];

    for (const subscription of subscriptionsToNotify) {
      try {
        // 사용자 정보 조회
        const user = getUserById(subscription.userId);
        
        if (!user || !user.email) {
          errors.push({
            subscriptionId: subscription.id,
            subscriptionName: subscription.name,
            error: '사용자 정보 또는 이메일을 찾을 수 없습니다.'
          });
          continue;
        }

        // 이메일 템플릿 생성
        const emailContent = createPaymentReminderEmail(subscription, user.name || user.username);
        
        // 이메일 발송
        const emailInfo = await sendEmail(
          user.email,
          emailContent.subject,
          emailContent.text,
          emailContent.html
        );

        results.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          userId: user.id,
          userEmail: user.email,
          messageId: emailInfo.messageId,
          success: true
        });
      } catch (error) {
        console.error(`구독 ${subscription.id} 이메일 발송 오류:`, error);
        errors.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          error: error.message || '이메일 발송 실패'
        });
      }
    }

    return NextResponse.json(
      {
        message: '결제 예정 알림 발송이 완료되었습니다.',
        checked: allSubscriptions.length,
        notified: results.length,
        failed: errors.length,
        results: results,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('결제 알림 발송 오류:', error);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}

// 수동으로 테스트 실행 (POST)
export async function POST(request) {
  try {
    // Authorization 헤더에서 토큰 추출 (관리자만 실행 가능)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
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

    // 관리자만 실행 가능
    if (!payload.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // GET 요청과 동일한 로직 실행
    const response = await GET(request);
    return response;
  } catch (error) {
    console.error('결제 알림 수동 실행 오류:', error);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}


