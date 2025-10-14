'use client';

import { useState } from 'react';
import styles from './Navbar.css';
import Link from 'next/link';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          {/* 로고 */}
          <Link href="/" className={styles.logo}>
            <img src="/images/logo.png" alt="Subscription Manager" />
            <span>SubManager</span>
          </Link>

          {/* 네비게이션 메뉴 */}
          <div className={styles.navMenu}>
            <Link href="/subscriptions" className={styles.navLink}>
              구독 조회
            </Link>
            <Link href="/recommendations" className={styles.navLink}>
              AI 추천
            </Link>
            {isLoggedIn && (
              <Link href="/dashboard" className={styles.navLink}>
                대시보드
              </Link>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className={styles.userMenu}>
            {isLoggedIn ? (
              <div className={styles.userDropdown}>
                <button className={styles.userButton}>
                  <img src="/images/user-avatar.png" alt="User" />
                  <span>내 계정</span>
                </button>
                <div className={styles.dropdownMenu}>
                  <Link href="/profile" className={styles.dropdownItem}>
                    프로필 설정
                  </Link>
                  <Link href="/settings" className={styles.dropdownItem}>
                    알림 설정
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className={styles.dropdownItem}
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <button 
                  onClick={handleLogin}
                  className={styles.loginButton}
                >
                  로그인
                </button>
                <button className={styles.signupButton}>
                  회원가입
                </button>
              </div>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button className={styles.mobileMenuButton}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* 로그인/회원가입 모달 */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLogin={() => {
            setIsLoggedIn(true);
            setShowAuthModal(false);
          }}
        />
      )}
    </>
  );
}

// 인증 모달 컴포넌트
function AuthModal({ onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSocialLogin = (provider) => {
    // 소셜 로그인 구현
    console.log(`${provider} 로그인`);
    onLogin();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        <div className={styles.authTabs}>
          <button 
            className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
            onClick={() => setIsLogin(true)}
          >
            로그인
          </button>
          <button 
            className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
            onClick={() => setIsLogin(false)}
          >
            회원가입
          </button>
        </div>

        <div className={styles.authContent}>
          {isLogin ? (
            <LoginForm onLogin={onLogin} />
          ) : (
            <SignupForm onSignup={onLogin} />
          )}

          <div className={styles.socialLogin}>
            <div className={styles.divider}>
              <span>또는</span>
            </div>
            
            <div className={styles.socialButtons}>
              <button 
                className={styles.googleButton}
                onClick={() => handleSocialLogin('google')}
              >
                <img src="/images/google-icon.png" alt="Google" />
                Google로 계속하기
              </button>
              <button 
                className={styles.kakaoButton}
                onClick={() => handleSocialLogin('kakao')}
              >
                <img src="/images/kakao-icon.png" alt="Kakao" />
                카카오로 계속하기
              </button>
              <button 
                className={styles.naverButton}
                onClick={() => handleSocialLogin('naver')}
              >
                <img src="/images/naver-icon.png" alt="Naver" />
                네이버로 계속하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로그인 폼
function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // 로그인 로직
    onLogin();
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>

      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          로그인 상태 유지
        </label>
        <a href="#" className={styles.forgotPassword}>
          비밀번호 찾기
        </a>
      </div>

      <button type="submit" className={styles.submitButton}>
        로그인
      </button>
    </form>
  );
}

// 회원가입 폼
function SignupForm({ onSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // 회원가입 로직
    onSignup();
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="name">이름</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="confirmPassword">비밀번호 확인</label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          required
        />
      </div>

      <div className={styles.terms}>
        <label className={styles.checkbox}>
          <input type="checkbox" required />
          <a href="#" target="_blank">이용약관</a> 및 <a href="#" target="_blank">개인정보처리방침</a>에 동의합니다.
        </label>
      </div>

      <button type="submit" className={styles.submitButton}>
        회원가입
      </button>
    </form>
  );
}
