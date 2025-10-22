"""
Middleware pour capturer et logger toutes les requêtes entrantes
"""
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """Middleware pour logger toutes les requêtes"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log de la requête entrante
        print("🔍 DEBUG: ===== REQUÊTE ENTRANTE =====")
        print(f"🔍 DEBUG: Method: {request.method}")
        print(f"🔍 DEBUG: Path: {request.path}")
        print(f"🔍 DEBUG: Full path: {request.get_full_path()}")
        print(f"🔍 DEBUG: User: {getattr(request, 'user', 'ANONYME')}")
        print(f"🔍 DEBUG: Authorization: {request.META.get('HTTP_AUTHORIZATION', 'AUCUN')}")
        print(f"🔍 DEBUG: Content-Type: {request.META.get('CONTENT_TYPE', 'AUCUN')}")
        print(f"🔍 DEBUG: User-Agent: {request.META.get('HTTP_USER_AGENT', 'AUCUN')}")
        
        # Log du body pour les requêtes POST/PUT/PATCH (limité à 1KB pour éviter les erreurs)
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                content_length = int(request.META.get('CONTENT_LENGTH', 0))
                if content_length > 1024:  # Limite à 1KB
                    print(f"🔍 DEBUG: Body: [TROP VOLUMINEUX - {content_length} bytes]")
                else:
                    print(f"🔍 DEBUG: Body: {request.body}")
            except (ValueError, TypeError):
                print(f"🔍 DEBUG: Body: [ERREUR LECTURE TAILLE]")
        
        # Log des paramètres GET
        if request.GET:
            print(f"🔍 DEBUG: GET params: {dict(request.GET)}")
        
        print("🔍 DEBUG: ================================")
        
        # Traitement de la requête
        response = self.get_response(request)
        
        # Log de la réponse
        print("🔍 DEBUG: ===== RÉPONSE =====")
        print(f"🔍 DEBUG: Status: {response.status_code}")
        print(f"🔍 DEBUG: Content-Type: {response.get('Content-Type', 'AUCUN')}")
        print(f"🔍 DEBUG: Content-Length: {response.get('Content-Length', 'AUCUN')}")
        print("🔍 DEBUG: ===================")
        
        return response