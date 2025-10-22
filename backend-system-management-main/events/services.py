"""
Services corrigés pour les événements virtuels
"""
import logging
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.db.models import Q, Count, Avg, OuterRef, F
from django.core.files.storage import default_storage
from .models import Event, EventRegistration, NotificationLog, VirtualEvent, VirtualEventInteraction

logger = logging.getLogger(__name__)

class VirtualEventNotificationService:
    """Service pour gérer les notifications des événements virtuels"""
    
    @staticmethod
    def send_virtual_access_code(registration):
        """Envoie le code d'accès virtuel à un participant"""
        try:
            if not registration.event.is_virtual:
                logger.warning(f"Tentative d'envoi de code d'accès pour un événement non virtuel: {registration.event.id}")
                return False
            
            virtual_event = getattr(registration.event, 'virtual_details', None)
            if not virtual_event:
                logger.error(f"Pas de détails virtuels pour l'événement {registration.event.id}")
                return False
            
            # Préparer le contexte pour le template
            context = {
                'user': registration.user,
                'event': registration.event,
                'virtual_event': virtual_event,
                'registration': registration,
                'time_until_event': registration.event.start_date - timezone.now()
            }
            
            # Rendu des templates
            html_content = render_to_string('emails/virtual_access_code.html', context)
            text_content = render_to_string('emails/virtual_access_code.txt', context)
            
            # Envoi de l'email
            send_mail(
                subject=f"Code d'accès - {registration.event.title}",
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[registration.user.email],
                html_message=html_content,
                fail_silently=False
            )
            
            # Marquer comme envoyé
            registration.virtual_access_sent = True
            registration.save(update_fields=['virtual_access_sent'])
            
            # Log de la notification
            NotificationLog.objects.create(
                user=registration.user,
                event=registration.event,
                type='virtual_access',
                status='sent',
                details=f"Code d'accès virtuel envoyé: {virtual_event.get_access_code()}"
            )
            
            logger.info(f"Code d'accès virtuel envoyé à {registration.user.email} pour l'événement {registration.event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du code d'accès virtuel: {str(e)}")
            
            # Log de l'erreur
            NotificationLog.objects.create(
                user=registration.user,
                event=registration.event,
                type='virtual_access',
                status='failed',
                details=f"Erreur: {str(e)}"
            )
            return False
    
    @staticmethod
    def send_virtual_reminder(registration, hours_before=1):
        """Envoie un rappel avant l'événement virtuel"""
        try:
            if not registration.event.is_virtual:
                return False
            
            virtual_event = getattr(registration.event, 'virtual_details', None)
            if not virtual_event:
                return False
            
            # Vérifier si le rappel a déjà été envoyé
            existing_reminder = NotificationLog.objects.filter(
                user=registration.user,
                event=registration.event,
                type='virtual_reminder',
                details__contains=f"Rappel {hours_before}h"
            ).first()
            
            if existing_reminder:
                return True  # Déjà envoyé
            
            # Préparer le contexte
            context = {
                'user': registration.user,
                'event': registration.event,
                'virtual_event': virtual_event,
                'registration': registration,
                'hours_before': hours_before
            }
            
            # Rendu des templates
            html_content = render_to_string('emails/virtual_reminder.html', context)
            text_content = render_to_string('emails/virtual_reminder.txt', context)
            
            # Envoi de l'email
            send_mail(
                subject=f"Rappel {hours_before}h - {registration.event.title}",
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[registration.user.email],
                html_message=html_content,
                fail_silently=False
            )
            
            # Log de la notification
            NotificationLog.objects.create(
                user=registration.user,
                event=registration.event,
                type='virtual_reminder',
                status='sent',
                details=f"Rappel {hours_before}h envoyé"
            )
            
            logger.info(f"Rappel {hours_before}h envoyé à {registration.user.email} pour l'événement {registration.event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du rappel: {str(e)}")
            return False
    
    @staticmethod
    def send_waitlist_approval(registration):
        """Envoie la notification d'approbation de liste d'attente"""
        try:
            if not registration.event.is_virtual:
                return False
            
            virtual_event = getattr(registration.event, 'virtual_details', None)
            if not virtual_event:
                return False
            
            # Préparer le contexte
            context = {
                'user': registration.user,
                'event': registration.event,
                'virtual_event': virtual_event,
                'registration': registration
            }
            
            # Rendu des templates
            html_content = render_to_string('emails/virtual_access_code.html', context)
            text_content = render_to_string('emails/virtual_access_code.txt', context)
            
            # Envoi de l'email
            send_mail(
                subject=f"Approbation liste d'attente - {registration.event.title}",
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[registration.user.email],
                html_message=html_content,
                fail_silently=False
            )
            
            # Envoyer le code d'accès
            registration.virtual_access_code = virtual_event.get_access_code()
            registration.virtual_access_sent = True
            registration.save(update_fields=['virtual_access_code', 'virtual_access_sent'])
            
            logger.info(f"Approbation liste d'attente envoyée à {registration.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'approbation: {str(e)}")
            return False

