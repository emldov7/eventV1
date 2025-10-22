from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TicketType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Nom du billet')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('price', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Prix')),
                ('quantity', models.PositiveIntegerField(blank=True, null=True, verbose_name='Quantité disponible')),
                ('is_vip', models.BooleanField(default=False, verbose_name='Billet VIP')),
                ('sale_start', models.DateTimeField(blank=True, null=True, verbose_name='Début de vente')),
                ('sale_end', models.DateTimeField(blank=True, null=True, verbose_name='Fin de vente')),
                ('sold_count', models.PositiveIntegerField(default=0, verbose_name='Billets vendus')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ticket_types', to='events.event', verbose_name='Événement')),
            ],
            options={
                'verbose_name': 'Type de billet',
                'verbose_name_plural': 'Types de billets',
                'ordering': ['price', 'name'],
                'unique_together': {('event', 'name')},
            },
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='ticket_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='registrations', to='events.tickettype', verbose_name='Type de billet'),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='price_paid',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Prix payé'),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='payment_status',
            field=models.CharField(choices=[('unpaid', 'Non payé'), ('pending', 'En attente'), ('paid', 'Payé'), ('refunded', 'Remboursé')], default='unpaid', max_length=20, verbose_name='Statut de paiement'),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='payment_provider',
            field=models.CharField(blank=True, max_length=30, verbose_name='Fournisseur de paiement'),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='payment_reference',
            field=models.CharField(blank=True, max_length=100, verbose_name='Référence de paiement'),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='qr_token',
            field=models.CharField(blank=True, null=True, max_length=64, unique=True),
        ),
        migrations.AddField(
            model_name='eventregistration',
            name='qr_code',
            field=models.ImageField(blank=True, null=True, upload_to='tickets/qr/', verbose_name='QR Code'),
        ),
        migrations.AlterField(
            model_name='eventregistration',
            name='status',
            field=models.CharField(choices=[('pending', 'En attente'), ('confirmed', 'Confirmée'), ('cancelled', 'Annulée'), ('attended', 'Présent'), ('no_show', 'Absent'), ('waitlisted', "Liste d'attente")], default='pending', max_length=20, verbose_name='Statut'),
        ),
    ]

