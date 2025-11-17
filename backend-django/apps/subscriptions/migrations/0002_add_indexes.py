# apps/subscriptions/migrations/0002_add_indexes.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        # (user, active, next_payment_date) 복합 인덱스: 사용자 마이페이지/대시보드 정렬에 유리
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(
                fields=['user', 'active', 'next_payment_date'],
                name='sub_user_active_nextpay_idx'
            )
        ),
        # name 검색 최적화 (간단 인덱스)
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['name'], name='sub_name_idx'),
        ),
    ]
