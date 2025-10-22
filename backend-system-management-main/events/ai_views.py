"""
Vues API pour l'Intelligence Artificielle - Chatbot intelligent
Fournit des endpoints REST pour l'interaction avec le chatbot IA
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User

from .ai_service import chatbot
from .models import Event, EventRegistration

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_ai(request):
    """
    Endpoint principal pour discuter avec le chatbot IA
    
    POST /api/ai/chat/
    {
        "message": "Comment rejoindre un stream ?",
        "event_id": 123  # Optionnel, pour le contexte
    }
    """
    try:
        # Récupérer le message de l'utilisateur
        message = request.data.get('message', '').strip()
        event_id = request.data.get('event_id')
        
        if not message:
            return Response({
                "success": False,
                "error": "Le message ne peut pas être vide"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log de la conversation
        logger.info(f"🤖 Chatbot - User: {request.user.username}, Message: {message[:100]}...")
        
        # Ajouter le contexte de l'événement si fourni
        context = {}
        if event_id:
            try:
                event = Event.objects.get(id=event_id)
                context['event'] = {
                    'id': event.id,
                    'title': event.title,
                    'type': event.event_type,
                    'price': float(event.price) if event.price else 0,
                    'is_free': event.is_free
                }
            except Event.DoesNotExist:
                pass
        
        # Générer la réponse avec le chatbot
        ai_response = chatbot.generate_response(message, request.user)
        
        # Ajouter le contexte utilisateur
        user_context = chatbot.get_user_context(request.user)
        ai_response['user_context'] = user_context
        ai_response['event_context'] = context
        
        # Log de la réponse
        logger.info(f"🤖 Chatbot - Response intent: {ai_response.get('intent', 'unknown')}")
        
        return Response(ai_response, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Erreur dans chat_with_ai: {e}")
        return Response({
            "success": False,
            "error": "Erreur interne du serveur",
            "response": "Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_suggestions(request):
    """
    Récupère des suggestions intelligentes pour l'utilisateur
    
    GET /api/ai/suggestions/
    """
    try:
        user = request.user
        user_context = chatbot.get_user_context(user)
        
        # Générer des suggestions personnalisées
        suggestions = []
        
        # Suggestions pour les organisateurs
        if user_context.get('is_organizer') or user_context.get('is_super_admin'):
            suggestions.extend([
                {
                    "text": "Comment créer un événement virtuel ?",
                    "intent": "events",
                    "type": "question"
                },
                {
                    "text": "Comment configurer le streaming ?",
                    "intent": "streaming", 
                    "type": "question"
                },
                {
                    "text": "Voir mes événements",
                    "intent": "events",
                    "type": "action"
                }
            ])
        
        # Suggestions pour les participants
        else:
            suggestions.extend([
                {
                    "text": "Comment rejoindre un stream ?",
                    "intent": "streaming",
                    "type": "question"
                },
                {
                    "text": "Comment m'inscrire à un événement ?",
                    "intent": "events",
                    "type": "question"
                },
                {
                    "text": "Problème de paiement",
                    "intent": "payment",
                    "type": "question"
                }
            ])
        
        # Suggestions communes
        suggestions.extend([
            {
                "text": "Support technique",
                "intent": "technical",
                "type": "question"
            },
            {
                "text": "Voir les événements disponibles",
                "intent": "events",
                "type": "action"
            }
        ])
        
        return Response({
            "success": True,
            "suggestions": suggestions[:6],  # Limiter à 6 suggestions
            "user_context": user_context
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Erreur dans get_ai_suggestions: {e}")
        return Response({
            "success": False,
            "error": "Erreur lors de la récupération des suggestions"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_help_with_event(request, event_id):
    """
    Aide contextuelle IA pour un événement spécifique
    
    POST /api/ai/help/event/{event_id}/
    {
        "question": "Comment rejoindre cet événement ?"
    }
    """
    try:
        # Récupérer l'événement
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({
                "success": False,
                "error": "Événement non trouvé"
            }, status=status.HTTP_404_NOT_FOUND)
        
        question = request.data.get('question', '').strip()
        if not question:
            # Génerer une aide contextuelle automatique
            question = f"Aide-moi avec l'événement {event.title}"
        
        # Créer un message contextualisé
        contextualized_message = f"Pour l'événement '{event.title}' : {question}"
        
        # Générer la réponse avec le contexte de l'événement
        ai_response = chatbot.generate_response(contextualized_message, request.user)
        
        # Ajouter des informations spécifiques à l'événement
        event_info = {
            "id": event.id,
            "title": event.title,
            "type": event.event_type,
            "price": float(event.price) if event.price else 0,
            "is_free": event.is_free,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "status": event.status
        }
        
        # Vérifier si l'utilisateur est inscrit
        user_registration = None
        try:
            registration = EventRegistration.objects.get(event=event, user=request.user)
            user_registration = {
                "status": registration.status,
                "payment_status": registration.payment_status,
                "can_join_stream": registration.status == 'confirmed' and registration.payment_status == 'paid'
            }
        except EventRegistration.DoesNotExist:
            user_registration = {
                "status": "not_registered",
                "payment_status": "none",
                "can_join_stream": False
            }
        
        ai_response['event_info'] = event_info
        ai_response['user_registration'] = user_registration
        
        return Response(ai_response, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Erreur dans ai_help_with_event: {e}")
        return Response({
            "success": False,
            "error": "Erreur lors de la génération de l'aide contextuelle"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_public_info(request):
    """
    Informations publiques sur le système IA
    
    GET /api/ai/info/
    """
    try:
        return Response({
            "success": True,
            "ai_info": {
                "name": "Assistant Événements IA",
                "version": "1.0.0",
                "description": "Assistant virtuel intelligent pour la gestion d'événements",
                "capabilities": [
                    "Aide à l'inscription aux événements",
                    "Support pour le streaming en direct", 
                    "Assistance technique",
                    "Information sur les paiements",
                    "Création d'événements (organisateurs)"
                ],
                "languages": ["français"],
                "available_24_7": True
            },
            "sample_questions": [
                "Comment m'inscrire à un événement ?",
                "Comment rejoindre un stream en direct ?",
                "J'ai un problème de paiement",
                "Comment créer un événement ?",
                "Support technique"
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Erreur dans ai_public_info: {e}")
        return Response({
            "success": False,
            "error": "Erreur lors de la récupération des informations"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_feedback(request):
    """
    Collecte les retours sur les réponses de l'IA
    
    POST /api/ai/feedback/
    {
        "message": "Comment rejoindre un stream ?",
        "ai_response": "...",
        "rating": 5,
        "comment": "Très utile !"
    }
    """
    try:
        message = request.data.get('message', '')
        ai_response = request.data.get('ai_response', '')
        rating = request.data.get('rating', 0)
        comment = request.data.get('comment', '')
        
        # Log du feedback pour amélioration future
        logger.info(f"🤖 AI Feedback - User: {request.user.username}, Rating: {rating}/5")
        logger.info(f"🤖 AI Feedback - Message: {message[:100]}...")
        logger.info(f"🤖 AI Feedback - Comment: {comment}")
        
        # TODO: Sauvegarder en base de données pour analyse future
        
        return Response({
            "success": True,
            "message": "Merci pour votre retour ! Cela nous aide à améliorer l'assistant IA."
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Erreur dans ai_feedback: {e}")
        return Response({
            "success": False,
            "error": "Erreur lors de l'enregistrement du feedback"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
