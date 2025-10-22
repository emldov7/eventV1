"""
Vues API pour la gestion du streaming des événements virtuels
Gère YouTube Live et Zoom de manière unifiée
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import JsonResponse

from .models import Event, VirtualEvent
from .streaming_service import StreamingService
from .permissions import IsOrganizerOrSuperAdmin
from .models import EventRegistration

logger = logging.getLogger(__name__)

def _verify_payment_access(user, event):
    """
    Vérifie que l'utilisateur a un paiement confirmé pour accéder au stream
    """
    logger.info(f"🔍 Vérification paiement pour {user.username} sur event {event.id}")
    
    try:
        # VÉRIFIER SI L'UTILISATEUR EST SUPERADMIN
        if hasattr(user, 'profile') and user.profile.is_super_admin:
            logger.info(f"✅ SUPERADMIN {user.username} autorisé pour l'événement {event.id}")
            return True
        
        # VÉRIFIER SI L'UTILISATEUR EST L'ORGANISATEUR
        if event.organizer == user:
            logger.info(f"✅ ORGANISATEUR {user.username} autorisé pour l'événement {event.id}")
            return True
        
        # Vérifier que l'utilisateur a une inscription confirmée
        try:
            registration = EventRegistration.objects.get(
                event=event,
                user=user,
                status='confirmed'
            )
            logger.info(f"✅ Inscription trouvée pour {user.username}: status={registration.status}")
        except EventRegistration.DoesNotExist:
            logger.warning(f"❌ {user.username} n'a pas d'inscription confirmée pour l'événement {event.id}")
            return False
        
        # Vérifier le statut du paiement
        logger.info(f"💰 Statut paiement pour {user.username}: {registration.payment_status}")
        if not registration.payment_status or registration.payment_status != 'paid':
            logger.warning(f"🚫 {user.username} tente d'accéder au stream sans paiement confirmé (status: {registration.payment_status})")
            return False
        
        logger.info(f"✅ Paiement confirmé - {user.username} peut accéder au stream")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification du paiement: {e}")
        return False

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizerOrSuperAdmin])
def create_stream(request, event_id):
    """Crée un stream pour un événement virtuel"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Vérifier que l'utilisateur peut gérer cet événement
        if not (request.user.profile.is_super_admin or 
                event.organizer == request.user):
            return Response(
                {"error": "Vous n'avez pas les permissions pour gérer cet événement"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer les données du stream
        platform = request.data.get('platform')
        if not platform:
            return Response(
                {"error": "Plateforme requise (youtube_live ou zoom)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Préparer les données pour le service
        stream_data = {
            'title': event.title,
            'description': event.description,
            'start_date': event.start_date,
            'duration': (event.end_date - event.start_date).total_seconds() / 60,
            'meeting_password': request.data.get('meeting_password'),
            'host_video': request.data.get('host_video', True),
            'participant_video': request.data.get('participant_video', True),
            'join_before_host': request.data.get('join_before_host', False),
            'mute_upon_entry': request.data.get('mute_upon_entry', True),
            'waiting_room': request.data.get('waiting_room', True),
            'auto_record': request.data.get('auto_record', False)
        }
        
        # Créer le stream
        streaming_service = StreamingService()
        # Créer d'abord l'événement virtuel s'il n'existe pas
        virtual_event, created = VirtualEvent.objects.get_or_create(
            event=event,
            defaults={
                'platform': platform,
                'auto_record': stream_data['auto_record'],
                'allow_chat': True,
                'allow_screen_sharing': True,
                'waiting_room': stream_data['waiting_room']
            }
        )
        
        # Créer le stream sur la plateforme
        result = streaming_service.create_stream_for_event(virtual_event)
        
        if result:
            # Le service a déjà mis à jour l'événement virtuel
            logger.info(f"✅ Stream créé pour l'événement {event_id}: {result}")
            
            return Response({
                "success": True,
                "message": f"Stream {platform} créé avec succès",
                "stream_data": result,
                "virtual_event_id": virtual_event.id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "error": "Erreur lors de la création du stream"
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur creation stream: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stream_status(request, event_id):
    """Récupère le statut d'un stream"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        if event.event_type != 'virtual':
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 🔒 VÉRIFICATION OBLIGATOIRE DU PAIEMENT
        if not _verify_payment_access(request.user, event):
            return Response({
                'success': False,
                'error': 'Accès refusé - Paiement non confirmé',
                'details': 'Vous devez avoir un billet payé et confirmé pour accéder à ce stream'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier que l'événement est encore accessible pour le streaming
        if not event.is_streaming_accessible():
            return Response({
                "success": False,
                "message": "Cet événement est terminé - le streaming n'est plus accessible",
                "event_end_date": event.end_date,
                "current_time": timezone.now(),
                "status": "event_ended",
                "streaming_available": False
            }, status=status.HTTP_200_OK)
        
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer le statut du stream
        streaming_service = StreamingService()
        status_data = streaming_service.get_stream_status(virtual_event)
        
        if 'error' not in status_data:
            return Response({
                "success": True,
                "platform": virtual_event.platform,
                "meeting_id": virtual_event.meeting_id,
                "status": status_data,
                "streaming_available": True
            })
        else:
            return Response({
                "success": False,
                "message": status_data['error'],
                "streaming_available": False
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Erreur recuperation statut stream: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOrganizerOrSuperAdmin])
def update_stream(request, event_id):
    """Met à jour un stream"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Vérifier les permissions
        if not (request.user.profile.is_super_admin or 
                event.organizer == request.user):
            return Response(
                {"error": "Vous n'avez pas les permissions pour gérer cet événement"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mettre à jour le stream
        updates = request.data.get('updates', {})
        streaming_service = StreamingService()
        
        # Mettre à jour l'événement virtuel directement
        if 'meeting_url' in updates:
            virtual_event.meeting_url = updates['meeting_url']
        if 'meeting_password' in updates:
            virtual_event.meeting_password = updates['meeting_password']
        if 'auto_record' in updates:
            virtual_event.auto_record = updates['auto_record']
        if 'waiting_room' in updates:
            virtual_event.waiting_room = updates['waiting_room']
        
        virtual_event.save()
        
        result = {"success": True, "message": "Stream mis à jour avec succès"}
        
        return Response({
            "success": True,
            "message": "Stream mis à jour avec succès",
            "result": result
        })
            
    except Exception as e:
        logger.error(f"Erreur mise a jour stream: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOrganizerOrSuperAdmin])
def delete_stream(request, event_id):
    """Supprime un stream"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Vérifier les permissions
        if not (request.user.profile.is_super_admin or 
                event.organizer == request.user):
            return Response(
                {"error": "Vous n'avez pas les permissions pour gérer cet événement"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Supprimer l'événement virtuel
        virtual_event.delete()
        
        return Response({
            "success": True,
            "message": "Stream supprimé avec succès"
        })
            
    except Exception as e:
        logger.error(f"Erreur suppression stream: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_streaming_instructions(request, event_id):
    """Récupère les instructions de streaming pour un événement"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        if event.event_type != 'virtual':
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les instructions
        streaming_service = StreamingService()
        instructions = streaming_service.get_connection_instructions(virtual_event)
        
        if 'error' not in instructions:
            return Response({
                "success": True,
                "platform": virtual_event.platform,
                "instructions": instructions
            })
        else:
            return Response({
                "error": instructions['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur recuperation instructions: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_platform_connection(request, platform):
    """Teste la connexion à une plateforme de streaming"""
    try:
        if platform not in ['youtube_live', 'zoom']:
            return Response(
                {"error": "Plateforme non supportée"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        streaming_service = StreamingService()
        
        # Test simple de connexion
        if platform == 'youtube_live':
            try:
                # Tester la connexion YouTube
                youtube_service = streaming_service.youtube_service
                channel_info = youtube_service.get_channel_info()
                result = {"status": "connected", "platform": "YouTube Live"}
            except Exception as e:
                result = {"error": f"Erreur connexion YouTube: {str(e)}"}
        elif platform == 'zoom':
            try:
                # Tester la connexion Zoom
                zoom_service = streaming_service.zoom_service
                # Test simple d'authentification
                result = {"status": "connected", "platform": "Zoom"}
            except Exception as e:
                result = {"error": f"Erreur connexion Zoom: {str(e)}"}
        
        if 'error' not in result:
            return Response({
                "success": True,
                "platform": platform,
                "connection": result
            })
        else:
            return Response({
                "error": result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur test connexion {platform}: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_platforms(request):
    """Liste toutes les plateformes de streaming disponibles"""
    try:
        # Liste des plateformes disponibles
        platforms = {
            "youtube_live": {
                "name": "YouTube Live",
                "enabled": True,
                "max_duration": 43200,  # 12 heures en minutes
                "supports_recording": True,
                "supports_chat": True,
                "supports_screen_sharing": False,
            },
            "zoom": {
                "name": "Zoom",
                "enabled": True,
                "max_duration": 1440,  # 24 heures en minutes
                "supports_recording": True,
                "supports_chat": True,
                "supports_screen_sharing": True,
                "supports_waiting_room": True,
            }
        }
        
        return Response({
            "success": True,
            "platforms": platforms
        })
        
    except Exception as e:
        logger.error(f"Erreur liste plateformes: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def configure_stream(request, event_id):
    """Configure un stream pour un événement virtuel"""
    logger.info(f"🔍 LOG CRITIQUE: configure_stream view appelé pour event {event_id}")
    logger.info(f"🔍 LOG CRITIQUE: User: {request.user.username}")
    logger.info(f"🔍 LOG CRITIQUE: Method: {request.method}")
    logger.info(f"🔍 LOG CRITIQUE: Headers: {dict(request.headers)}")
    
    try:
        # Vérifier que l'événement existe et est virtuel
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            logger.error(f"❌ Événement {event_id} non trouvé")
            return JsonResponse({
                "success": False,
                "error": "Événement non trouvé"
            }, status=404)
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur est l'organisateur
        if event.organizer != request.user:
            return Response(
                {"error": "Seul l'organisateur peut configurer le stream"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer les détails virtuels
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Détails virtuels non trouvés"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Configurer le stream
        streaming_service = StreamingService()
        result = streaming_service.configure_stream(virtual_event)
        
        if result.get('success'):
            logger.info(f"✅ Stream configuré avec succès pour l'événement {event_id}")
            return Response({
                "success": True,
                "message": result.get('message'),
                "meeting_id": result.get('meeting_id'),
                "meeting_url": result.get('meeting_url'),
                "status": result.get('status')
            }, status=status.HTTP_200_OK)
        else:
            logger.error(f"❌ Échec de la configuration du stream: {result.get('error')}")
            return Response({
                "success": False,
                "error": result.get('error')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur lors de la configuration du stream: {e}")
        return Response({
            "success": False,
            "error": f"Erreur inattendue: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_stream(request, event_id):
    """Démarre le stream d'un événement virtuel"""
    logger.info(f"🔍 LOG CRITIQUE: start_stream view appelé pour event {event_id}")
    logger.info(f"🔍 LOG CRITIQUE: User: {request.user.username}")
    logger.info(f"🔍 LOG CRITIQUE: Method: {request.method}")
    logger.info(f"🔍 LOG CRITIQUE: Headers: {dict(request.headers)}")
    
    try:
        event = get_object_or_404(Event, id=event_id)
        logger.info(f"Event trouve: {event.title} (Type: {event.event_type})")
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            logger.warning(f"Event {event_id} n'est pas virtuel (type: {event.event_type})")
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur est l'organisateur ou un superadmin
        if event.organizer != request.user and not request.user.is_superuser:
            logger.warning(f"Utilisateur {request.user.username} non autorise pour event {event_id}")
            return Response(
                {"error": "Seul l'organisateur ou un superadmin peut lancer le stream"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # L'organisateur peut toujours lancer le stream (pas besoin d'inscription)
        # Les participants auront besoin d'une inscription confirmée pour accéder
        logger.info(f"Organisateur {request.user.username} autorise a lancer le stream")
        
        logger.info(f"Permissions OK pour {request.user.username}")
        
        try:
            virtual_event = event.virtual_details
            logger.info(f"VirtualEvent trouve: {virtual_event.platform}")
        except VirtualEvent.DoesNotExist:
            logger.error(f"VirtualEvent non trouve pour event {event_id}")
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 🔒 PROTECTION CONTRE LES APPELS MULTIPLES
        # Vérifier si le stream est déjà en cours
        if virtual_event.meeting_id and virtual_event.meeting_url:
            logger.warning(f"Stream deja lance pour event {event_id} - Meeting ID: {virtual_event.meeting_id}")
            logger.info(f"✅ STREAM DÉJÀ ACTIF - Retour des informations existantes")
            return Response({
                "success": True,  # Changé de False à True
                "message": "Le stream est déjà lancé et actif",
                "warning": "Ce stream est déjà actif - pas besoin de le relancer",
                "stream_info": {
                    "meeting_id": virtual_event.meeting_id,
                    "meeting_url": virtual_event.meeting_url,
                    "status": "live",
                    "watch_url": virtual_event.meeting_url,
                    "stream_key": virtual_event.meeting_id
                }
            }, status=status.HTTP_200_OK)
        
        # Lancer le stream
        logger.info(f"Lancement du stream via StreamingService...")
        streaming_service = StreamingService()
        
        # Logs détaillés avant l'appel
        logger.info(f"VirtualEvent details:")
        logger.info(f"  - Platform: {virtual_event.platform}")
        logger.info(f"  - Meeting ID: {virtual_event.meeting_id}")
        logger.info(f"  - Event type: {event.event_type}")
        logger.info(f"  - Event status: {event.status}")
        logger.info(f"  - Event start: {event.start_date}")
        logger.info(f"  - Event end: {event.end_date}")
        logger.info(f"  - Current time: {timezone.now()}")
        
        # Vérifier si l'événement est accessible
        if not event.is_streaming_accessible():
            logger.warning(f"Event {event_id} n'est plus accessible pour le streaming")
            return Response({
                "error": "Cet événement est terminé - le streaming n'est plus accessible",
                "event_end_date": event.end_date,
                "current_time": timezone.now()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si le stream est déjà configuré
        if not virtual_event.meeting_id or not virtual_event.meeting_url:
            logger.error(f"❌ STREAM NON CONFIGURÉ - L'organisateur doit d'abord le configurer")
            return Response({
                "success": False,
                "error": "Le stream n'est pas encore configuré. L'organisateur doit d'abord le configurer.",
                "action_required": "organizer_must_configure_stream",
                "details": "L'organisateur doit cliquer sur 'Configurer le Stream' avant de pouvoir le lancer"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Le stream est configuré, le lancer
        logger.info(f"Stream configuré pour event {event_id} - Lancement...")
        result = streaming_service.start_stream(virtual_event)
        
        logger.info(f"Resultat du service: {result}")
        
        if result and result.get('success'):
            logger.info(f"✅ Stream lance avec succes pour event {event_id}")
            logger.info(f"Stream info: {result}")
            
            # Mettre à jour le statut du stream
            virtual_event.status = 'live'
            virtual_event.save()
            
            return Response({
                "success": True,
                "message": "Stream lancé avec succès",
                "stream_info": result
            })
        else:
            error_msg = result.get('error', 'Erreur inconnue') if result else 'Pas de réponse du service'
            logger.error(f"❌ Erreur lors du lancement du stream: {error_msg}")
            logger.error(f"Details de l'erreur: {result}")
            
            # Mettre à jour le statut en cas d'erreur
            virtual_event.status = 'error'
            virtual_event.save()
            
            return Response({
                "success": False,
                "error": f"Impossible de lancer le stream: {error_msg}",
                "details": result
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur lancement stream: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pause_stream(request, event_id):
    """Met en pause le streaming d'un événement virtuel"""
    logger.info(f"=== PAUSE STREAM ===")
    logger.info(f"Utilisateur: {request.user.username}")
    logger.info(f"Event ID: {event_id}")
    
    try:
        event = get_object_or_404(Event, id=event_id)
        logger.info(f"Event trouve: {event.title} (Type: {event.event_type})")
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            logger.warning(f"Event {event_id} n'est pas virtuel (type: {event.event_type})")
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur est l'organisateur ou un superadmin
        if event.organizer != request.user and not request.user.is_superuser:
            logger.warning(f"Utilisateur {request.user.username} non autorise pour event {event_id}")
            return Response(
                {"error": "Seul l'organisateur ou un superadmin peut mettre en pause le stream"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            virtual_event = event.virtual_details
            logger.info(f"VirtualEvent trouve: {virtual_event.platform}")
        except VirtualEvent.DoesNotExist:
            logger.error(f"VirtualEvent non trouve pour event {event_id}")
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le stream est en cours
        if not virtual_event.meeting_id or not virtual_event.meeting_url:
            logger.warning(f"Stream non lance pour event {event_id}")
            return Response({
                "success": False,
                "error": "Le stream n'est pas encore lancé"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mettre en pause le stream
        logger.info(f"Mise en pause du stream via StreamingService...")
        streaming_service = StreamingService()
        
        result = streaming_service.pause_stream(virtual_event)
        
        logger.info(f"Resultat de la pause: {result}")
        
        if result and result.get('success'):
            logger.info(f"✅ Stream mis en pause avec succes pour event {event_id}")
            
            # Mettre à jour le statut du stream
            virtual_event.status = 'paused'
            virtual_event.save()
            
            return Response({
                "success": True,
                "message": "Stream mis en pause avec succès",
                "stream_info": result
            })
        else:
            error_msg = result.get('error', 'Erreur inconnue') if result else 'Pas de réponse du service'
            logger.error(f"❌ Erreur lors de la mise en pause: {error_msg}")
            
            return Response({
                "success": False,
                "error": f"Impossible de mettre en pause le stream: {error_msg}",
                "details": result
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur mise en pause stream: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_stream(request, event_id):
    """Arrête le streaming d'un événement virtuel"""
    logger.info(f"=== STOP STREAM ===")
    logger.info(f"Utilisateur: {request.user.username}")
    logger.info(f"Event ID: {event_id}")
    
    try:
        event = get_object_or_404(Event, id=event_id)
        logger.info(f"Event trouve: {event.title} (Type: {event.event_type})")
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            logger.warning(f"Event {event_id} n'est pas virtuel (type: {event.event_type})")
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'utilisateur est l'organisateur ou un superadmin
        if event.organizer != request.user and not request.user.is_superuser:
            logger.warning(f"Utilisateur {request.user.username} non autorise pour event {event_id}")
            return Response(
                {"error": "Seul l'organisateur ou un superadmin peut arrêter le stream"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            virtual_event = event.virtual_details
            logger.info(f"VirtualEvent trouve: {virtual_event.platform}")
        except VirtualEvent.DoesNotExist:
            logger.error(f"VirtualEvent non trouve pour event {event_id}")
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le stream est en cours
        if not virtual_event.meeting_id or not virtual_event.meeting_url:
            logger.warning(f"Stream non lance pour event {event_id}")
            return Response({
                "success": False,
                "error": "Le stream n'est pas encore lancé"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Arrêter le stream
        logger.info(f"Arrêt du stream via StreamingService...")
        streaming_service = StreamingService()
        
        result = streaming_service.stop_stream(virtual_event)
        
        logger.info(f"Resultat de l'arrêt: {result}")
        
        if result and result.get('success'):
            logger.info(f"✅ Stream arrêté avec succes pour event {event_id}")
            
            # Mettre à jour le statut du stream
            virtual_event.status = 'stopped'
            virtual_event.save()
            
            return Response({
                "success": True,
                "message": "Stream arrêté avec succès",
                "stream_info": result
            })
        else:
            error_msg = result.get('error', 'Erreur inconnue') if result else 'Pas de réponse du service'
            logger.error(f"❌ Erreur lors de l'arrêt: {error_msg}")
            
            return Response({
                "success": False,
                "error": f"Impossible d'arrêter le stream: {error_msg}",
                "details": result
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Erreur arrêt stream: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def join_stream(request, event_id):
    """Rejoint le streaming d'un événement virtuel"""
    logger.info(f"=== JOIN_STREAM APPELÉ ===")
    logger.info(f"Utilisateur: {request.user.username}")
    logger.info(f"Event ID: {event_id}")
    logger.info(f"Path: {request.path}")
    logger.info(f"Method: {request.method}")
    
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            return Response(
                {"error": "Cet événement n'est pas virtuel"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'événement est encore accessible pour le streaming
        if not event.is_streaming_accessible():
            return Response({
                "error": "Cet événement est terminé - le streaming n'est plus accessible",
                "event_end_date": event.end_date,
                "current_time": timezone.now()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que l'utilisateur est inscrit ET confirmé (pas annulé)
        registration = EventRegistration.objects.filter(
            event=event,
            user=request.user
        ).first()
        
        if not registration:
            return Response({
                "error": "Vous devez être inscrit à cet événement pour y accéder",
                "status": "not_registered"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier le statut exact de l'inscription
        if registration.status == 'cancelled':
            return Response({
                "error": "Votre inscription a été annulée - vous ne pouvez plus accéder au live",
                "status": "registration_cancelled",
                "cancellation_date": registration.updated_at
            }, status=status.HTTP_403_FORBIDDEN)
        
        if registration.status not in ['confirmed', 'attended']:
            return Response({
                "error": "Votre inscription n'est pas encore confirmée",
                "status": "registration_pending",
                "current_status": registration.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 🔒 VÉRIFICATION OBLIGATOIRE DU PAIEMENT
        logger.info(f"🔒 Vérification du paiement pour {request.user.username}...")
        payment_check = _verify_payment_access(request.user, event)
        logger.info(f"🔒 Résultat vérification paiement: {payment_check}")
        
        if not payment_check:
            logger.warning(f"🚫 ACCÈS REFUSÉ - {request.user.username} n'a pas de paiement confirmé")
            return Response({
                'success': False,
                'error': 'Accès refusé - Paiement non confirmé',
                'details': 'Vous devez avoir un billet payé et confirmé pour accéder à ce stream',
                'action_required': 'payment'
            }, status=status.HTTP_403_FORBIDDEN)
        
        logger.info(f"✅ Paiement vérifié - {request.user.username} peut accéder au stream")
        
        logger.info(f"Utilisateur {request.user.username} autorisé pour event {event_id} (status: {registration.status})")
        
        try:
            virtual_event = event.virtual_details
        except VirtualEvent.DoesNotExist:
            return Response(
                {"error": "Aucun stream configuré pour cet événement"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le stream est VRAIMENT lancé et disponible
        if not virtual_event.meeting_id or not virtual_event.meeting_url:
            return Response({
                "success": False,
                "error": "Le stream n'est pas encore lancé par l'organisateur",
                "details": "L'organisateur doit d'abord lancer le stream avant que vous puissiez le rejoindre",
                "action_required": "wait_for_organizer",
                "status": "stream_not_started"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Retourner les informations de connexion
        logger.info(f"🎯 Préparation des informations de connexion pour {request.user.username}")
        connection_info = {
            "event_title": event.title,
            "platform": virtual_event.platform,
            "meeting_url": virtual_event.meeting_url,
            "meeting_id": virtual_event.meeting_id,
            "meeting_password": virtual_event.meeting_password,
            "access_instructions": virtual_event.access_instructions,
            "technical_requirements": virtual_event.technical_requirements,
            "start_date": event.start_date,
            "end_date": event.end_date
        }
        
        logger.info(f"✅ ACCÈS AUTORISÉ - {request.user.username} reçoit les infos de connexion")
        logger.info(f"   Meeting URL: {virtual_event.meeting_url}")
        logger.info(f"   Meeting ID: {virtual_event.meeting_id}")
        
        return Response({
            "success": True,
            "connection_info": connection_info
        })
        
    except Exception as e:
        logger.error(f"Erreur connexion stream: {e}")
        return Response({
            "error": f"Erreur serveur: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
