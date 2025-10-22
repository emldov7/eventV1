"""
Commande Django pour créer un super utilisateur si nécessaire
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings


class Command(BaseCommand):
    """Commande Django pour créer un super utilisateur si nécessaire"""

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('Super utilisateur déjà existant')
            return

        username = getattr(settings, 'SUPERUSER_USERNAME', 'admin')
        email = getattr(settings, 'SUPERUSER_EMAIL', 'admin@example.com')
        password = getattr(settings, 'SUPERUSER_PASSWORD', 'admin123')

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        self.stdout.write(
            self.style.SUCCESS(f'Super utilisateur créé: {username}')
        )
