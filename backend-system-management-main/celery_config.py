"""
Configuration Celery pour l'application Event Management
"""

import os
from celery import Celery
from django.conf import settings

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_management.settings')

# Création de l'instance Celery
app = Celery('event_management')

# Configuration depuis les settings Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Découverte automatique des tâches
app.autodiscover_tasks()

# Configuration des tâches périodiques
app.conf.beat_schedule = {
    'check-scheduled-reminders': {
        'task': 'events.tasks.check_scheduled_reminders',
        'schedule': 60.0,  # Toutes les minutes
    },
}

app.conf.timezone = 'Europe/Paris'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
