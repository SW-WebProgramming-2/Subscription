# apps/subscriptions/migrations/0003_add_payment_indexes.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_add_indexes'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(
                fields=['status', 'paid_at'],
                name='pay_status_paid_idx'
            )
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(
                fields=['subscription', 'paid_at'],
                name='pay_sub_paid_idx'
            )
        ),
    ]
