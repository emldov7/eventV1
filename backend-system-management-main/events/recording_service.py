import logging
import os
from datetime import datetime, timedelta
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from .models import Event, VirtualEvent, NotificationLog
from .services import VirtualEventNotificationService

logger = logging.getLogger(__name__)

class VirtualEventRecordingService:
    """Service pour gérer les enregistrements des événements virtuels"""
    
    @staticmethod
    def add_recording(event_id, recording_file, recording_url=None, expires_in_days=30):
        """Ajoute un enregistrement à un événement virtuel"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            virtual_event = getattr(event, 'virtual_details', None)
            
            if not virtual_event:
                logger.error(f"Pas de détails virtuels pour l'événement {event_id}")
                return False
            
            # Si un fichier est fourni, le sauvegarder
            if recording_file:
                # Générer un nom de fichier unique
                filename = f"recordings/event_{event_id}_{int(timezone.now().timestamp())}.mp4"
                
                # Sauvegarder le fichier
                path = default_storage.save(filename, ContentFile(recording_file.read()))
                recording_url = default_storage.url(path)
                
                logger.info(f"Fichier d'enregistrement sauvegardé: {path}")
            
            # Mettre à jour l'événement virtuel
            virtual_event.recording_url = recording_url
            virtual_event.recording_available = True
            virtual_event.recording_expires_at = timezone.now() + timedelta(days=expires_in_days)
            virtual_event.save()
            
            # Notifier les participants
            VirtualEventRecordingService._notify_participants_recording_available(event)
            
            logger.info(f"Enregistrement ajouté pour l'événement {event_id}")
            return True
            
        except Event.DoesNotExist:
            logger.error(f"Événement {event_id} non trouvé")
            return False
        except Exception as e:
            logger.error(f"Erreur lors de l'ajout de l'enregistrement: {str(e)}")
            return False
    
    @staticmethod
    def remove_recording(event_id):
        """Supprime l'enregistrement d'un événement virtuel"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            virtual_event = getattr(event, 'virtual_details', None)
            
            if not virtual_event:
                return False
            
            # Supprimer le fichier si il existe
            if virtual_event.recording_url and 'media/' in virtual_event.recording_url:
                file_path = virtual_event.recording_url.replace('/media/', '')
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
                    logger.info(f"Fichier d'enregistrement supprimé: {file_path}")
            
            # Mettre à jour l'événement virtuel
            virtual_event.recording_url = ""
            virtual_event.recording_available = False
            virtual_event.recording_expires_at = None
            virtual_event.save()
            
            logger.info(f"Enregistrement supprimé pour l'événement {event_id}")
            return True
            
        except Event.DoesNotExist:
            logger.error(f"Événement {event_id} non trouvé")
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la suppression de l'enregistrement: {str(e)}")
            return False
    
    @staticmethod
    def extend_recording_expiry(event_id, additional_days):
        """Prolonge la durée de disponibilité d'un enregistrement"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            virtual_event = getattr(event, 'virtual_details', None)
            
            if not virtual_event or not virtual_event.recording_available:
                return False
            
            # Prolonger l'expiration
            if virtual_event.recording_expires_at:
                virtual_event.recording_expires_at += timedelta(days=additional_days)
            else:
                virtual_event.recording_expires_at = timezone.now() + timedelta(days=additional_days)
            
            virtual_event.save()
            
            logger.info(f"Expiration de l'enregistrement prolongée pour l'événement {event_id}")
            return True
            
        except Event.DoesNotExist:
            logger.error(f"Événement {event_id} non trouvé")
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la prolongation: {str(e)}")
            return False
    
    @staticmethod
    def get_recording_info(event_id):
        """Récupère les informations d'un enregistrement"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            virtual_event = getattr(event, 'virtual_details', None)
            
            if not virtual_event:
                return None
            
            if not virtual_event.recording_available:
                return {
                    'available': False,
                    'message': 'Aucun enregistrement disponible'
                }
            
            # Vérifier si l'enregistrement a expiré
            if virtual_event.recording_expires_at and virtual_event.recording_expires_at < timezone.now():
                return {
                    'available': False,
                    'message': 'Enregistrement expiré'
                }
            
            return {
                'available': True,
                'url': virtual_event.recording_url,
                'expires_at': virtual_event.recording_expires_at,
                'days_remaining': (virtual_event.recording_expires_at - timezone.now()).days if virtual_event.recording_expires_at else None
            }
            
        except Event.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des infos: {str(e)}")
            return None
    
    @staticmethod
    def _notify_participants_recording_available(event):
        """Notifie les participants qu'un enregistrement est disponible"""
        try:
            from .models import EventRegistration
            
            # Trouver tous les participants confirmés
            registrations = EventRegistration.objects.filter(
                event=event,
                status='confirmed'
            )
            
            for registration in registrations:
                try:
                    # Envoyer l'email de notification
                    context = {
                        'user': registration.user,
                        'event': event,
                        'virtual_event': getattr(event, 'virtual_details', None)
                    }
                    
                    # Utiliser le template existant ou créer un nouveau
                    from django.template.loader import render_to_string
                    from django.core.mail import send_mail
                    
                    html_content = render_to_string('emails/recording_available.html', context)
                    text_content = render_to_string('emails/recording_available.txt', context)
                    
                    send_mail(
                        subject=f"Rediffusion disponible - {event.title}",
                        message=text_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[registration.user.email],
                        html_message=html_content,
                        fail_silently=False
                    )
                    
                    # Log de la notification
                    NotificationLog.objects.create(
                        user=registration.user,
                        event=event,
                        type='recording_available',
                        status='sent',
                        details="Notification de rediffusion disponible"
                    )
                    
                except Exception as e:
                    logger.error(f"Erreur lors de la notification pour {registration.user.email}: {str(e)}")
            
            logger.info(f"Notifications de rediffusion envoyées pour {registrations.count()} participants")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi des notifications: {str(e)}")

