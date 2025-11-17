# 🖥️ 서버 초기 실행 가이드 (우분투)

## 사전 요구사항

- 우분투 서버 (20.04 이상 권장)
- Docker 및 Docker Compose 설치됨
- Git 설치됨

## 1. 프로젝트 복사

```bash
# GitHub 저장소 클론
git clone https://github.com/your-username/Subscription.git
cd Subscription/backend-django
```

## 2. 환경변수 파일(.env) 생성

```bash
# .env.example을 복사하여 생성
cp .env.example .env

# 또는 직접 생성
nano .env  # 또는 vi .env
```

### 필수 환경변수 설정

`.env` 파일에 다음 내용을 설정하세요:

```env
# Django 설정
DJANGO_SECRET_KEY=your-very-secret-key-here-change-in-production
DJANGO_DEBUG=0

# 데이터베이스 설정
DB_ENGINE=postgres
DB_NAME=subscriptions
DB_USER=appuser
DB_PASSWORD=your-secure-db-password
DB_HOST=db
DB_PORT=5432
DB_CONN_MAX_AGE=60

# Redis 캐시 설정
REDIS_URL=redis://redis:6379/0
```

**중요**: 
- `DJANGO_SECRET_KEY`는 반드시 강력한 랜덤 문자열로 변경하세요
- `DB_PASSWORD`는 안전한 비밀번호로 변경하세요
- 프로덕션에서는 `DJANGO_DEBUG=0`으로 설정하세요

## 3. Docker 실행

```bash
# 프로덕션 설정으로 빌드 및 실행
docker compose -f docker-compose.prod.yml up -d --build
```

이 명령어는:
- Docker 이미지를 빌드합니다
- PostgreSQL, Redis, Django 백엔드, Caddy 서비스를 시작합니다
- 백그라운드 모드(`-d`)로 실행합니다

## 4. 헬스체크

### 컨테이너 상태 확인

```bash
# 모든 컨테이너 상태 확인
docker ps

# 예상 출력:
# CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
# xxxxx          caddy:2            Up 2 minutes   0.0.0.0:80->80/tcp      subs_caddy
# xxxxx          subscription...     Up 2 minutes   0.0.0.0:8000->8000/tcp  subs_backend
# xxxxx          postgres:16         Up 2 minutes   5432/tcp                subs_pg
# xxxxx          redis:7-alpine      Up 2 minutes   0.0.0.0:6379->6379/tcp  subs_redis
```

### 백엔드 로그 확인

```bash
# 백엔드 컨테이너 로그 확인
docker logs subs_backend

# 실시간 로그 확인
docker logs -f subs_backend

# 최근 100줄만 확인
docker logs --tail 100 subs_backend
```

### 추가 확인 명령어

```bash
# 모든 컨테이너 로그 확인
docker compose -f docker-compose.prod.yml logs

# 특정 서비스 로그 확인
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml logs caddy
docker compose -f docker-compose.prod.yml logs redis

# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 헬스체크 API 호출
curl http://localhost/api/health/
# 또는
curl http://localhost:8000/api/health/
```

## 5. 초기 설정 (선택사항)

### 데이터베이스 마이그레이션 확인

```bash
# 마이그레이션 상태 확인
docker compose -f docker-compose.prod.yml exec backend python manage.py showmigrations

# 마이그레이션 실행 (자동으로 실행되지만 수동 실행 가능)
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 관리자 계정 생성

```bash
# Django 관리자 계정 생성
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 정적 파일 수집

```bash
# 정적 파일 수집 (필요한 경우)
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## 6. 서비스 접속 확인

### 로컬에서 확인

```bash
# API 헬스체크
curl http://localhost/api/health/

# 또는 브라우저에서
# http://localhost (Caddy를 통한 접속)
# http://localhost:8000/api/health/ (직접 접속)
```

### 외부에서 접속 (서버 IP 사용)

```bash
# 서버 IP로 접속
curl http://your-server-ip/api/health/
```

## 🔧 트러블슈팅

### 컨테이너가 시작되지 않는 경우

```bash
# 컨테이너 로그 확인
docker logs subs_backend

# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart backend

# 전체 재시작
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### 데이터베이스 연결 오류

```bash
# 데이터베이스 컨테이너 상태 확인
docker ps | grep subs_pg

# 데이터베이스 로그 확인
docker logs subs_pg

# .env 파일의 DB 설정 확인
cat .env | grep DB_
```

### 포트 충돌

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 포트를 사용하는 프로세스 종료
sudo kill -9 <PID>
```

## 📝 다음 단계

1. **도메인 설정**: Caddyfile에서 도메인 설정 및 HTTPS 활성화
2. **방화벽 설정**: 필요한 포트만 열기
3. **모니터링 설정**: 로그 및 성능 모니터링
4. **백업 설정**: 데이터베이스 정기 백업

## 🔗 관련 문서

- [Caddy 설정 가이드](./CADDY_GUIDE.md)
- [배포 가이드](../.github/DEPLOYMENT_GUIDE.md)
- [캐시 가이드](./CACHE_GUIDE.md)

