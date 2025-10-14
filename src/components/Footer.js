'use client';

import styles from './Footer.css';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* 메인 푸터 콘텐츠 */}
        <div className={styles.footerContent}>
          {/* 회사 정보 */}
          <div className={styles.companyInfo}>
            <div className={styles.logo}>
              <img src="/images/logo.png" alt="Subscription Manager" />
              <span>SubManager</span>
            </div>
            <p className={styles.description}>
              모든 구독 서비스를 한 곳에서 관리하고, 
              스마트한 소비를 위한 AI 추천 서비스를 제공합니다.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="Facebook">
                📘
              </a>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                🐦
              </a>
              <a href="#" className={styles.socialLink} aria-label="Instagram">
                📷
              </a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                💼
              </a>
            </div>
          </div>

          {/* 서비스 링크 */}
          <div className={styles.serviceLinks}>
            <h3 className={styles.footerTitle}>서비스</h3>
            <ul className={styles.footerList}>
              <li>
                <Link href="/subscriptions" className={styles.footerLink}>
                  구독 관리
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={styles.footerLink}>
                  대시보드
                </Link>
              </li>
              <li>
                <Link href="/recommendations" className={styles.footerLink}>
                  AI 추천
                </Link>
              </li>
              <li>
                <Link href="/analytics" className={styles.footerLink}>
                  지출 분석
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 링크 */}
          <div className={styles.supportLinks}>
            <h3 className={styles.footerTitle}>지원</h3>
            <ul className={styles.footerList}>
              <li>
                <Link href="/help" className={styles.footerLink}>
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/faq" className={styles.footerLink}>
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.footerLink}>
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/status" className={styles.footerLink}>
                  서비스 상태
                </Link>
              </li>
            </ul>
          </div>

          {/* 법적 정보 */}
          <div className={styles.legalLinks}>
            <h3 className={styles.footerTitle}>법적 정보</h3>
            <ul className={styles.footerList}>
              <li>
                <Link href="/privacy" className={styles.footerLink}>
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className={styles.footerLink}>
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={styles.footerLink}>
                  쿠키 정책
                </Link>
              </li>
              <li>
                <Link href="/security" className={styles.footerLink}>
                  보안
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 구분선 */}
        <div className={styles.footerDivider}></div>

        {/* 하단 정보 */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>&copy; {currentYear} SubManager. All rights reserved.</p>
            <p className={styles.koreanCopyright}>
              구독 관리 서비스로 스마트한 소비를 시작하세요.
            </p>
          </div>
          
          <div className={styles.footerBadges}>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>🔒</span>
              <span>SSL 보안</span>
            </div>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>🛡️</span>
              <span>데이터 보호</span>
            </div>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>⚡</span>
              <span>빠른 처리</span>
            </div>
          </div>
        </div>

        {/* 뉴스레터 구독 */}
        <div className={styles.newsletter}>
          <div className={styles.newsletterContent}>
            <h3 className={styles.newsletterTitle}>
              구독 서비스 정보를 받아보세요
            </h3>
            <p className={styles.newsletterDescription}>
              새로운 구독 서비스와 절약 팁을 이메일로 받아보세요.
            </p>
            <form className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                className={styles.newsletterInput}
                required
              />
              <button type="submit" className={styles.newsletterButton}>
                구독하기
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}
