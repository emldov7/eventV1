"""
Configuration du broker Django pour Celery
"""
from kombu.utils.url import safequote
from kombu import Queue
from django.conf import settings

# Configuration du broker Django
BROKER_URL = 'django://'

# Configuration des queues
CELERY_TASK_DEFAULT_QUEUE = 'default'
CELERY_TASK_QUEUES = (
    Queue('default', routing_key='default'),
    Queue('reminders', routing_key='reminders'),
)

# Configuration des routes
CELERY_TASK_ROUTES = {
    'events.tasks.check_scheduled_reminders': {'queue': 'reminders'},
    'events.tasks.send_reminder_task': {'queue': 'reminders'},
}

# Configuration des résultats
CELERY_RESULT_BACKEND = 'django-db'
CELERY_RESULT_EXPIRES = 3600  # 1 heure

# Configuration des tâches
CELERY_TASK_ALWAYS_EAGER = False  # Désactiver pour les tests
CELERY_TASK_EAGER_PROPAGATES = True
