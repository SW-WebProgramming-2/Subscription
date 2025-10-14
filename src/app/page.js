export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 네비게이션 바 */}
      <nav style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '0 2rem',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            S
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>SubManager</span>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>구독 조회</a>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>AI 추천</a>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            로그인
          </button>
          <button style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            회원가입
          </button>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main style={{ flex: 1, padding: '0 2rem' }}>
        {/* 히어로 섹션 */}
        <section style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4rem 0',
          textAlign: 'center',
          margin: '0 -2rem 3rem -2rem'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold',
              marginBottom: '1rem',
              lineHeight: 1.2
            }}>
              구독 서비스 관리의 모든 것
            </h1>
            
            <p style={{ 
              fontSize: '1.25rem', 
              marginBottom: '2rem',
              opacity: 0.9
            }}>
              모든 구독 서비스를 한 곳에서 관리하고, 불필요한 지출을 줄여보세요
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button style={{
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                구독 추가하기
              </button>
              <button style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '1rem 2rem',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                AI 추천 받기
              </button>
            </div>
          </div>
        </section>

        {/* 대시보드 통계 */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>이번 달 지출</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>₩0</p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>활성 구독</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>0개</p>
            </div>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#1f2937'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>절약 가능</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>₩0</p>
            </div>
          </div>
        </section>

        {/* 구독 서비스 목록 */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>내 구독 서비스</h2>
            <button style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              + 구독 추가
            </button>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '3rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#1f2937',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0' }}>아직 등록된 구독 서비스가 없습니다.</p>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>구독 서비스를 추가해보세요!</p>
          </div>
        </section>

        {/* 분석 섹션 */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>지출 분석</h2>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            <p>차트가 여기에 표시됩니다</p>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer style={{
        background: '#1f2937',
        color: 'white',
        padding: '3rem 2rem 2rem 2rem',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '3rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  S
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SubManager</span>
              </div>
              <p style={{ color: '#d1d5db', lineHeight: 1.6, marginBottom: '2rem' }}>
                모든 구독 서비스를 한 곳에서 관리하고, 스마트한 소비를 위한 AI 추천 서비스를 제공합니다.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['📘', '🐦', '📷', '💼'].map((icon, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: '#374151',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>서비스</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['구독 관리', '대시보드', 'AI 추천', '지출 분석'].map((item, index) => (
                  <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>지원</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['도움말', '자주 묻는 질문', '문의하기', '서비스 상태'].map((item, index) => (
                  <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>법적 정보</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['개인정보처리방침', '이용약관', '쿠키 정책', '보안'].map((item, index) => (
                  <a key={index} href="#" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.95rem' }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid #374151',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: '0.25rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                &copy; 2024 SubManager. All rights reserved.
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                구독 관리 서비스로 스마트한 소비를 시작하세요.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { icon: '🔒', text: 'SSL 보안' },
                { icon: '🛡️', text: '데이터 보호' },
                { icon: '⚡', text: '빠른 처리' }
              ].map((badge, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#374151',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#d1d5db'
                }}>
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
