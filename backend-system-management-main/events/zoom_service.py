"""
Service d'intégration Zoom pour les événements virtuels
Gère la création, gestion et monitoring des réunions Zoom
"""

import os
import json
import logging
import base64
import hmac
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

class ZoomService:
    """Service pour gérer les réunions Zoom"""
    
    def __init__(self):
        # Vérifier si le streaming Zoom est activé
        from django.conf import settings
        self.enabled = getattr(settings, 'ZOOM_STREAMING_ENABLED', False)
        
        if not self.enabled:
            logger.info("Service Zoom désactivé par configuration")
            self.access_token = None
            return
            
        self.account_id = getattr(settings, 'ZOOM_ACCOUNT_ID', None)
        self.client_id = getattr(settings, 'ZOOM_CLIENT_ID', None)
        self.client_secret = getattr(settings, 'ZOOM_CLIENT_SECRET', None)
        
        if not all([self.account_id, self.client_id, self.client_secret]):
            logger.warning("Configuration Zoom incomplète")
            self.access_token = None
            return
            
        self.access_token = None
        self._authenticate()
    
    def _authenticate(self):
        """Authentification OAuth2 avec Zoom"""
        try:
            logger.info(f"Tentative d'authentification Zoom avec Account ID: {self.account_id}")
            logger.info(f"Client ID: {self.client_id}")
            
            # Encoder les credentials
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "grant_type": "account_credentials",
                "account_id": self.account_id
            }
            
            logger.info("Envoi de la requête d'authentification...")
            response = requests.post(
                "https://zoom.us/oauth/token",
                headers=headers,
                data=data,
                timeout=30
            )
            
            logger.info(f"Réponse Zoom: {response.status_code}")
            logger.info(f"Headers de réponse: {dict(response.headers)}")
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                self.token_expires_at = timezone.now() + timedelta(seconds=token_data['expires_in'])
                logger.info("Authentification Zoom reussie")
                logger.info(f"Token expirera dans {token_data['expires_in']} secondes")
            else:
                error_msg = f"Erreur authentification Zoom: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                    logger.error(f"Détails de l'erreur: {error_data}")
                except:
                    error_msg += f" - {response.text}"
                    logger.error(f"Réponse brute: {response.text}")
                logger.error(error_msg)
                self.access_token = None
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de l'authentification Zoom")
            self.access_token = None
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête authentification Zoom: {e}")
            self.access_token = None
        except Exception as e:
            logger.error(f"Erreur authentification Zoom: {e}")
            self.access_token = None
    
    def _get_headers(self):
        """Retourne les headers d'authentification"""
        if not self.access_token or (self.token_expires_at and timezone.now() >= self.token_expires_at):
            self._authenticate()
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def create_meeting(self, topic: str, start_time: datetime, duration: int = 60,
                       password: str = None, settings: Dict = None) -> Dict:
        """Crée une nouvelle réunion Zoom"""
        if not self.access_token:
            return {"error": "Non authentifié avec Zoom"}
        
        try:
            # Générer un mot de passe si non fourni
            if not password:
                password = str(int(time.time()))[-6:]  # 6 derniers chiffres du timestamp
            
            # Paramètres par défaut
            default_settings = {
                "host_video": True,
                "participant_video": True,
                "join_before_host": False,
                "mute_upon_entry": True,
                "watermark": False,
                "use_pmi": False,
                "approval_type": 0,  # 0: Automatique, 1: Manuel, 2: Pas d'approbation
                "audio": "both",  # both, telephony, voip
                "auto_recording": "none",  # none, local, cloud
                "waiting_room": True,
                "meeting_authentication": False
            }
            
            if settings:
                default_settings.update(settings)
            
            payload = {
                "topic": topic,
                "type": 2,  # 2: Réunion planifiée
                "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%S"),
                "duration": duration,
                "password": password,
                "settings": default_settings
            }
            
            response = requests.post(
                f"{self.base_url}/users/me/meetings",
                headers=self._get_headers(),
                json=payload,
                timeout=30
            )
            
            if response.status_code == 201:
                meeting_data = response.json()
                return {
                    "success": True,
                    "id": meeting_data['id'],
                    "join_url": meeting_data['join_url'],
                    "start_url": meeting_data['start_url'],
                    "password": meeting_data['password'],
                    "host_email": meeting_data['host_email'],
                    "topic": meeting_data['topic'],
                    "start_time": meeting_data['start_time'],
                    "duration": meeting_data['duration'],
                    "settings": meeting_data['settings']
                }
            else:
                error_msg = f"Erreur création réunion Zoom: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la création de réunion Zoom")
            return {"error": "Timeout lors de la création"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête création réunion Zoom: {e}")
            return {"error": f"Erreur requête: {e}"}
        except Exception as e:
            logger.error(f"Erreur création réunion Zoom: {e}")
            return {"error": f"Erreur: {e}"}
    
    def get_meeting(self, meeting_id: str) -> Dict:
        """Récupère les détails d'une réunion Zoom"""
        if not self.access_token:
            return {"error": "Non authentifié avec Zoom"}
        
        try:
            response = requests.get(
                f"{self.base_url}/meetings/{meeting_id}",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_msg = f"Erreur récupération réunion: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la récupération de réunion Zoom")
            return {"error": "Timeout lors de la récupération"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête récupération réunion Zoom: {e}")
            return {"error": f"Erreur requête: {e}"}
        except Exception as e:
            logger.error(f"Erreur récupération réunion Zoom: {e}")
            return {"error": f"Erreur: {e}"}
    
    def update_meeting(self, meeting_id: str, updates: Dict) -> Dict:
        """Met à jour une réunion Zoom"""
        if not self.access_token:
            return {"error": "Non authentifié avec Zoom"}
        
        try:
            response = requests.patch(
                f"{self.base_url}/meetings/{meeting_id}",
                headers=self._get_headers(),
                json=updates,
                timeout=30
            )
            
            if response.status_code == 204:
                return {"success": True, "message": "Réunion mise à jour"}
            else:
                error_msg = f"Erreur mise à jour réunion: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la mise à jour de réunion Zoom")
            return {"error": "Timeout lors de la mise à jour"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête mise à jour réunion Zoom: {e}")
            return {"error": f"Erreur requête: {e}"}
        except Exception as e:
            logger.error(f"Erreur mise à jour réunion Zoom: {e}")
            return {"error": f"Erreur: {e}"}
    
    def delete_meeting(self, meeting_id: str) -> Dict:
        """Supprime une réunion Zoom"""
        if not self.access_token:
            return {"error": "Non authentifié avec Zoom"}
        
        try:
            response = requests.delete(
                f"{self.base_url}/meetings/{meeting_id}",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 204:
                return {"success": True, "message": "Réunion supprimée"}
            else:
                error_msg = f"Erreur suppression réunion: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la suppression de réunion Zoom")
            return {"error": "Timeout lors de la suppression"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête suppression réunion Zoom: {e}")
            return {"error": f"Erreur requête: {e}"}
        except Exception as e:
            logger.error(f"Erreur suppression réunion Zoom: {e}")
            return {"error": f"Erreur: {e}"}
    
    def get_meeting_participants(self, meeting_id: str) -> List[Dict]:
        """Récupère la liste des participants d'une réunion"""
        if not self.access_token:
            return []
        
        try:
            response = requests.get(
                f"{self.base_url}/meetings/{meeting_id}/participants",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                participants = []
                
                for participant in data.get('participants', []):
                    participants.append({
                        "id": participant.get('id'),
                        "name": participant.get('name'),
                        "user_email": participant.get('user_email'),
                        "join_time": participant.get('join_time'),
                        "leave_time": participant.get('leave_time'),
                        "duration": participant.get('duration'),
                        "attentiveness_score": participant.get('attentiveness_score')
                    })
                
                return participants
            else:
                error_msg = f"Erreur récupération participants: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return []
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la récupération des participants Zoom")
            return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête participants Zoom: {e}")
            return []
        except Exception as e:
            logger.error(f"Erreur récupération participants Zoom: {e}")
            return []
    
    def get_meeting_recordings(self, meeting_id: str) -> List[Dict]:
        """Récupère les enregistrements d'une réunion"""
        if not self.access_token:
            return []
        
        try:
            response = requests.get(
                f"{self.base_url}/meetings/{meeting_id}/recordings",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                recordings = []
                
                for recording in data.get('recording_files', []):
                    recordings.append({
                        "id": recording.get('id'),
                        "meeting_id": recording.get('meeting_id'),
                        "recording_start": recording.get('recording_start'),
                        "recording_end": recording.get('recording_end'),
                        "file_type": recording.get('file_type'),
                        "file_size": recording.get('file_size'),
                        "play_url": recording.get('play_url'),
                        "download_url": recording.get('download_url'),
                        "status": recording.get('status')
                    })
                
                return recordings
            else:
                error_msg = f"Erreur récupération enregistrements: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return []
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la récupération des enregistrements Zoom")
            return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête enregistrements Zoom: {e}")
            return []
        except Exception as e:
            logger.error(f"Erreur récupération enregistrements Zoom: {e}")
            return []
    
    def get_user_meetings(self, user_id: str = "me", status: str = "live") -> List[Dict]:
        """Récupère les réunions d'un utilisateur"""
        if not self.access_token:
            return []
        
        try:
            params = {"status": status}
            response = requests.get(
                f"{self.base_url}/users/{user_id}/meetings",
                headers=self._get_headers(),
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                meetings = []
                
                for meeting in data.get('meetings', []):
                    meetings.append({
                        "id": meeting.get('id'),
                        "topic": meeting.get('topic'),
                        "type": meeting.get('type'),
                        "start_time": meeting.get('start_time'),
                        "duration": meeting.get('duration'),
                        "join_url": meeting.get('join_url'),
                        "start_url": meeting.get('start_url'),
                        "status": meeting.get('status')
                    })
                
                return meetings
            else:
                error_msg = f"Erreur récupération réunions: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('message', '')}"
                except:
                    error_msg += f" - {response.text}"
                logger.error(error_msg)
                return []
                
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la récupération des réunions Zoom")
            return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur requête réunions Zoom: {e}")
            return []
        except Exception as e:
            logger.error(f"Erreur récupération réunions Zoom: {e}")
            return []
    
    def generate_signature(self, meeting_number: str, role: int = 0, 
                          api_key: str = None, api_secret: str = None) -> str:
        """Génère une signature JWT pour rejoindre une réunion"""
        if not api_key:
            api_key = self.client_id
        if not api_secret:
            api_secret = self.client_secret
        
        timestamp = int(round(time.time() * 1000)) - 30000
        msg = f"{api_key}{meeting_number}{timestamp}{role}"
        
        hash_string = hmac.new(
            api_secret.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        hash_string = '0' * (len(hash_string) % 2) + hash_string
        
        hash_array = []
        for i in range(0, len(hash_string), 2):
            hash_array.append(int(hash_string[i:i+2], 16))
        
        hash_array = [chr(i) for i in hash_array]
        signature = ''.join(hash_array)
        signature = base64.urlsafe_b64encode(signature.encode('utf-8')).decode('utf-8').rstrip('=')
        
        return signature

    def start_stream(self, meeting_id: str) -> Dict:
        """Démarre un stream Zoom"""
        if not self.access_token:
            logger.warning("Zoom API non initialisee - retour du statut simule")
            return {
                "success": False,
                "error": "Service Zoom non disponible",
                "status": "stopped"
            }
        
        try:
            logger.info(f"Démarrage du stream Zoom pour l'événement: {meeting_id}")
            
            # En mode dégradé, retourner un statut simulé
            if not self.enabled:
                return {
                    "success": True,
                    "message": "Stream démarré (mode simulation)",
                    "status": "live",
                    "meeting_id": meeting_id,
                    "warning": "Service Zoom désactivé - statut simulé"
                }
            
            # Logique réelle pour démarrer le stream (quand l'API sera configurée)
            # Pour l'instant, retourner un statut simulé
            return {
                "success": True,
                "message": "Stream démarré avec succès",
                "status": "live",
                "meeting_id": meeting_id,
                "note": "Fonctionnalité en mode simulation"
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du démarrage du stream Zoom: {e}")
            return {
                "success": False,
                "error": f"Erreur lors du démarrage: {str(e)}",
                "status": "error"
            }

    def stop_stream(self, meeting_id: str) -> Dict:
        """Arrête un stream Zoom"""
        if not self.access_token:
            logger.warning("Zoom API non initialisee - retour du statut simule")
            return {
                "success": False,
                "error": "Service Zoom non disponible",
                "status": "stopped"
            }
        
        try:
            logger.info(f"Arret du stream Zoom pour l'événement: {meeting_id}")
            
            # En mode dégradé, retourner un statut simulé
            if not self.enabled:
                return {
                    "success": True,
                    "message": "Stream arrêté (mode simulation)",
                    "status": "stopped",
                    "meeting_id": meeting_id,
                    "warning": "Service Zoom désactivé - statut simulé"
                }
            
            # Logique réelle pour arrêter le stream (quand l'API sera configurée)
            # Pour l'instant, retourner un statut simulé
            return {
                "success": True,
                "message": "Stream arrêté avec succès",
                "status": "stopped",
                "meeting_id": meeting_id,
                "note": "Fonctionnalité en mode simulation"
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'arrêt du stream Zoom: {e}")
            return {
                "success": False,
                "error": f"Erreur lors de l'arrêt: {str(e)}",
                "status": "error"
            }

    def end_meeting(self, meeting_id: str) -> Dict:
        """Termine une réunion Zoom (alias pour stop_stream)"""
        return self.stop_stream(meeting_id)

# Instance globale du service
zoom_service = ZoomService()
