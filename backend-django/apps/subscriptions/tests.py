# 간단한 단위/통합 테스트로 모델/API 기본 동작을 검증합니다.
# IntelliJ에서 우클릭 → Run 'tests' 로 실행할 수 있습니다.
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Subscription
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class SubscriptionApiTests(TestCase):
    def setUp(self):
        # 테스트용 사용자/클라이언트 준비
        self.user = User.objects.create_user(username='tester', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # 기본 카테고리/구독 준비
        self.category = Category.objects.create(name='영상')
        self.sub = Subscription.objects.create(
            user=self.user, name='Netflix', category=self.category,
            price=Decimal('13500'), currency='KRW', billing_cycle='monthly',
            next_payment_date=timezone.now().date() + timedelta(days=5),
            active=True
        )

    def test_list_subscriptions(self):
        # 내 구독 리스트 조회가 200 OK 인지 확인
        url = reverse('subscription-list')  # router.register basename='subscription'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data['results']) >= 1)

    def test_create_subscription(self):
        url = reverse('subscription-list')
        payload = {
            "name": "Spotify",
            "category": self.category.id,
            "price": "10900.00",
            "currency": "KRW",
            "billing_cycle": "monthly",
            "next_payment_date": (timezone.now().date() + timedelta(days=3)).isoformat(),
            "active": True
        }
        res = self.client.post(url, data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], "Spotify")
