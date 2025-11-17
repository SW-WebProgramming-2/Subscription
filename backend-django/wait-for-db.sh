#!/bin/sh
# 데이터베이스가 준비될 때까지 대기하는 스크립트
# docker-compose에서 서비스 이름 'db'를 사용

set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"

>&2 echo "Waiting for PostgreSQL at $host:$port..."

until nc -z "$host" "$port"; do
  >&2 echo "PostgreSQL is unavailable at $host:$port - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up at $host:$port - ready to start application"

