# Generated manually
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('icon', models.CharField(blank=True, max_length=100, null=True)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Subscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='KRW', max_length=10)),
                ('billing_cycle', models.CharField(choices=[('monthly', 'Monthly'), ('annual', 'Annual'), ('custom', 'Custom')], default='monthly', max_length=20)),
                ('billing_cycle_days', models.IntegerField(blank=True, null=True)),
                ('next_payment_date', models.DateField(blank=True, null=True)),
                ('active', models.BooleanField(default=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('logo_url', models.URLField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='subscriptions.category')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subscriptions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(default='KRW', max_length=10)),
                ('paid_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('pending', 'pending'), ('paid', 'paid'), ('failed', 'failed'), ('refunded', 'refunded')], default='paid', max_length=20)),
                ('provider_tx_id', models.CharField(blank=True, max_length=200, null=True)),
                ('raw_payload', models.JSONField(blank=True, null=True)),
                ('subscription', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='subscriptions.subscription')),
            ],
        ),
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['user', 'active'], name='subscriptio_user_id_active_idx'),
        ),
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['next_payment_date'], name='subscriptio_next_pay_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['paid_at'], name='subscriptio_paid_at_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['status'], name='subscriptio_status_idx'),
        ),
    ]