class VirtualEventAutomationService:
    """Service pour l'automatisation des événements virtuels"""
    
    @staticmethod
    def send_24h_reminders():
        """Envoie les rappels 24h avant les événements virtuels"""
        tomorrow = timezone.now() + timedelta(days=1)
        
        upcoming_events = Event.objects.filter(
            event_type='virtual',
            status='published',
            start_date__date=tomorrow.date(),
            start_date__hour__gte=0,
            start_date__hour__lt=24
        )
        
        for event in upcoming_events:
            registrations = EventRegistration.objects.filter(
                event=event,
                status='confirmed',
                virtual_access_sent=True
            )
            
            for registration in registrations:
                VirtualEventNotificationService.send_virtual_reminder(registration, hours_before=24)
        
        logger.info(f"Rappels 24h envoyés pour {upcoming_events.count()} événements virtuels")
    
    @staticmethod
    def send_1h_reminders():
        """Envoie les rappels 1h avant les événements virtuels"""
        now = timezone.now()
        in_1h = now + timedelta(hours=1)
        
        upcoming_events = Event.objects.filter(
            event_type='virtual',
            status='published',
            start_date__gte=in_1h - timedelta(minutes=30),
            start_date__lte=in_1h + timedelta(minutes=30)
        )
        
        for event in upcoming_events:
            registrations = EventRegistration.objects.filter(
                event=event,
                status='confirmed',
                virtual_access_sent=True
            )
            
            for registration in registrations:
                VirtualEventNotificationService.send_virtual_reminder(registration, hours_before=1)
        
        logger.info(f"Rappels 1h envoyés pour {upcoming_events.count()} événements virtuels")
    
    @staticmethod
    def process_waitlist_approvals():
        """Traite les approbations de liste d'attente pour les événements virtuels"""
        available_events = Event.objects.filter(
            event_type='virtual',
            status='published',
            start_date__gt=timezone.now()
        ).annotate(
            current_count=Count('registrations', filter=Q(registrations__status='confirmed'))
        ).filter(
            Q(max_capacity__isnull=True) | Q(current_count__lt=F('max_capacity'))
        )
        
        for event in available_events:
            waitlisted = EventRegistration.objects.filter(
                event=event,
                status='waitlisted'
            ).order_by('created_at')
            
            if event.max_capacity:
                confirmed_count = EventRegistration.objects.filter(
                    event=event,
                    status='confirmed'
                ).count()
                available_slots = event.max_capacity - confirmed_count
            else:
                available_slots = float('inf')
            
            for registration in waitlisted[:available_slots]:
                registration.status = 'confirmed'
                registration.save()
                VirtualEventNotificationService.send_waitlist_approval(registration)
                
                logger.info(f"Participant {registration.user.email} approuvé de la liste d'attente")
        
        logger.info(f"Traitement des listes d'attente terminé pour {available_events.count()} événements")
    
    @staticmethod
    def cleanup_expired_recordings():
        """Nettoie les enregistrements expirés"""
        now = timezone.now()
        
        expired_recordings = VirtualEvent.objects.filter(
            recording_expires_at__lt=now,
            recording_available=True
        )
        
        for virtual_event in expired_recordings:
            virtual_event.recording_available = False
            virtual_event.recording_url = ""
            virtual_event.save(update_fields=['recording_available', 'recording_url'])
            
            logger.info(f"Enregistrement expiré supprimé pour l'événement {virtual_event.event.id}")
        
        logger.info(f"{expired_recordings.count()} enregistrements expirés nettoyés")

