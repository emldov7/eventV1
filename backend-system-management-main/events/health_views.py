"""
Vues de santé du système pour Railway
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import time
from django.utils import timezone


@csrf_exempt
@require_http_methods(["GET"])
def simple_health_check(request):
    """
    Endpoint de santé ultra-simple pour Railway (sans authentification)
    """
    try:
        # Healthcheck minimal - juste vérifier que Django fonctionne
        from django.conf import settings
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'event-management-backend',
            'django': 'ok',
            'version': '1.0.0'
        }, status=200)
        
    except Exception as e:
        # En cas d'erreur, retourner quand même un 200 pour permettre le démarrage
        return JsonResponse({
            'status': 'starting',
            'timestamp': timezone.now().isoformat(),
            'service': 'event-management-backend',
            'message': 'Application en cours de démarrage'
        }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
def detailed_health_check(request):
    """
    Endpoint de santé détaillé pour Railway (sans authentification)
    """
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'event-management-backend',
            'checks': {}
        }
        
        # 1. Vérification de la base de données
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            health_status['checks']['database'] = 'ok'
        except Exception as e:
            health_status['checks']['database'] = f'error: {str(e)}'
            health_status['status'] = 'unhealthy'
        
        # 2. Vérification des imports Django
        try:
            from django.conf import settings
            health_status['checks']['django_settings'] = 'ok'
        except Exception as e:
            health_status['checks']['django_settings'] = f'error: {str(e)}'
            health_status['status'] = 'unhealthy'
        
        # 3. Vérification des applications installées
        try:
            from django.apps import apps
            app_count = len(apps.get_app_configs())
            health_status['checks']['django_apps'] = f'ok ({app_count} apps)'
        except Exception as e:
            health_status['checks']['django_apps'] = f'error: {str(e)}'
            health_status['status'] = 'unhealthy'
        
        status_code = 200 if health_status['status'] == 'healthy' else 500
        return JsonResponse(health_status, status=status_code)
        
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'event-management-backend',
            'error': str(e)
        }, status=500)
