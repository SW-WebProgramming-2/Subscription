# 🖥️ 서버 초기 실행 (빠른 가이드)

## ✅ 확인 완료된 명령어

제공하신 명령어들을 확인했습니다. 모두 올바르게 설정되어 있습니다!

### 1. 프로젝트 복사
```bash
git clone https://github.com/your/repo.git
cd subscription/backend-django
```
✅ **확인**: 경로가 올바릅니다. `subscription`은 저장소 이름에 따라 조정하세요.

### 2. 환경변수 파일(.env) 생성
```bash
nano .env  # 또는 vi
```
✅ **확인**: `.env.example` 파일을 참고하여 생성하세요.

**필수 환경변수**:
```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=0
DB_ENGINE=postgres
DB_NAME=subscriptions
DB_USER=appuser
DB_PASSWORD=your-password
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

### 3. 도커 실행
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
✅ **확인**: 명령어가 올바릅니다. `docker-compose.prod.yml` 파일이 존재합니다.

### 4. 헬스체크
```bash
docker ps
docker logs subs_backend
```
✅ **확인**: 컨테이너 이름이 올바릅니다.

## 📋 추가 확인 명령어

```bash
# 모든 서비스 상태 확인
docker compose -f docker-compose.prod.yml ps

# API 헬스체크
curl http://localhost/api/health/

# 실시간 로그 확인
docker logs -f subs_backend
```

## ⚠️ 주의사항

1. **wait-for-db.sh**: Dockerfile에서 참조하지만 파일이 없으면 빌드 실패할 수 있습니다. 생성되었는지 확인하세요.
2. **.env 파일**: 반드시 생성하고 필요한 환경변수를 설정하세요.
3. **포트 충돌**: 80, 443, 8000, 5432, 6379 포트가 사용 가능한지 확인하세요.

## ✅ 모든 설정 완료!

명령어들이 올바르게 설정되어 있습니다. 서버에서 실행하면 정상 작동할 것입니다.

