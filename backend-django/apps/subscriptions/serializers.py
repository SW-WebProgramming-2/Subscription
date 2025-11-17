# backend-django/apps/subscriptions/serializers.py
# -------------------------------------------------
# 이 파일은 Django REST Framework에서 사용하는 직렬화(Serializer) 정의 파일입니다.
# 각 모델(Category, Subscription, Payment)을 JSON 형태로 변환하거나,
# 클라이언트에서 전송된 JSON 데이터를 Django 모델 객체로 변환할 때 사용됩니다.

from rest_framework import serializers
from django.conf import settings
from .models import Category, Subscription, Payment

# CategorySerializer: 구독 카테고리 정보를 직렬화/역직렬화하는 클래스
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'description']  # 변환할 필드 지정


# PaymentSerializer: 결제(Payment) 정보를 JSON으로 변환하는 클래스
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'amount', 'currency',
            'paid_at', 'status', 'provider_tx_id', 'raw_payload'
        ]
        read_only_fields = ['id', 'paid_at']  # 읽기 전용 필드 지정


# SubscriptionSerializer: 구독(Subscription) 정보를 JSON으로 변환하는 클래스
class SubscriptionSerializer(serializers.ModelSerializer):
    # 하나의 구독에는 여러 결제(Payment)가 연결될 수 있으므로, 이를 포함해 보여줌
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'name', 'category', 'price', 'currency',
            'billing_cycle', 'billing_cycle_days', 'next_payment_date',
            'active', 'metadata', 'logo_url', 'created_at', 'updated_at',
            'payments'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'payments']

    def create(self, validated_data):
        """
        새로운 구독을 생성할 때, 요청(request)에 포함된 로그인 사용자(request.user)를
        자동으로 user 필드에 연결하는 함수입니다.
        """
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        # 인증된 사용자일 경우 user 필드를 자동으로 설정
        if user and user.is_authenticated:
            validated_data['user'] = user

        return super().create(validated_data)