class VirtualEventRecordingService:
    """Service pour la gestion des enregistrements"""
    
    @staticmethod
    def add_recording(virtual_event, recording_file=None, recording_url=None, expires_in_days=30):
        """Ajoute un enregistrement à un événement virtuel"""
        try:
            if recording_file:
                # Upload du fichier
                file_path = f"recordings/{virtual_event.event.id}/{recording_file.name}"
                saved_path = default_storage.save(file_path, recording_file)
                virtual_event.recording_url = saved_path
            
            elif recording_url:
                virtual_event.recording_url = recording_url
            
            virtual_event.recording_available = True
            virtual_event.recording_expires_at = timezone.now() + timedelta(days=expires_in_days)
            virtual_event.save()
            
            # Notifier les participants
            VirtualEventRecordingService._notify_participants_recording_available(virtual_event.event)
            
            logger.info(f"Enregistrement ajouté pour l'événement {virtual_event.event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'ajout de l'enregistrement: {str(e)}")
            return False
    
    @staticmethod
    def remove_recording(virtual_event):
        """Supprime un enregistrement"""
        try:
            if virtual_event.recording_url and not virtual_event.recording_url.startswith('http'):
                default_storage.delete(virtual_event.recording_url)
            
            virtual_event.recording_url = ""
            virtual_event.recording_available = False
            virtual_event.recording_expires_at = None
            virtual_event.save()
            
            logger.info(f"Enregistrement supprimé pour l'événement {virtual_event.event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la suppression: {str(e)}")
            return False
    
    @staticmethod
    def extend_recording_expiry(virtual_event, additional_days=30):
        """Prolonge l'expiration d'un enregistrement"""
        try:
            if virtual_event.recording_expires_at:
                virtual_event.recording_expires_at += timedelta(days=additional_days)
            else:
                virtual_event.recording_expires_at = timezone.now() + timedelta(days=additional_days)
            
            virtual_event.save(update_fields=['recording_expires_at'])
            logger.info(f"Expiration prolongée pour l'événement {virtual_event.event.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la prolongation: {str(e)}")
            return False
    
    @staticmethod
    def get_recording_info(event_id):
        """Récupère les informations d'enregistrement d'un événement"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            virtual_event = getattr(event, 'virtual_details', None)
            
            if not virtual_event:
                return None
            
            return {
                'recording_url': virtual_event.recording_url,
                'recording_available': virtual_event.recording_available,
                'recording_expires_at': virtual_event.recording_expires_at,
                'auto_record': virtual_event.auto_record,
                'platform': virtual_event.platform
            }
            
        except Event.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des infos d'enregistrement: {str(e)}")
            return None
    
    @staticmethod
    def _notify_participants_recording_available(event):
        """Notifie les participants de la disponibilité de l'enregistrement"""
        try:
            registrations = EventRegistration.objects.filter(
                event=event,
                status__in=['confirmed', 'attended']
            )
            
            for registration in registrations:
                context = {
                    'user': registration.user,
                    'event': event,
                    'virtual_event': event.virtual_details
                }
                
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
                
            logger.info(f"Notifications de rediffusion envoyées pour {registrations.count()} participants")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi des notifications: {str(e)}")

class VirtualEventAnalyticsService:
    """Service pour les analyses des événements virtuels"""
    
    @staticmethod
    def get_event_interaction_stats(event_id):
        """Récupère les statistiques d'interaction pour un événement"""
        try:
            event = Event.objects.get(id=event_id, event_type='virtual')
            
            interactions = VirtualEventInteraction.objects.filter(event=event)
            
            stats = {
                'total_interactions': interactions.count(),
                'likes': interactions.filter(interaction_type='like').count(),
                'comments': interactions.filter(interaction_type='comment').count(),
                'shares': interactions.filter(interaction_type='share').count(),
                'ratings': interactions.filter(interaction_type='rating').count(),
                'average_rating': interactions.filter(
                    interaction_type='rating',
                    rating__isnull=False
                ).aggregate(avg=Avg('rating'))['avg'] or 0,
                'unique_users': interactions.values('user').distinct().count()
            }
            
            return stats
            
        except Event.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Erreur lors du calcul des statistiques: {str(e)}")
            return None
    
    @staticmethod
    def get_user_interaction_history(user_id):
        """Récupère l'historique des interactions d'un utilisateur"""
        try:
            interactions = VirtualEventInteraction.objects.filter(
                user_id=user_id
            ).select_related('event').order_by('-created_at')
            
            return interactions
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'historique: {str(e)}")
            return []
    
    @staticmethod
    def get_popular_virtual_events(limit=10):
        """Récupère les événements virtuels les plus populaires"""
        try:
            events = Event.objects.filter(
                event_type='virtual',
                status='published'
            ).annotate(
                interaction_score=Count('interactions') * 2 + Count('registrations', filter=Q(registrations__status='confirmed'))
            ).order_by('-interaction_score')[:limit]
            
            return events
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de la popularité: {str(e)}")
            return []
