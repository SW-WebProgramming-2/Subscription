# backend-django/apps/subscriptions/views.py
# -------------------------------------------------
# 이 파일은 실제 API 동작을 정의하는 Django REST Framework의 ViewSet들을 포함합니다.
# 즉, GET / POST / PUT / DELETE 요청에 대해 어떤 로직이 실행될지를 결정하는 부분입니다.

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Subscription, Payment
from .serializers import CategorySerializer, SubscriptionSerializer, PaymentSerializer
from . import services

# 커스텀 권한 클래스: 오브젝트의 소유자만 수정/삭제 가능하게 함
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    읽기(GET, HEAD, OPTIONS)는 누구나 가능하지만,
    수정/삭제(PUT, DELETE)는 해당 객체의 '소유자(user)'만 가능하게 하는 권한 클래스
    """
    def has_object_permission(self, request, view, obj):
        # GET, HEAD 등 안전한 요청은 허용
        if request.method in permissions.SAFE_METHODS:
            return True

        # Subscription이나 Payment 모델의 user 확인
        owner = getattr(obj, 'user', None)
        if not owner and hasattr(obj, 'subscription'):
            owner = getattr(obj.subscription, 'user', None)

        return owner == request.user


# CategoryViewSet: 카테고리(Category) CRUD API
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]  # 검색 기능 추가
    search_fields = ['name', 'description']   # name, description에서 검색 가능


# SubscriptionViewSet: 구독(Subscription) CRUD API
class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related('category', 'user').all()
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    # 필터, 검색, 정렬 기능 활성화
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'active', 'currency', 'billing_cycle']
    search_fields = ['name', 'metadata']
    ordering_fields = ['next_payment_date', 'price', 'created_at']
    ordering = ['next_payment_date']  # 기본 정렬 기준

    def get_queryset(self):
        """
        인증된 사용자는 자신의 구독만 볼 수 있도록 제한.
        관리자는 전체 데이터 접근 가능.
        """
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.is_staff:
            return qs.filter(user=user)

        return qs

    def perform_create(self, serializer):
        """
        새 구독을 생성할 때 현재 로그인한 사용자를 자동으로 연결.
        """
        serializer.save(user=self.request.user)


# PaymentViewSet: 결제 내역(Payment) CRUD API
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('subscription').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'currency', 'subscription']
    ordering = ['-paid_at']  # 최신 결제부터 표시

    def get_queryset(self):
        """
        사용자 본인의 구독 결제 내역만 볼 수 있도록 제한.
        관리자는 전체 데이터 접근 가능.
        """
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.is_staff:
            return qs.filter(subscription__user=user)

        return qs


# -------------------------------------------------
# DashboardViewSet: 대시보드 관련 통계 API
# -------------------------------------------------
class DashboardViewSet(viewsets.ViewSet):
    """
    대시보드용 통계 API 집합:
    - /api/dashboard/monthly-total/
    - /api/dashboard/category-breakdown/
    - /api/dashboard/upcoming-payments/
    """

    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def monthly_total(self, request):
        total = services.get_monthly_total(request.user)
        return Response({"monthly_total": total})

    @action(detail=False, methods=['get'])
    def category_breakdown(self, request):
        data = services.get_category_breakdown(request.user)
        return Response({"category_breakdown": data})

    @action(detail=False, methods=['get'])
    def upcoming_payments(self, request):
        data = services.get_upcoming_payments(request.user)
        return Response({"upcoming_payments": data})




# views.py (예시) - 이미 일부 적용했지만 확실히 고정
class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = (Subscription.objects
                .select_related('category', 'user')         # FK 단건 조인
                .prefetch_related('payments'))              # 역참조(N개) 프리패치