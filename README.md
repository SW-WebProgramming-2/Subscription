# 구독 서비스 관리 시스템

구독 서비스를 효율적으로 관리하고 추적할 수 있는 웹 애플리케이션입니다.

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [실행 방법](#실행-방법)
- [개발해야 할 내용](#개발해야-할-내용)

## 프로젝트 개요

사용자가 여러 구독 서비스(Netflix, Spotify 등)를 한 곳에서 관리하고, 결제 일정을 추적하며, 비용을 분석할 수 있는 웹 애플리케이션입니다.

### 주요 기능

- 구독 서비스 등록 및 관리
- 월별 구독 비용 분석 및 대시보드
- 결제 일정 캘린더 및 알림
- AI 기반 구독 추천 및 절약 제안
- 구독 서비스 카테고리별 분류

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: JavaScript
- **Styling**: CSS Modules
- **Port**: 3000

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Language**: Python 3.11
- **Database**: SQLite (개발), PostgreSQL(프로덕션) -> MySQL로 변경 예정
- **Port**: 8000

### Infrastructure
- **Reverse Proxy**: Caddy 2
- **Containerization**: Docker & Docker Compose
- **Port**: 80 (HTTP)

## 프로젝트 구조

```
Subscription/
├── src/                          # Next.js Frontend
│   ├── app/                      # App Router
│   │   ├── page.js              # 홈 페이지
│   │   ├── layout.js            # 레이아웃
│   │   ├── globals.css          # 전역 스타일
│   │   ├── add/                 # 구독 추가 페이지
│   │   ├── subscriptions/       # 구독 목록 페이지
│   │   └── recommendations/     # 추천 페이지
│   ├── components/              # React 컴포넌트
│   │   ├── Navbar.js           # 네비게이션 바
│   │   ├── Footer.js           # 푸터
│   │   ├── Chart.js            # 차트 컴포넌트
│   │   └── SubscriptionCard.js # 구독 카드
│   ├── lib/                     # 유틸리티
│   │   └── api.js              # API 클라이언트
│   └── styles/                  # CSS 모듈
│
├── backend-django/              # Django Backend
│   ├── server/                  # Django 프로젝트
│   │   ├── settings.py         # Django 설정
│   │   ├── urls.py             # URL 라우팅
│   │   ├── views.py            # API 뷰
│   │   └── wsgi.py             # WSGI 설정
│   ├── manage.py               # Django 관리 스크립트
│   ├── requirements.txt        # Python 패키지
│   └── Dockerfile              # Django 컨테이너
│
├── public/                      # 정적 파일
│   ├── images/                 # 이미지 리소스
│   └── favicon.ico
│
├── docker-compose.yml          # Docker Compose 설정
├── Dockerfile                  # Next.js 컨테이너
├── Caddyfile                   # Caddy 설정
├── package.json                # Node.js 패키지
├── next.config.js              # Next.js 설정
└── README.md                   # 프로젝트 문서
```

## 실행 방법

### Docker Compose로 실행 (권장)

```bash
# 전체 서비스 실행 (Frontend + Backend + Caddy)
docker compose up --build

# 백그라운드 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f

# 종료
docker compose down
```

접속: http://localhost

### 로컬 개발 환경

#### Frontend (Next.js)

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

접속: http://localhost:3000

#### Backend (Django)

```bash
# backend-django 디렉토리로 이동
cd backend-django

# 가상환경 생성 및 활성화 (Windows)
python -m venv venv
venv\Scripts\activate

# 가상환경 활성화 (Mac/Linux)
# source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 마이그레이션
python manage.py migrate

# 슈퍼유저 생성 (선택)
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver 8000
```

접속: http://localhost:8000

## 개발해야 할 내용

### 🔴 우선순위 높음 (핵심 기능)

#### 1. Django 백엔드 - 데이터베이스 모델 구현
- [ ] **Subscription 모델**: 구독 서비스 정보
  - 필드: name, category, price, billing_cycle, next_payment_date, description, logo_url
  - user_id와 연결 (추후 인증 구현 시)
  
- [ ] **User 모델**: 사용자 정보 (Django 기본 User 확장)
  - 필드: username, email, password
  
- [ ] **Category 모델**: 구독 서비스 카테고리
  - 필드: name, icon, description
  - 예: 스트리밍, 음악, 클라우드, 교육 등

#### 2. Django 백엔드 - API 엔드포인트 구현
- [ ] 구독 서비스 CRUD API
  - `GET /api/subscriptions/` - 목록 조회 (필터링, 정렬)
  - `POST /api/subscriptions/` - 추가
  - `GET /api/subscriptions/<id>/` - 상세 조회
  - `PUT /api/subscriptions/<id>/` - 수정
  - `DELETE /api/subscriptions/<id>/` - 삭제
  
- [ ] 대시보드 API
  - `GET /api/dashboard/stats/` - 통계 데이터
  - `GET /api/dashboard/monthly-spending/` - 월별 지출
  - `GET /api/dashboard/category-breakdown/` - 카테고리별 분석
  
- [ ] 결제 일정 API
  - `GET /api/calendar/payments/` - 결제 일정 조회
  - `GET /api/calendar/upcoming/` - 다가오는 결제

#### 3. Frontend - 페이지 구현

##### 홈 페이지 (`/`)
- [ ] 대시보드 UI 개선
- [ ] 월별 총 지출 금액 표시
- [ ] 이번 달 결제 예정 항목 표시
- [ ] 카테고리별 지출 차트 (Chart.js 활용)
- [ ] 최근 추가된 구독 서비스 목록

##### 구독 목록 페이지 (`/subscriptions`)
- [ ] 구독 서비스 카드 그리드 레이아웃
- [ ] 필터링 기능 (카테고리별, 가격별)
- [ ] 정렬 기능 (이름순, 가격순, 날짜순)
- [ ] 검색 기능
- [ ] 수정/삭제 기능

##### 구독 추가 페이지 (`/add`)
- [ ] 구독 서비스 등록 폼
- [ ] 필드: 서비스명, 카테고리, 가격, 결제 주기, 다음 결제일
- [ ] 폼 유효성 검증
- [ ] 인기 구독 서비스 템플릿 제공

##### 추천 페이지 (`/recommendations`)
- [ ] AI 기반 절약 추천 (사용하지 않는 구독 감지)
- [ ] 대체 서비스 추천
- [ ] 묶음 구독 추천

#### 4. Frontend - API 연동
- [ ] `src/lib/api.js`의 API 함수들과 실제 Django API 연결
- [ ] 에러 핸들링 개선
- [ ] 로딩 상태 표시
- [ ] 성공/실패 메시지 표시

### 🟡 우선순위 중간 (부가 기능)

#### 5. 인증 시스템
- [ ] Django - JWT 인증 구현
- [ ] Frontend - 로그인/회원가입 페이지
- [ ] Frontend - 인증 상태 관리
- [ ] 로그아웃 기능

#### 6. 알림 기능
- [ ] 결제 예정일 알림 (이메일/푸시)
- [ ] 알림 설정 페이지
- [ ] 알림 히스토리

#### 7. 데이터 시각화 개선
- [ ] Chart.js를 이용한 다양한 차트
  - 월별 지출 추이 (선 그래프)
  - 카테고리별 비율 (도넛 차트)
  - 연간 지출 비교 (막대 그래프)

#### 8. 캘린더 뷰
- [ ] 월간 결제 일정 캘린더
- [ ] 일별 결제 내역 표시
- [ ] 캘린더에서 직접 구독 수정

### 🟢 우선순위 낮음 (개선 사항)

#### 9. UI/UX 개선
- [ ] 반응형 디자인 완성 (모바일 최적화)
- [ ] 다크 모드 지원
- [ ] 애니메이션 및 트랜지션 효과
- [ ] 로딩 스켈레톤 UI

#### 10. 고급 기능
- [ ] 구독 서비스 자동 인식 (OCR, 이메일 파싱)
- [ ] 엑셀/CSV 내보내기
- [ ] 구독 공유 기능
- [ ] 다국어 지원

#### 11. 테스트 및 최적화
- [ ] Django 유닛 테스트 작성
- [ ] Frontend 컴포넌트 테스트
- [ ] API 성능 최적화
- [ ] 이미지 최적화

#### 12. 프로덕션 준비
- [ ] PostgreSQL 데이터베이스 마이그레이션
- [ ] 환경 변수 설정 (.env 파일)
- [ ] HTTPS 설정
- [ ] 로깅 및 모니터링
- [ ] CI/CD 파이프라인

