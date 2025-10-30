# Subscription Manager - Django Backend

Django REST API 백엔드 서버입니다.

## 기능

- 구독 서비스 관리 API
- REST API 엔드포인트 제공
- CORS 지원

## API 엔드포인트

### Health Check
- `GET /api/health/` - 서버 상태 확인

### 구독 서비스
- `GET /api/subscriptions/` - 구독 서비스 목록 조회
- `POST /api/subscriptions/` - 구독 서비스 추가
- `GET /api/subscriptions/<id>/` - 구독 서비스 상세 조회
- `PUT /api/subscriptions/<id>/` - 구독 서비스 수정
- `DELETE /api/subscriptions/<id>/` - 구독 서비스 삭제

## 로컬 개발 환경 실행

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 마이그레이션

```bash
python manage.py migrate
```

### 4. 개발 서버 실행

```bash
python manage.py runserver 8000
```

서버가 `http://localhost:8000`에서 실행됩니다.

## Docker로 실행

프로젝트 루트 디렉토리에서:

```bash
docker compose up --build
```

## 기술 스택

- Django 4.2
- Django REST Framework
- django-cors-headers
- SQLite (기본 데이터베이스)
- Gunicorn (프로덕션 서버)

