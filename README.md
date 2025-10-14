# 📦 구독 서비스 관리 웹 프로젝트

> **Next.js + Docker 기반 구독 서비스 관리 대시보드**  
> 사용자의 구독 현황을 한눈에 보고, 새로운 구독을 추가하거나 AI 추천을 받을 수 있는 웹 서비스입니다.

---

## 📁 프로젝트 구조 및 역할

```bash
📦 프로젝트 루트
├── package.json                # 프로젝트 설정 및 의존성 관리
├── next.config.js              # Next.js 환경 설정
├── Dockerfile                  # Docker 컨테이너 빌드 설정
├── docker-compose.yml          # Docker Compose 설정
│
├── src/
│   ├── app/
│   │   ├── layout.js           # 전체 레이아웃 (공통 구조)
│   │   ├── page.js             # 메인 페이지 (홈/대시보드)
│   │   ├── subscriptions/
│   │   │   └── page.js         # 구독 관리 페이지
│   │   ├── add/
│   │   │   └── page.js         # 구독 추가 페이지
│   │   └── recommendations/
│   │       └── page.js         # AI 추천 페이지
│   │
│   ├── components/
│   │   ├── Navbar.js           # 네비게이션 바
│   │   ├── SubscriptionCard.js # 구독 서비스 카드
│   │   ├── Chart.js            # 차트 컴포넌트
│   │   └── Footer.js           # 푸터
│   │
│   ├── lib/
│   │   └── api.js              # API 통신 관련 함수
│   │
│   ├── styles/
│   │   ├── Home.module.css     # 메인페이지 전용 스타일
│   │   └── globals.css         # 전역 스타일
│
└── public/
    ├── images/
    │   ├── logo.png            # 로고 이미지
    │   ├── hero-bg.jpg         # 히어로 섹션 배경 이미지
    │   └── favicon.ico         # 파비콘
    └── robots.txt              # 검색엔진 크롤링 설정
```

---

## 🖥️ 주요 페이지 역할

| 파일 경로 | 역할 |
|------------|-------|
| `src/app/page.js` | **메인 대시보드 페이지** — 구독 요약, 통계 카드, 구독 목록 표시 |
| `src/app/subscriptions/page.js` | **구독 관리 페이지** — 구독 목록 편집 및 삭제 |
| `src/app/add/page.js` | **구독 추가 페이지** — 새 구독 항목 등록 |
| `src/app/recommendations/page.js` | **AI 추천 페이지** — AI 기반 구독 추천 기능 |
| `src/app/layout.js` | **공통 레이아웃** — Navbar, Footer, 전역 스타일 적용 |

---

## 🧩 주요 컴포넌트

| 컴포넌트 | 설명 |
|-----------|------|
| `Navbar.js` | 상단 네비게이션 메뉴 |
| `SubscriptionCard.js` | 개별 구독 서비스 카드 UI |
| `Chart.js` | 구독 통계 시각화용 차트 |
| `Footer.js` | 하단 푸터 영역 |

---

## 🎨 스타일 구조

- **`globals.css`** — 전체 페이지 공통 스타일  
- **`Home.module.css`** — 홈(메인) 페이지 전용 스타일  

---

## 🔌 API & 유틸리티

| 파일 | 역할 |
|------|------|
| `src/lib/api.js` | 백엔드 API와의 통신, fetch 및 데이터 처리 함수 |

---

## ⚙️ Docker 구성

| 파일 | 설명 |
|------|------|
| `Dockerfile` | Next.js 앱을 Docker 이미지로 빌드 |
| `docker-compose.yml` | 여러 컨테이너 구성 및 실행 관리 |

---

## 🚀 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. Docker 빌드 및 실행
docker-compose up --build
```

---

## 🧠 기술 스택

- **Framework**: Next.js 14  
- **Language**: JavaScript (React 기반)  
- **Styling**: CSS Modules, Tailwind (선택사항)  
- **Containerization**: Docker, Docker Compose  
