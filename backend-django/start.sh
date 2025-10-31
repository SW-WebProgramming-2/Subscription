#!/bin/bash
# Railway/Render 배포를 위한 시작 스크립트

# 마이그레이션 실행
python manage.py migrate

# 정적 파일 수집 (필요한 경우)
python manage.py collectstatic --noinput || true

# 포트 환경 변수 확인 (Railway/Render에서 제공)
PORT=${PORT:-8000}

# Gunicorn으로 서버 시작
gunicorn server.wsgi:application --bind 0.0.0.0:$PORT --workers 3

