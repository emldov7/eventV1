import os
from celery import Celery

# Configuration de Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_management.settings')

app = Celery('event_management')

# Configuration Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# Découverte automatique des tâches
app.autodiscover_tasks()

# Configuration du broker en mémoire
app.conf.update(
    broker_url='memory://',
    result_backend='django-db',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Paris',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Configuration des tâches périodiques pour les rappels automatiques
app.conf.beat_schedule = {
    'check-scheduled-reminders': {
        'task': 'events.tasks.check_scheduled_reminders',
        'schedule': 60.0,  # Vérifier toutes les minutes
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

