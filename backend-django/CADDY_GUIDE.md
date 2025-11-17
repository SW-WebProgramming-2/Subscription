# Caddy Reverse Proxy 설정 가이드

Caddy는 HTTPS를 자동으로 지원하는 리버스 프록시 서버입니다.

## 📋 주요 기능

- ✅ **HTTPS 자동 지원**: Let's Encrypt 인증서 자동 발급 및 갱신
- ✅ **리버스 프록시**: Django 백엔드와 Next.js 프론트엔드 프록시
- ✅ **정적 파일 서빙**: Django staticfiles 및 media 파일 서빙
- ✅ **보안 헤더**: 프로덕션 환경 보안 강화
- ✅ **Gzip 압축**: 자동 응답 압축

## 🔧 설정 방법

### 1. 개발 환경 (localhost)

기본 설정으로 바로 사용 가능:

```bash
cd backend-django
docker compose up -d
```

접속:
- http://localhost (프론트엔드)
- http://localhost/api/ (Django API)
- http://localhost/admin/ (Django Admin)

### 2. 프로덕션 환경 (실제 도메인)

#### 2.1 Caddyfile 수정

`backend-django/Caddyfile` 파일에서 프로덕션 설정 주석 해제:

```caddy
# 주석 해제하고 도메인 변경
subscription.example.com {
    # ... 설정 내용
}
```

#### 2.2 전역 설정 수정

```caddy
{
    email your-email@example.com  # 실제 이메일로 변경
    auto_https on  # HTTPS 자동 활성화
}
```

#### 2.3 Docker Compose 설정

`docker-compose.prod.yml`에 Caddy 서비스 추가:

```yaml
services:
  caddy:
    image: caddy:2
    container_name: subs_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - default

volumes:
  caddy_data:
  caddy_config:
```

#### 2.4 DNS 설정

도메인의 A 레코드를 서버 IP로 설정:

```
subscription.example.com  A  your-server-ip
```

#### 2.5 실행

```bash
docker compose -f docker-compose.prod.yml up -d
```

Caddy가 자동으로:
1. Let's Encrypt 인증서 발급
2. HTTPS 리다이렉트 설정
3. 인증서 자동 갱신

## 📁 라우팅 구조

```
/                    → Next.js 프론트엔드 (app:3000)
/api/*               → Django API (backend:8000)
/admin/*             → Django Admin (backend:8000)
/api/docs/*           → Swagger 문서 (backend:8000)
/api/schema/*         → OpenAPI 스키마 (backend:8000)
/static/*             → Django 정적 파일 (file_server)
/media/*              → Django 미디어 파일 (file_server)
```

## 🔒 보안 헤더 (프로덕션)

프로덕션 설정에는 다음 보안 헤더가 포함됩니다:

- **HSTS**: HTTPS 강제 (1년)
- **X-Content-Type-Options**: MIME 타입 스니핑 방지
- **X-Frame-Options**: 클릭재킹 방지
- **X-XSS-Protection**: XSS 공격 방지
- **Referrer-Policy**: 리퍼러 정보 제어
- **Content-Security-Policy**: XSS 및 데이터 주입 공격 방지

## 🧪 테스트

### 로컬 테스트

```bash
# Caddy 설정 검증
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile caddy:2 caddy validate --config /etc/caddy/Caddyfile

# Caddy 실행
docker compose up caddy
```

### 헬스체크

```bash
# API 헬스체크
curl http://localhost/api/health/

# HTTPS (프로덕션)
curl https://subscription.example.com/api/health/
```

## 🔍 트러블슈팅

### HTTPS 인증서 발급 실패

1. **포트 확인**: 80, 443 포트가 열려있는지 확인
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```

2. **DNS 확인**: 도메인이 서버 IP로 올바르게 설정되었는지 확인
   ```bash
   dig subscription.example.com
   ```

3. **Caddy 로그 확인**
   ```bash
   docker logs subs_caddy
   ```

### 프록시 연결 실패

1. **네트워크 확인**: Docker 네트워크에서 서비스 이름 확인
   ```bash
   docker network ls
   docker network inspect subscription_default
   ```

2. **컨테이너 이름 확인**: `backend`, `app` 컨테이너가 실행 중인지 확인
   ```bash
   docker ps
   ```

### 정적 파일 404

1. **collectstatic 실행**: Django에서 정적 파일 수집
   ```bash
   docker compose exec backend python manage.py collectstatic
   ```

2. **권한 확인**: Caddy가 파일에 접근할 수 있는지 확인
   ```bash
   docker compose exec caddy ls -la /app/staticfiles
   ```

## 📚 참고 자료

- [Caddy 공식 문서](https://caddyserver.com/docs/)
- [Caddyfile 문법](https://caddyserver.com/docs/caddyfile)
- [Let's Encrypt](https://letsencrypt.org/)

## 🔄 업데이트

Caddyfile을 수정한 후:

```bash
# Caddy 재시작
docker compose restart caddy

# 또는 전체 재시작
docker compose down
docker compose up -d
```

Caddy는 설정 파일 변경을 자동으로 감지하고 재로드합니다.

