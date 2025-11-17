# apps/subscriptions/migrations/0004_add_trigram_index.py
from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_add_payment_indexes'),
    ]

    operations = [
        # PostgreSQL trigram 확장 설치 (슈퍼유저 권한 필요)
        # 주의: 실제 데이터베이스에서 슈퍼유저 권한이 필요합니다.
        # Docker 환경에서는 일반적으로 가능하지만, 프로덕션에서는 별도 권한이 필요할 수 있습니다.
        TrigramExtension(),
        
        # name 컬럼에 trigram GIN 인덱스 추가
        # 이 인덱스는 부분 문자열 검색(ILIKE, LIKE) 성능을 크게 향상시킵니다.
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS sub_name_trgm_idx
                ON subscriptions_subscription
                USING gin (name gin_trgm_ops);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS sub_name_trgm_idx;
            """
        ),
    ]