class RecordingStorageService:
    """Service pour gérer le stockage des enregistrements"""
    
    @staticmethod
    def get_storage_path(event_id, filename):
        """Génère le chemin de stockage pour un enregistrement"""
        timestamp = int(timezone.now().timestamp())
        return f"recordings/event_{event_id}_{timestamp}_{filename}"
    
    @staticmethod
    def cleanup_orphaned_files():
        """Nettoie les fichiers orphelins dans le dossier recordings"""
        try:
            recordings_dir = "recordings/"
            
            if not default_storage.exists(recordings_dir):
                return
            
            # Lister tous les fichiers dans le dossier recordings
            files = default_storage.listdir(recordings_dir)[1]  # [1] pour les fichiers
            
            orphaned_files = []
            
            for filename in files:
                file_path = os.path.join(recordings_dir, filename)
                
                # Vérifier si le fichier est référencé dans la base de données
                if not VirtualEvent.objects.filter(recording_url__contains=filename).exists():
                    orphaned_files.append(file_path)
            
            # Supprimer les fichiers orphelins
            for file_path in orphaned_files:
                try:
                    default_storage.delete(file_path)
                    logger.info(f"Fichier orphelin supprimé: {file_path}")
                except Exception as e:
                    logger.error(f"Erreur lors de la suppression de {file_path}: {str(e)}")
            
            logger.info(f"{len(orphaned_files)} fichiers orphelins supprimés")
            
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des fichiers orphelins: {str(e)}")
    
    @staticmethod
    def get_storage_usage():
        """Récupère les statistiques d'utilisation du stockage"""
        try:
            recordings_dir = "recordings/"
            
            if not default_storage.exists(recordings_dir):
                return {
                    'total_files': 0,
                    'total_size': 0,
                    'oldest_file': None,
                    'newest_file': None
                }
            
            files = default_storage.listdir(recordings_dir)[1]
            total_size = 0
            file_dates = []
            
            for filename in files:
                file_path = os.path.join(recordings_dir, filename)
                try:
                    # Obtenir la taille du fichier
                    if hasattr(default_storage, 'size'):
                        file_size = default_storage.size(file_path)
                        total_size += file_size
                    
                    # Obtenir la date de modification
                    if hasattr(default_storage, 'get_modified_time'):
                        modified_time = default_storage.get_modified_time(file_path)
                        file_dates.append(modified_time)
                        
                except Exception as e:
                    logger.warning(f"Impossible d'obtenir les infos pour {file_path}: {str(e)}")
            
            return {
                'total_files': len(files),
                'total_size': total_size,
                'oldest_file': min(file_dates) if file_dates else None,
                'newest_file': max(file_dates) if file_dates else None
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de l'utilisation: {str(e)}")
            return None
