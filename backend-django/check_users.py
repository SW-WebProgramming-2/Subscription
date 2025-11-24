"""
사용자 정보 확인 스크립트
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from server.models import User

def check_users():
    """데이터베이스에 저장된 사용자 정보 출력"""
    users = User.objects.all()
    
    if not users.exists():
        print("[INFO] 데이터베이스에 사용자가 없습니다.")
        return
    
    print(f"\n[SUCCESS] 총 {users.count()}명의 사용자가 등록되어 있습니다.\n")
    print("-" * 80)
    print(f"{'ID':<5} {'아이디':<20} {'이름':<15} {'이메일':<30} {'가입일':<20}")
    print("-" * 80)
    
    for user in users:
        created_at = user.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(user, 'created_at') and user.created_at else user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        print(f"{user.id:<5} {user.username:<20} {user.name:<15} {user.email:<30} {created_at:<20}")
    
    print("-" * 80)
    print("\n")

if __name__ == '__main__':
    check_users()

