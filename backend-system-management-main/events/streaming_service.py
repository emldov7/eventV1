"""
Service de streaming unifié pour la gestion des événements virtuels
Génère automatiquement les informations de connexion pour YouTube et Zoom
"""

import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import VirtualEvent, Event
from .youtube_service import YouTubeLiveService
from .zoom_service import ZoomService
from typing import Dict

logger = logging.getLogger(__name__)

class StreamingService:
    """Service unifié pour la gestion des streams"""
    
    def __init__(self):
        self.youtube_service = YouTubeLiveService()
        self.zoom_service = ZoomService()
    
    def create_stream_for_event(self, virtual_event):
        """
        Crée automatiquement un stream pour un événement virtuel
        Retourne les informations de connexion
        """
        try:
            event = virtual_event.event
            platform = virtual_event.platform
            
            logger.info(f"Creation de stream pour l'evenement {event.title} sur {platform}")
            
            if platform == 'youtube_live':
                return self._create_youtube_stream(virtual_event)
            elif platform == 'zoom':
                return self._create_zoom_meeting(virtual_event)
            else:
                raise ValueError(f"Plateforme non supportée: {platform}")
                
        except Exception as e:
            logger.error(f"Erreur lors de la creation du stream: {e}")
            raise
    
    def _create_youtube_stream(self, virtual_event):
        """Crée un stream YouTube Live"""
        try:
            event = virtual_event.event
            
            # Générer un titre unique pour le stream
            stream_title = f"{event.title} - {event.start_date.strftime('%d/%m/%Y %H:%M')}"
            
            logger.info(f"Creation du stream YouTube pour l'evenement: {event.title}")
            
            # Créer le stream via l'API YouTube
            if not self.youtube_service or not self.youtube_service.enabled:
                # Mode simulation - générer un ID fictif
                import uuid
                fake_stream_id = str(uuid.uuid4())[:8].upper()
                
                # Mettre à jour l'événement virtuel avec un ID simulé
                virtual_event.meeting_id = fake_stream_id
                virtual_event.meeting_url = f"https://youtube.com/live/{fake_stream_id}"
                virtual_event.meeting_password = "SIMULE"  # Pas de mot de passe pour YouTube
                
                # Générer les instructions d'accès
                virtual_event.access_instructions = self._generate_youtube_instructions(virtual_event, event)
                virtual_event.technical_requirements = """
EXIGENCES TECHNIQUES POUR YOUTUBE LIVE:

- Connexion internet stable (minimum 5 Mbps)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Haut-parleurs ou casque
- Micro (optionnel pour les questions)
- Désactiver les bloqueurs de publicités si nécessaire
                """.strip()
                
                virtual_event.save()
                
                logger.info(f"Stream simule cree avec ID: {fake_stream_id}")
                return {
                    'platform': 'YouTube Live (Simule)',
                    'stream_id': fake_stream_id,
                    'broadcast_id': fake_stream_id,
                    'watch_url': virtual_event.meeting_url,
                    'chat_url': f"https://youtube.com/live_chat?is_popout=1&v={fake_stream_id}",
                    'stream_key': 'SIMULE',
                    'status': 'created_simulated'
                }
            
            stream_info = self.youtube_service.create_live_stream(
                event_title=stream_title,
                scheduled_start=event.start_date,
                description=event.description or "Événement virtuel"
            )
            
            if stream_info and 'error' not in stream_info:
                # Mettre à jour l'événement virtuel avec les informations du stream
                virtual_event.meeting_id = stream_info.get('broadcast_id') or stream_info.get('stream_id')
                virtual_event.meeting_url = stream_info.get('watch_url')
                virtual_event.meeting_password = "N/A"  # YouTube n'a pas de mot de passe
                
                # Générer les instructions d'accès
                virtual_event.access_instructions = self._generate_youtube_instructions(virtual_event, event)
                virtual_event.technical_requirements = """
⚙️ EXIGENCES TECHNIQUES POUR YOUTUBE LIVE:

- Connexion internet stable (minimum 5 Mbps)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Haut-parleurs ou casque
- Micro (optionnel pour les questions)
- Désactiver les bloqueurs de publicités si nécessaire
                """.strip()
                
                virtual_event.save()
                
                logger.info(f"Stream YouTube cree et configure: {stream_info.get('watch_url')}")
                return {
                    'platform': 'YouTube Live',
                    'stream_id': stream_info.get('stream_id'),
                    'broadcast_id': stream_info.get('broadcast_id'),
                    'watch_url': stream_info.get('watch_url'),
                    'chat_url': stream_info.get('chat_url'),
                    'stream_key': stream_info.get('stream_key'),
                    'status': 'created'
                }
            else:
                error_msg = stream_info.get('error', 'Erreur inconnue') if stream_info else 'Pas de réponse du service'
                logger.error(f"Impossible de creer le stream YouTube: {error_msg}")
                raise Exception(f"Impossible de créer le stream YouTube: {error_msg}")
                
        except Exception as e:
            logger.error(f"Erreur creation stream YouTube: {e}")
            raise
    
    def _create_zoom_meeting(self, virtual_event):
        """Crée une réunion Zoom"""
        try:
            event = virtual_event.event
            
            # Générer un titre unique pour la réunion
            meeting_topic = f"{event.title} - {event.start_date.strftime('%d/%m/%Y %H:%M')}"
            
            # Créer la réunion via l'API Zoom
            meeting_info = self.zoom_service.create_meeting(
                topic=meeting_topic,
                start_time=event.start_date,
                duration=int((event.end_date - event.start_date).total_seconds() / 60),
                password=virtual_event.meeting_password or self._generate_meeting_password(),
                settings={
                    'host_video': True,
                    'participant_video': True,
                    'join_before_host': False,
                    'mute_upon_entry': True,
                    'waiting_room': virtual_event.waiting_room,
                    'auto_recording': 'cloud' if virtual_event.auto_record else 'none'
                }
            )
            
            if meeting_info:
                # Mettre à jour l'événement virtuel avec les informations de la réunion
                virtual_event.meeting_id = meeting_info.get('id')
                virtual_event.meeting_url = meeting_info.get('join_url')
                virtual_event.meeting_password = meeting_info.get('password')
                virtual_event.save()
                
                logger.info(f"✅ Réunion Zoom créée: {meeting_info.get('id')}")
                return {
                    'platform': 'Zoom',
                    'meeting_id': meeting_info.get('id'),
                    'join_url': meeting_info.get('join_url'),
                    'password': meeting_info.get('password'),
                    'host_key': meeting_info.get('host_key'),
                    'status': 'created'
                }
            else:
                raise Exception("Impossible de créer la réunion Zoom")
                
        except Exception as e:
            logger.error(f"Erreur creation reunion Zoom: {e}")
            raise
    
    def _generate_meeting_password(self):
        """Génère un mot de passe de réunion sécurisé"""
        import random
        import string
        
        # Générer un mot de passe de 6 caractères
        password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return password
    
    def get_stream_status(self, virtual_event) -> Dict:
        """Récupère le statut d'un stream"""
        try:
            if not virtual_event:
                return {"error": "Événement virtuel non fourni"}
            
            # Vérifier si l'événement a une plateforme configurée
            if not hasattr(virtual_event, 'platform') or not virtual_event.platform:
                return {
                    "status": "not_configured",
                    "error": "Aucune plateforme de streaming configurée pour cet événement"
                }
            
            platform = virtual_event.platform
            
            if platform == 'youtube_live':
                if self.youtube_service and self.youtube_service.enabled:
                    # Mode simulation - retourner un statut par défaut
                    logger.info("Service YouTube en mode simulation")
                    return {
                        "status": "stopped",
                        "health_status": "ready",
                        "concurrent_viewers": 0,
                        "peak_concurrent_viewers": 0,
                        "total_viewers": 0,
                        "platform": "youtube_live",
                        "meeting_id": virtual_event.meeting_id,
                        "meeting_url": virtual_event.meeting_url
                    }
                else:
                    logger.warning("Service YouTube non disponible - retour du statut par défaut")
                    return {
                        "status": "stopped",
                        "health_status": "unknown",
                        "concurrent_viewers": 0,
                        "peak_concurrent_viewers": 0,
                        "total_viewers": 0,
                        "error": "Service YouTube non configuré",
                        "platform": "youtube_live"
                    }
                    
            elif platform == 'zoom':
                if self.zoom_service and self.zoom_service.enabled:
                    # Mode simulation - retourner un statut par défaut
                    logger.info("Service Zoom en mode simulation")
                    return {
                        "status": "stopped",
                        "health_status": "ready",
                        "concurrent_viewers": 0,
                        "peak_concurrent_viewers": 0,
                        "total_viewers": 0,
                        "platform": "zoom",
                        "meeting_id": virtual_event.meeting_id,
                        "meeting_url": virtual_event.meeting_url
                    }
                else:
                    logger.warning("Service Zoom non disponible - retour du statut par défaut")
                    return {
                        "status": "stopped",
                        "health_status": "unknown",
                        "concurrent_viewers": 0,
                        "peak_concurrent_viewers": 0,
                        "total_viewers": 0,
                        "error": "Service Zoom non configuré",
                        "platform": "zoom"
                    }
                    
            else:
                return {
                    "status": "unknown",
                    "error": f"Plateforme non supportée: {platform}"
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du statut du stream: {e}")
            return {
                "status": "error",
                "error": f"Erreur inattendue: {str(e)}"
            }
    
    def configure_stream(self, virtual_event):
        """Configure un stream pour un événement virtuel"""
        logger.info(f"🔍 LOG CRITIQUE: configure_stream() appelé pour event {virtual_event.event.id}")
        logger.info(f"🔍 LOG CRITIQUE: Appelant: {self._get_caller_info()}")
        
        try:
            logger.info(f"VirtualEvent ID: {virtual_event.id}")
            logger.info(f"Event: {virtual_event.event.title}")
            logger.info(f"VirtualEvent details:")
            logger.info(f"  - Platform: {virtual_event.platform}")
            logger.info(f"  - Meeting ID: {virtual_event.meeting_id}")
            logger.info(f"  - Event ID: {virtual_event.event.id}")
            logger.info(f"  - Event title: {virtual_event.event.title}")
            
            # Vérifier la plateforme
            if not hasattr(virtual_event, 'platform') or not virtual_event.platform:
                logger.error(f"❌ Aucune plateforme configurée pour l'événement {virtual_event.event.title}")
                return {
                    "success": False,
                    "error": "Aucune plateforme de streaming configurée pour cet événement"
                }
            
            platform = virtual_event.platform
            logger.info(f"Platform detectee: {platform}")
            
            # Si le stream est déjà configuré, retourner les infos
            if virtual_event.meeting_id and virtual_event.meeting_url:
                logger.info(f"✅ Stream déjà configuré avec Meeting ID: {virtual_event.meeting_id}")
                return {
                    "success": True,
                    "message": "Stream déjà configuré",
                    "meeting_id": virtual_event.meeting_id,
                    "meeting_url": virtual_event.meeting_url,
                    "status": "already_configured"
                }
            
            # Créer le stream
            logger.info(f"Configuration du stream pour l'événement {virtual_event.event.title}...")
            try:
                stream_creation_result = self.create_stream_for_event(virtual_event)
                logger.info(f"Résultat création stream: {stream_creation_result}")
                
                if 'error' in stream_creation_result:
                    logger.error(f"Impossible de créer le stream: {stream_creation_result}")
                    return {
                        "success": False,
                        "error": stream_creation_result.get('error', 'Erreur lors de la création du stream')
                    }
                
                # Rafraîchir l'objet pour avoir le nouveau meeting_id
                virtual_event.refresh_from_db()
                meeting_id = virtual_event.meeting_id
                meeting_url = virtual_event.meeting_url
                logger.info(f"✅ Stream configuré avec Meeting ID: {meeting_id}")
                
                # 🚀 ENVOYER AUTOMATIQUEMENT LES EMAILS DE MISE À JOUR
                logger.info(f"Envoi automatique des emails de mise à jour aux participants...")
                try:
                    from events.emails import send_stream_launched_email
                    send_stream_launched_email(virtual_event)
                    logger.info(f"✅ Emails de mise à jour envoyés avec succès")
                except Exception as e:
                    logger.warning(f"⚠️ Erreur lors de l'envoi des emails: {e}")
                    # Ne pas bloquer la configuration si les emails échouent
                
                return {
                    "success": True,
                    "message": "Stream configuré avec succès",
                    "meeting_id": meeting_id,
                    "meeting_url": meeting_url,
                    "status": "configured"
                }
                
            except Exception as e:
                logger.error(f"Erreur lors de la création du stream: {e}")
                return {
                    "success": False,
                    "error": f"Erreur lors de la création du stream: {str(e)}"
                }
                
        except Exception as e:
            logger.error(f"Erreur dans configure_stream: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": f"Erreur inattendue: {str(e)}"
            }
    
    def _get_caller_info(self):
        """Obtient les informations sur l'appelant de la méthode"""
        import inspect
        import traceback
        
        try:
            # Obtenir la stack trace
            stack = inspect.stack()
            if len(stack) > 2:
                # L'appelant est à l'index 2 (0=current, 1=this method, 2=caller)
                caller_frame = stack[2]
                caller_info = {
                    'filename': caller_frame.filename,
                    'function': caller_frame.function,
                    'line': caller_frame.lineno,
                    'code': caller_frame.code_context[0].strip() if caller_frame.code_context else 'N/A'
                }
                return f"{caller_info['filename']}:{caller_info['line']} in {caller_info['function']}() - {caller_info['code']}"
            return "Stack trace insuffisante"
        except Exception as e:
            return f"Erreur lors de l'obtention des infos d'appel: {e}"

    def start_stream(self, virtual_event):
        """Démarre le stream (DOIT être déjà configuré)"""
        logger.info(f"🔍 LOG CRITIQUE: start_stream() appelé pour event {virtual_event.event.id}")
        logger.info(f"🔍 LOG CRITIQUE: Appelant: {self._get_caller_info()}")
        
        try:
            # Logs détaillés de l'objet VirtualEvent
            logger.info(f"VirtualEvent details:")
            logger.info(f"  - Platform: {getattr(virtual_event, 'platform', 'N/A')}")
            logger.info(f"  - Meeting ID: {getattr(virtual_event, 'meeting_id', 'N/A')}")
            logger.info(f"  - Event ID: {virtual_event.event.id if virtual_event.event else 'N/A'}")
            logger.info(f"  - Event title: {virtual_event.event.title if virtual_event.event else 'N/A'}")
            
            # Vérifier que l'objet VirtualEvent a les propriétés nécessaires
            if not hasattr(virtual_event, 'platform') or not virtual_event.platform:
                logger.warning(f"VirtualEvent {virtual_event.id} n'a pas de platform")
                return {
                    "success": False,
                    "error": "Aucune plateforme de streaming configurée pour cet événement"
                }
            
            platform = virtual_event.platform
            logger.info(f"🔍 LOG CRITIQUE: Platform detectee: {platform}")
            
            # Vérifier que le stream est configuré
            if not hasattr(virtual_event, 'meeting_id') or not virtual_event.meeting_id:
                logger.error(f"❌ STREAM NON CONFIGURÉ - L'organisateur doit d'abord configurer le stream")
                return {
                    "success": False,
                    "error": "Le stream n'est pas encore configuré. L'organisateur doit d'abord le configurer.",
                    "action_required": "organizer_must_configure_stream",
                    "details": "L'organisateur doit d'abord configurer le stream avant de pouvoir le lancer"
                }
            
            # Le stream est configuré, on peut le lancer
            meeting_id = virtual_event.meeting_id
            logger.info(f"Meeting ID: {meeting_id}")
            
            if platform == 'youtube_live':
                logger.info(f"Lancement du stream YouTube avec meeting_id: {meeting_id}")
                
                # Mode simulation - pas besoin d'API YouTube
                if not self.youtube_service or not self.youtube_service.enabled:
                    logger.info(f"Mode simulation - Stream YouTube demarre avec ID: {meeting_id}")
                    return {
                        "success": True,
                        "message": f"Stream YouTube simule demarre avec succes",
                        "stream_id": meeting_id,
                        "stream_url": virtual_event.meeting_url,
                        "status": "started_simulated"
                    }
                
                # Mode réel avec API YouTube
                result = self.youtube_service.start_stream(meeting_id)
                logger.info(f"Resultat YouTube: {result}")
                return result
                
            elif platform == 'zoom':
                logger.info(f"Lancement du stream Zoom avec meeting_id: {meeting_id}")
                
                # Mode simulation - pas besoin d'API Zoom
                if not self.zoom_service or not self.zoom_service.enabled:
                    logger.info(f"Mode simulation - Stream Zoom demarre avec ID: {meeting_id}")
                    return {
                        "success": True,
                        "message": f"Stream Zoom simule demarre avec succes",
                        "meeting_id": meeting_id,
                        "join_url": virtual_event.meeting_url,
                        "status": "started_simulated"
                    }
                
                # Mode réel avec API Zoom
                result = self.zoom_service.start_stream(meeting_id)
                logger.info(f"Resultat Zoom: {result}")
                return result
                
            else:
                logger.warning(f"Platform non supportee: {platform}")
                return {
                    "success": False,
                    "error": f"Plateforme non supportée: {platform}"
                }
                
        except Exception as e:
            logger.error(f"Erreur dans start_stream: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": f"Erreur inattendue: {str(e)}"
            }
    
    def pause_stream(self, virtual_event):
        """Met en pause le stream"""
        logger.info(f"=== STREAMING SERVICE - PAUSE STREAM ===")
        logger.info(f"VirtualEvent ID: {virtual_event.id}")
        logger.info(f"Event: {virtual_event.event.title}")
        
        try:
            platform = virtual_event.platform
            logger.info(f"Platform: {platform}")
            
            if platform == 'youtube_live':
                # Mode simulation pour YouTube
                logger.info("YouTube Live - Mode simulation - Pause simulée")
                return {
                    "success": True,
                    "message": "Stream mis en pause (simulation)",
                    "status": "paused",
                    "platform": "youtube_live"
                }
            elif platform == 'zoom':
                # Mode simulation pour Zoom
                logger.info("Zoom - Mode simulation - Pause simulée")
                return {
                    "success": True,
                    "message": "Réunion mise en pause (simulation)",
                    "status": "paused",
                    "platform": "zoom"
                }
            else:
                return {
                    "success": False,
                    "error": f"Plateforme non supportée: {platform}"
                }
                
        except Exception as e:
            logger.error(f"Erreur pause stream: {e}")
            return {
                "success": False,
                "error": f"Erreur inattendue: {str(e)}"
            }
    
    def stop_stream(self, virtual_event):
        """Arrête le stream"""
        logger.info(f"=== STREAMING SERVICE - STOP STREAM ===")
        logger.info(f"VirtualEvent ID: {virtual_event.id}")
        logger.info(f"Event: {virtual_event.event.title}")
        
        try:
            platform = virtual_event.platform
            logger.info(f"Platform: {platform}")
            
            if platform == 'youtube_live':
                # Mode simulation pour YouTube
                logger.info("YouTube Live - Mode simulation - Arrêt simulé")
                return {
                    "success": True,
                    "message": "Stream arrêté (simulation)",
                    "status": "stopped",
                    "platform": "youtube_live"
                }
            elif platform == 'zoom':
                # Mode simulation pour Zoom
                logger.info("Zoom - Mode simulation - Arrêt simulé")
                return {
                    "success": True,
                    "message": "Réunion arrêtée (simulation)",
                    "status": "stopped",
                    "platform": "zoom"
                }
            else:
                return {
                    "success": False,
                    "error": f"Plateforme non supportée: {platform}"
                }
                
        except Exception as e:
            logger.error(f"Erreur arret stream: {e}")
            return {
                "success": False,
                "error": f"Erreur inattendue: {str(e)}"
            }
    
    def get_connection_instructions(self, virtual_event):
        """Génère les instructions de connexion pour les participants"""
        try:
            event = virtual_event.event
            platform = virtual_event.platform
            
            if platform == 'youtube_live':
                return self._generate_youtube_instructions(virtual_event, event)
            elif platform == 'zoom':
                return self._generate_zoom_instructions(virtual_event, event)
            else:
                return self._generate_generic_instructions(virtual_event, event)
                
        except Exception as e:
            logger.error(f"Erreur generation instructions: {e}")
            return "Instructions non disponibles"
    
    def _generate_youtube_instructions(self, virtual_event, event):
        """Génère les instructions pour YouTube Live"""
        # Calculer la durée en heures et minutes
        duration = event.end_date - event.start_date
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        duration_str = f"{hours}h{minutes:02d}" if minutes > 0 else f"{hours}h"
        
        instructions = f"""
🎥 INSTRUCTIONS DE CONNEXION - YOUTUBE LIVE

📅 Événement: {event.title}
🕐 Date: {event.start_date.strftime('%d/%m/%Y à %H:%M')} (Heure de Paris)
⏱️ Durée: {duration_str}

🔗 LIEN DE CONNEXION:
{virtual_event.meeting_url or 'Lien en cours de génération...'}

📋 COMMENT REJOINDRE:
1. Cliquez sur le lien ci-dessus 15 minutes avant le début
2. Assurez-vous que votre navigateur est à jour
3. Activez le son et la vidéo si nécessaire
4. Utilisez le chat pour poser vos questions

⚙️ EXIGENCES TECHNIQUES:
- Connexion internet stable (minimum 5 Mbps)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Haut-parleurs ou casque
- Micro (optionnel pour les questions)
- Désactiver les bloqueurs de publicités si nécessaire

💡 CONSEILS:
- Testez votre connexion avant l'événement
- Fermez les applications inutiles
- Préparez vos questions à l'avance
- Rejoignez le chat pour interagir avec les autres participants
        """
        return instructions.strip()
    
    def _generate_zoom_instructions(self, virtual_event, event):
        """Génère les instructions pour Zoom"""
        instructions = f"""
🎥 INSTRUCTIONS DE CONNEXION - ZOOM

📅 Événement: {event.title}
🕐 Date: {event.start_date.strftime('%d/%m/%Y à %H:%M')}
⏱️ Durée: {event.end_date - event.start_date}

🔗 LIEN DE CONNEXION:
{virtual_event.meeting_url or 'Lien en cours de génération...'}

🔑 INFORMATIONS DE CONNEXION:
- ID de réunion: {virtual_event.meeting_id or 'En cours...'}
- Mot de passe: {virtual_event.meeting_password or 'En cours...'}

📋 COMMENT REJOINDRE:
1. Cliquez sur le lien ci-dessus 15 minutes avant le début
2. Entrez le mot de passe si demandé
3. Autorisez l'accès à votre caméra et micro si demandé
4. Attendez dans la salle d'attente si activée

⚙️ EXIGENCES TECHNIQUES:
- Connexion internet stable (minimum 5 Mbps)
- Application Zoom (téléchargement gratuit)
- Haut-parleurs ou casque
- Micro et caméra (recommandés)

💡 CONSEILS:
- Installez Zoom à l'avance
- Testez votre équipement audio/vidéo
- Préparez vos questions à l'avance
        """
        return instructions.strip()
    
    def _generate_generic_instructions(self, virtual_event, event):
        """Instructions génériques pour les autres plateformes"""
        return f"""
🎥 INSTRUCTIONS DE CONNEXION

📅 Événement: {event.title}
🕐 Date: {event.start_date.strftime('%d/%m/%Y à %H:%M')}
⏱️ Durée: {event.end_date - event.start_date}

🔗 LIEN DE CONNEXION:
{virtual_event.meeting_url or 'Lien en cours de génération...'}

📋 COMMENT REJOINDRE:
1. Cliquez sur le lien ci-dessus 15 minutes avant le début
2. Suivez les instructions de la plateforme
3. Testez votre équipement audio/vidéo

⚙️ EXIGENCES TECHNIQUES:
- Connexion internet stable
- Navigateur ou application à jour
- Haut-parleurs ou casque
- Micro (recommandé)
        """.strip()
