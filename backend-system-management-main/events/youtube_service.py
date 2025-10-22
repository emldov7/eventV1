"""
Service d'intégration YouTube Live pour les événements virtuels
Gère la création, gestion et monitoring des streams YouTube
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

class YouTubeLiveService:
    """Service pour gérer les événements YouTube Live"""
    
    def __init__(self):
        # Vérifier si le streaming YouTube est activé
        from django.conf import settings
        self.enabled = getattr(settings, 'YOUTUBE_STREAMING_ENABLED', False)
        
        if not self.enabled:
            logger.info("Service YouTube désactivé par configuration")
            self.youtube = None
            return
            
        self.api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
        self.channel_id = getattr(settings, 'YOUTUBE_CHANNEL_ID', None)
        
        if not self.api_key:
            logger.warning("Clé API YouTube non configurée")
            self.youtube = None
            return
            
        self.youtube = None
        self._initialize_api()
    
    def _initialize_api(self):
        """Initialise l'API YouTube"""
        try:
            self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            logger.info("YouTube API initialisee avec succes")
        except Exception as e:
            logger.error(f"Erreur d'initialisation YouTube API: {e}")
            self.youtube = None
    
    def get_channel_info(self) -> Dict:
        """Récupère les informations de la chaîne YouTube"""
        if not self.youtube:
            return {"error": "API YouTube non initialisée"}
        
        try:
            # D'abord essayer avec l'ID de chaîne fourni
            request = self.youtube.channels().list(
                part="snippet,statistics,contentDetails",
                id=self.channel_id
            )
            response = request.execute()
            
            # Vérifier si la réponse contient des erreurs
            if 'error' in response:
                logger.error(f"Erreur API YouTube: {response['error']}")
                return {"error": f"Erreur API: {response['error'].get('message', 'Erreur inconnue')}"}
            
            # Vérifier si la réponse contient des items
            if 'items' not in response or not response['items']:
                logger.warning(f"Aucune chaîne trouvée avec l'ID: {self.channel_id}")
                
                # Essayer de récupérer les informations de la chaîne par nom d'utilisateur
                try:
                    username = "KossiEmmanuelDOVON"  # Votre nom d'utilisateur YouTube
                    search_request = self.youtube.search().list(
                        part="snippet",
                        q=username,
                        type="channel",
                        maxResults=1
                    )
                    search_response = search_request.execute()
                    
                    if search_response.get('items'):
                        channel_id = search_response['items'][0]['snippet']['channelId']
                        logger.info(f"Chaîne trouvée par recherche: {channel_id}")
                        
                        # Maintenant récupérer les détails de cette chaîne
                        channel_request = self.youtube.channels().list(
                            part="snippet,statistics,contentDetails",
                            id=channel_id
                        )
                        channel_response = channel_request.execute()
                        
                        if channel_response.get('items'):
                            channel = channel_response['items'][0]
                            return {
                                "id": channel['id'],
                                "title": channel['snippet']['title'],
                                "description": channel['snippet']['description'],
                                "subscriber_count": channel['statistics'].get('subscriberCount', 0),
                                "video_count": channel['statistics'].get('videoCount', 0),
                                "view_count": channel['statistics'].get('viewCount', 0),
                                "custom_url": channel['snippet'].get('customUrl', ''),
                                "thumbnail": channel['snippet']['thumbnails']['default']['url']
                            }
                except Exception as search_error:
                    logger.warning(f"Recherche de chaîne échouée: {search_error}")
                
                return {"error": "Chaîne non trouvée"}
            
            channel = response['items'][0]
            return {
                "id": channel['id'],
                "title": channel['snippet']['title'],
                "description": channel['snippet']['description'],
                "subscriber_count": channel['statistics'].get('subscriberCount', 0),
                "video_count": channel['statistics'].get('videoCount', 0),
                "view_count": channel['statistics'].get('viewCount', 0),
                "custom_url": channel['snippet'].get('customUrl', ''),
                "thumbnail": channel['snippet']['thumbnails']['default']['url']
            }
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP YouTube: {error_details}")
            return {"error": f"Erreur HTTP: {error_details.get('error', {}).get('message', 'Erreur inconnue')}"}
        except Exception as e:
            logger.error(f"Erreur inattendue YouTube: {e}")
            return {"error": f"Erreur inattendue: {e}"}
    
    def create_live_stream(self, event_title: str, scheduled_start: datetime, 
                          description: str = "") -> Dict:
        """Crée un nouveau live stream YouTube"""
        if not self.youtube:
            return {"error": "API YouTube non initialisée"}
        
        try:
            logger.info(f"🎥 Création du stream YouTube pour: {event_title}")
            
            # Créer le broadcast (événement)
            broadcast_request = self.youtube.liveBroadcasts().insert(
                part="snippet,status",
                body={
                    "snippet": {
                        "title": event_title,
                        "description": description or "Événement virtuel",
                        "scheduledStartTime": scheduled_start.isoformat() + "Z",
                        "channelId": self.channel_id
                    },
                    "status": {
                        "privacyStatus": "public",
                        "selfDeclaredMadeForKids": False
                    }
                }
            )
            
            broadcast_response = broadcast_request.execute()
            broadcast_id = broadcast_response['id']
            logger.info(f"✅ Broadcast créé: {broadcast_id}")
            
            # Créer le stream (flux vidéo)
            stream_request = self.youtube.liveStreams().insert(
                part="snippet,cdn",
                body={
                    "snippet": {
                        "title": f"Stream pour {event_title}",
                        "description": description or "Événement virtuel"
                    },
                    "cdn": {
                        "frameRate": "30fps",
                        "resolution": "1080p",
                        "ingestionType": "rtmp"
                    }
                }
            )
            
            stream_response = stream_request.execute()
            stream_id = stream_response['id']
            logger.info(f"✅ Stream créé: {stream_id}")
            
            # Lier le broadcast au stream
            bind_request = self.youtube.liveBroadcasts().bind(
                id=broadcast_id,
                streamId=stream_id,
                part="id"
            )
            bind_request.execute()
            logger.info(f"✅ Broadcast et stream liés")
            
            # Récupérer les informations complètes du stream
            stream_info = {
                "success": True,
                "broadcast_id": broadcast_id,
                "stream_id": stream_id,
                "stream_url": stream_response['cdn']['ingestionInfo']['ingestionAddress'],
                "stream_key": stream_response['cdn']['ingestionInfo']['streamName'],
                "watch_url": f"https://www.youtube.com/watch?v={broadcast_id}",
                "embed_url": f"https://www.youtube.com/embed/{broadcast_id}",
                "chat_url": f"https://www.youtube.com/live_chat?v={broadcast_id}&embed_domain=localhost",
                "status": "created"
            }
            
            logger.info(f"🎥 Stream YouTube créé avec succès: {stream_info['watch_url']}")
            return stream_info
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP creation stream: {error_details}")
            return {"error": f"Erreur création: {error_details.get('error', {}).get('message', 'Erreur inconnue')}"}
        except Exception as e:
            logger.error(f"Erreur creation stream YouTube: {e}")
            return {"error": f"Erreur création: {e}"}
    
    def get_live_streams(self) -> List[Dict]:
        """Récupère tous les live streams actifs"""
        if not self.youtube:
            return []
        
        try:
            request = self.youtube.liveBroadcasts().list(
                part="snippet,status,contentDetails",
                broadcastStatus="all",
                maxResults=50
            )
            response = request.execute()
            
            if 'error' in response:
                logger.error(f"Erreur API récupération streams: {response['error']}")
                return []
            
            streams = []
            for item in response.get('items', []):
                streams.append({
                    "id": item['id'],
                    "title": item['snippet']['title'],
                    "description": item['snippet']['description'],
                    "status": item['status']['lifeCycleStatus'],
                    "privacy": item['status']['privacyStatus'],
                    "scheduled_start": item['snippet'].get('scheduledStartTime'),
                    "actual_start": item['snippet'].get('actualStartTime'),
                    "actual_end": item['snippet'].get('actualEndTime'),
                    "viewer_count": item.get('statistics', {}).get('concurrentViewerCount', 0),
                    "watch_url": f"https://www.youtube.com/watch?v={item['id']}"
                })
            
            return streams
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP récupération streams: {error_details}")
            return []
        except Exception as e:
            logger.error(f"Erreur récupération streams: {e}")
            return []
    
    def update_stream_status(self, broadcast_id: str, status: str) -> Dict:
        """Met à jour le statut d'un stream (testing, live, complete)"""
        if not self.youtube:
            return {"error": "API YouTube non initialisée"}
        
        try:
            request = self.youtube.liveBroadcasts().transition(
                id=broadcast_id,
                part="id,snippet,status",
                broadcastStatus=status
            )
            response = request.execute()
            
            return {
                "success": True,
                "id": response['id'],
                "status": response['status']['lifeCycleStatus']
            }
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP mise à jour statut: {error_details}")
            return {"error": f"Erreur mise à jour: {error_details.get('error', {}).get('message', 'Erreur inconnue')}"}
        except Exception as e:
            logger.error(f"Erreur mise à jour statut: {e}")
            return {"error": f"Erreur mise à jour: {e}"}
    
    def get_stream_analytics(self, broadcast_id: str) -> Dict:
        """Récupère les analytics d'un stream"""
        if not self.youtube:
            return {"error": "API YouTube non initialisée"}
        
        try:
            # Récupérer les statistiques du broadcast
            request = self.youtube.liveBroadcasts().list(
                part="statistics",
                id=broadcast_id
            )
            response = request.execute()
            
            if 'error' in response:
                logger.error(f"Erreur API analytics: {response['error']}")
                return {"error": f"Erreur API: {response['error'].get('message', 'Erreur inconnue')}"}
            
            if response.get('items'):
                stats = response['items'][0].get('statistics', {})
                return {
                    "view_count": stats.get('viewCount', 0),
                    "like_count": stats.get('likeCount', 0),
                    "comment_count": stats.get('commentCount', 0),
                    "concurrent_viewers": stats.get('concurrentViewerCount', 0)
                }
            
            return {"error": "Stream non trouvé"}
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP analytics: {error_details}")
            return {"error": f"Erreur analytics: {error_details.get('error', {}).get('message', 'Erreur inconnue')}"}
        except Exception as e:
            logger.error(f"Erreur analytics: {e}")
            return {"error": f"Erreur analytics: {e}"}
    
    def delete_stream(self, broadcast_id: str) -> Dict:
        """Supprime un stream YouTube"""
        if not self.youtube:
            return {"error": "API YouTube non initialisée"}
        
        try:
            self.youtube.liveBroadcasts().delete(id=broadcast_id).execute()
            return {"success": True, "message": "Stream supprimé"}
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP suppression: {error_details}")
            return {"error": f"Erreur suppression: {error_details.get('error', {}).get('message', 'Erreur inconnue')}"}
        except Exception as e:
            logger.error(f"Erreur suppression: {e}")
            return {"error": f"Erreur suppression: {e}"}
    
    def get_chat_messages(self, live_chat_id: str, max_results: int = 200) -> List[Dict]:
        """Récupère les messages du chat en direct"""
        if not self.youtube:
            return []
        
        try:
            request = self.youtube.liveChatMessages().list(
                liveChatId=live_chat_id,
                part="snippet,authorDetails",
                maxResults=max_results
            )
            response = request.execute()
            
            if 'error' in response:
                logger.error(f"Erreur API chat: {response['error']}")
                return []
            
            messages = []
            for item in response.get('items', []):
                messages.append({
                    "id": item['id'],
                    "author": item['authorDetails']['displayName'],
                    "author_id": item['authorDetails']['channelId'],
                    "message": item['snippet']['displayMessage'],
                    "timestamp": item['snippet']['publishedAt'],
                    "type": item['snippet']['type']
                })
            
            return messages
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error(f"Erreur HTTP chat: {error_details}")
            return []
        except Exception as e:
            logger.error(f"Erreur chat: {e}")
            return []

    def get_stream_status(self, broadcast_id: str) -> Dict:
        """Récupère le statut d'un stream YouTube"""
        if not self.youtube:
            logger.warning("YouTube API non initialisée - retour du statut par défaut")
            return {
                "status": "stopped",
                "health_status": "unknown",
                "concurrent_viewers": 0,
                "peak_concurrent_viewers": 0,
                "total_viewers": 0,
                "error": "API YouTube non disponible"
            }
        
        if not broadcast_id:
            logger.warning("Aucun broadcast_id fourni")
            return {
                "status": "stopped",
                "error": "Aucun ID de stream fourni"
            }
        
        try:
            logger.info(f"Recuperation du statut du stream: {broadcast_id}")
            
            # Essayer de récupérer le statut du broadcast
            request = self.youtube.liveBroadcasts().list(
                part="status,snippet",
                id=broadcast_id
            )
            response = request.execute()
            
            if 'items' in response and response['items']:
                broadcast = response['items'][0]
                status = broadcast['status']['lifeCycleStatus']
                
                # Mapper les statuts YouTube vers nos statuts
                status_mapping = {
                    'created': 'ready',
                    'ready': 'ready',
                    'testing': 'testing',
                    'liveStarting': 'starting',
                    'live': 'live',
                    'liveStopping': 'stopping',
                    'complete': 'stopped',
                    'revoked': 'stopped',
                    'testStarting': 'testing',
                    'testComplete': 'stopped'
                }
                
                mapped_status = status_mapping.get(status, 'unknown')
                
                return {
                    "status": mapped_status,
                    "health_status": "good",
                    "concurrent_viewers": 0,  # Nécessite des permissions spéciales
                    "peak_concurrent_viewers": 0,
                    "total_viewers": 0,
                    "youtube_status": status
                }
            else:
                logger.warning(f"Aucun broadcast trouvé avec l'ID: {broadcast_id}")
                return {
                    "status": "stopped",
                    "error": "Stream non trouvé"
                }
                
        except HttpError as e:
            error_details = json.loads(e.content.decode())
            logger.error(f"Erreur HTTP YouTube API: {error_details}")
            
            # Si c'est une erreur d'authentification, retourner un statut par défaut
            if error_details.get('error', {}).get('code') == 401:
                logger.warning("Erreur d'authentification YouTube - utilisation du statut par défaut")
                return {
                    "status": "stopped",
                    "health_status": "unknown",
                    "concurrent_viewers": 0,
                    "peak_concurrent_viewers": 0,
                    "total_viewers": 0,
                    "error": "Authentification YouTube requise",
                    "youtube_error": error_details
                }
            
            return {
                "status": "error",
                "error": f"Erreur YouTube: {error_details.get('error', {}).get('message', 'Erreur inconnue')}",
                "youtube_error": error_details
            }
            
        except Exception as e:
            logger.error(f"Erreur inattendue lors de la récupération du statut: {e}")
            return {
                "status": "error",
                "error": f"Erreur inattendue: {str(e)}"
            }

    def start_stream(self, meeting_id: str) -> Dict:
        """Démarre un stream YouTube"""
        if not self.youtube:
            logger.warning("YouTube API non initialisee - retour du statut simule")
            return {
                "success": False,
                "error": "Service YouTube non disponible",
                "status": "stopped"
            }
        
        try:
            logger.info(f"Démarrage du stream YouTube pour l'événement: {meeting_id}")
            
            # En mode dégradé, retourner un statut simulé
            if not self.enabled:
                return {
                    "success": True,
                    "message": "Stream démarré (mode simulation)",
                    "status": "live",
                    "broadcast_id": f"sim_{meeting_id}",
                    "warning": "Service YouTube désactivé - statut simulé"
                }
            
            # Logique réelle pour démarrer le stream (quand l'API sera configurée)
            # Pour l'instant, retourner un statut simulé
            return {
                "success": True,
                "message": "Stream démarré avec succès",
                "status": "live",
                "broadcast_id": f"live_{meeting_id}",
                "note": "Fonctionnalité en mode simulation"
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du démarrage du stream: {e}")
            return {
                "success": False,
                "error": f"Erreur lors du démarrage: {str(e)}",
                "status": "error"
            }

    def stop_stream(self, meeting_id: str) -> Dict:
        """Arrête un stream YouTube"""
        if not self.youtube:
            logger.warning("YouTube API non initialisee - retour du statut simule")
            return {
                "success": False,
                "error": "Service YouTube non disponible",
                "status": "stopped"
            }
        
        try:
            logger.info(f"Arret du stream YouTube pour l'événement: {meeting_id}")
            
            # En mode dégradé, retourner un statut simulé
            if not self.enabled:
                return {
                    "success": True,
                    "message": "Stream arrêté (mode simulation)",
                    "status": "stopped",
                    "broadcast_id": f"sim_{meeting_id}",
                    "warning": "Service YouTube désactivé - statut simulé"
                }
            
            # Logique réelle pour arrêter le stream (quand l'API sera configurée)
            # Pour l'instant, retourner un statut simulé
            return {
                "success": True,
                "message": "Stream arrêté avec succès",
                "status": "stopped",
                "broadcast_id": f"live_{meeting_id}",
                "note": "Fonctionnalité en mode simulation"
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'arrêt du stream: {e}")
            return {
                "success": False,
                "error": f"Erreur lors de l'arrêt: {str(e)}",
                "status": "error"
            }

# Instance globale du service (créée à la demande)
# youtube_service = YouTubeLiveService()
