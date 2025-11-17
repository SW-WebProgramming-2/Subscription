# 커맨드: python manage.py seed_subscriptions
# 기본 카테고리/샘플 데이터를 손쉽게 생성합니다.
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.subscriptions.models import Category, Subscription, Payment
from decimal import Decimal
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = "구독/결제 샘플 데이터를 생성합니다."

    def handle(self, *args, **options):
        # 1) 테스트 사용자 준비 (admin 없으면 생성 X, 존재 사용자 사용 권장)
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            self.stdout.write(self.style.WARNING("관리자 계정이 없어 기본 유저를 생성합니다 (username='demo', password='demo1234')."))
            user = User.objects.create_user(username='demo', password='demo1234')

        # 2) 카테고리 생성
        video, _ = Category.objects.get_or_create(name='영상', defaults={'icon': 'tv'})
        music, _ = Category.objects.get_or_create(name='음악', defaults={'icon': 'music'})

        # 3) 구독 샘플
        netflix, _ = Subscription.objects.get_or_create(
            user=user, name='Netflix',
            defaults={
                'category': video, 'price': Decimal('13500'),
                'currency': 'KRW', 'billing_cycle': 'monthly',
                'next_payment_date': timezone.now().date() + timedelta(days=7),
                'active': True
            }
        )
        spotify, _ = Subscription.objects.get_or_create(
            user=user, name='Spotify',
            defaults={
                'category': music, 'price': Decimal('10900'),
                'currency': 'KRW', 'billing_cycle': 'monthly',
                'next_payment_date': timezone.now().date() + timedelta(days=3),
                'active': True
            }
        )

        # 4) 결제 이력 샘플
        Payment.objects.get_or_create(
            subscription=netflix,
            amount=Decimal('13500'), currency='KRW', status='paid'
        )
        Payment.objects.get_or_create(
            subscription=spotify,
            amount=Decimal('10900'), currency='KRW', status='paid'
        )

        self.stdout.write(self.style.SUCCESS("샘플 데이터 생성 완료!"))
