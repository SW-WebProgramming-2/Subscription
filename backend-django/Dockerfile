# ---------------------------------------------
# Django 백엔드 운영용 Dockerfile
# ---------------------------------------------
FROM python:3.11-slim

# OS 업데이트 + 빌드 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# requirements 복사 및 설치
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 전체 복사
COPY . /app/

# Django 실행 포트
EXPOSE 8000

# 헬스체크를 위해 DB 준비까지 대기
COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

# gunicorn을 사용한 운영서버 실행
# wait-for-db.sh로 DB 준비 대기 후 gunicorn 실행
CMD ["sh", "-c", "./wait-for-db.sh && python manage.py migrate --noinput && gunicorn server.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120"]
