"""
Système d'envoi d'emails pour les événements virtuels
"""

import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import EventRegistration

logger = logging.getLogger(__name__)

def send_event_confirmation_email(registration):
    """
    Envoie un email de confirmation avec les identifiants de connexion
    """
    try:
        event = registration.event
        
        # 🎯 CORRECTION : Déterminer l'email du destinataire (utilisateur ou invité)
        if registration.user:
            # Utilisateur connecté
            user = registration.user
            recipient_email = user.email
        else:
            # Invité
            user = None
            recipient_email = registration.guest_email
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            logger.warning(f"Tentative d'envoi d'email virtuel pour un événement non virtuel: {event.id}")
            return {
                "success": False,
                "error": "L'événement n'est pas virtuel"
            }
        
        # Récupérer les détails virtuels
        try:
            virtual_event = event.virtual_details
        except Exception:
            logger.error(f"Impossible de récupérer les détails virtuels pour l'événement {event.id}")
            return {
                "success": False,
                "error": "Détails virtuels non disponibles"
            }
        
        # IMPORTANT : Les IDs de streaming ne sont plus générés automatiquement
        # L'organisateur doit lancer le stream manuellement via le bouton "Lancer le live"
        if not virtual_event.meeting_id:
            logger.info(f"IDs de streaming non encore générés pour l'événement {event.id}")
            logger.info(f"L'organisateur doit lancer le stream manuellement")
        
        # Préparer le contexte pour le template
        if user:
            # Utilisateur connecté
            context = {
                'user': user,
                'event': event,
                'virtual_event': virtual_event,
                'registration': registration,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/virtual_access_code.html', context)
            text_content = render_to_string('emails/virtual_access_code.txt', context)
        else:
            # Invité
            context = {
                'guest_full_name': registration.guest_full_name,
                'event': event,
                'virtual_event': virtual_event,
                'registration': registration,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/guest_virtual_access_code.html', context)
            text_content = render_to_string('emails/guest_virtual_access_code.txt', context)
        
        # Calculer le temps restant jusqu'à l'événement
        if event.start_date:
            time_diff = event.start_date - timezone.now()
            if time_diff.total_seconds() > 0:
                days = time_diff.days
                hours = time_diff.seconds // 3600
                minutes = (time_diff.seconds % 3600) // 60
                
                if days > 0:
                    time_until_event = f"{days} jour(s), {hours} heure(s)"
                elif hours > 0:
                    time_until_event = f"{hours} heure(s), {minutes} minute(s)"
                else:
                    time_until_event = f"{minutes} minute(s)"
            else:
                time_until_event = "L'événement a commencé"
        else:
            time_until_event = "Date non définie"
        
        context['time_until_event'] = time_until_event
        
        # Sujet de l'email
        subject = f"Événement Virtuel Confirmé ! - {event.title}"
        
        # Envoi de l'email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        
        # Envoi
        email.send()
        
        logger.info(f"Email de confirmation envoyé avec succès à {recipient_email} pour l'événement {event.title}")
        
        return {
            "success": True,
            "message": "Email envoyé avec succès",
            "recipient": recipient_email,
            "event": event.title
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de confirmation: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def send_stream_launched_email(virtual_event):
    """
    Envoie un email de mise à jour à tous les participants confirmés
    quand le stream est lancé par l'organisateur
    """
    try:
        event = virtual_event.event
        
        # Récupérer tous les participants confirmés
        confirmed_registrations = EventRegistration.objects.filter(
            event=event,
            status='confirmed',
            payment_status='paid'
        )
        
        logger.info(f"Envoi d'emails de mise à jour pour {confirmed_registrations.count()} participants confirmés")
        
        for registration in confirmed_registrations:
            # 🎯 CORRECTION : Gérer les utilisateurs ET les invités
            if registration.user:
                # Utilisateur connecté
                user = registration.user
                recipient_email = user.email
                context = {
                    'user': user,
                    'event': event,
                    'virtual_event': virtual_event,
                    'registration': registration,
                    'current_time': timezone.now(),
                    'stream_just_launched': True,  # Indicateur spécial
                }
                html_content = render_to_string('emails/virtual_access_code.html', context)
                text_content = render_to_string('emails/virtual_access_code.txt', context)
            else:
                # Invité
                user = None
                recipient_email = registration.guest_email
                context = {
                    'guest_full_name': registration.guest_full_name,
                    'event': event,
                    'virtual_event': virtual_event,
                    'registration': registration,
                    'current_time': timezone.now(),
                    'stream_just_launched': True,  # Indicateur spécial
                }
                html_content = render_to_string('emails/guest_virtual_access_code.html', context)
                text_content = render_to_string('emails/guest_virtual_access_code.txt', context)
            
            # Sujet de l'email
            subject = f"🎥 Stream lancé ! - Rejoignez {event.title}"
            
            # Envoi de l'email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email]
            )
            email.attach_alternative(html_content, "text/html")
            
            # Envoi
            email.send()
            
            logger.info(f"Email de mise à jour envoyé à {recipient_email} pour l'événement {event.title}")
        
        return {
            "success": True,
            "message": f"Emails de mise à jour envoyés à {confirmed_registrations.count()} participants",
            "count": confirmed_registrations.count()
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi des emails de mise à jour: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def send_virtual_reminder_email(registration, reminder_type="1h"):
    """
    Envoie un email de rappel pour un événement virtuel
    """
    try:
        event = registration.event
        
        # 🎯 CORRECTION : Déterminer l'email du destinataire (utilisateur ou invité)
        if registration.user:
            # Utilisateur connecté
            user = registration.user
            recipient_email = user.email
        else:
            # Invité
            user = None
            recipient_email = registration.guest_email
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            return {
                "success": False,
                "error": "L'événement n'est pas virtuel"
            }
        
        # Récupérer les détails virtuels
        try:
            virtual_event = event.virtual_details
        except Exception:
            return {
                "success": False,
                "error": "Détails virtuels non disponibles"
            }
        
        # Préparer le contexte
        if user:
            # Utilisateur connecté
            context = {
                'user': user,
                'event': event,
                'virtual_event': virtual_event,
                'registration': registration,
                'reminder_type': reminder_type,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/virtual_reminder.html', context)
            text_content = render_to_string('emails/virtual_reminder.txt', context)
        else:
            # Invité
            context = {
                'guest_full_name': registration.guest_full_name,
                'event': event,
                'virtual_event': virtual_event,
                'registration': registration,
                'reminder_type': reminder_type,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/guest_virtual_reminder.html', context)
            text_content = render_to_string('emails/guest_virtual_reminder.txt', context)
        
        # Sujet selon le type de rappel
        if reminder_type == "1h":
            subject = f"Rappel : Votre événement virtuel {event.title} commence dans 1 heure"
        elif reminder_type == "1d":
            subject = f"Rappel : Votre événement virtuel {event.title} commence demain"
        else:
            subject = f"Rappel : Votre événement virtuel {event.title}"
        
        # Envoi de l'email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        logger.info(f"Email de rappel {reminder_type} envoyé à {recipient_email} pour l'événement {event.title}")
        
        return {
            "success": True,
            "message": f"Rappel {reminder_type} envoyé avec succès",
            "recipient": recipient_email,
            "event": event.title
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du rappel {reminder_type}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def send_recording_available_email(registration, recording_url):
    """
    Envoie un email pour informer qu'un enregistrement est disponible
    """
    try:
        event = registration.event
        
        # 🎯 CORRECTION : Déterminer l'email du destinataire (utilisateur ou invité)
        if registration.user:
            # Utilisateur connecté
            user = registration.user
            recipient_email = user.email
        else:
            # Invité
            user = None
            recipient_email = registration.guest_email
        
        # Vérifier que c'est un événement virtuel
        if event.event_type != 'virtual':
            return {
                "success": False,
                "error": "L'événement n'est pas virtuel"
            }
        
        # Préparer le contexte
        if user:
            # Utilisateur connecté
            context = {
                'user': user,
                'event': event,
                'registration': registration,
                'recording_url': recording_url,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/recording_available.html', context)
            text_content = render_to_string('emails/recording_available.txt', context)
        else:
            # Invité
            context = {
                'guest_full_name': registration.guest_full_name,
                'event': event,
                'registration': registration,
                'recording_url': recording_url,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/guest_recording_available.html', context)
            text_content = render_to_string('emails/guest_recording_available.txt', context)
        
        # Sujet
        subject = f"Enregistrement disponible pour {event.title}"
        
        # Envoi de l'email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        logger.info(f"Email d'enregistrement envoyé à {recipient_email} pour l'événement {event.title}")
        
        return {
            "success": True,
            "message": "Email d'enregistrement envoyé avec succès",
            "recipient": recipient_email,
            "event": event.title
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email d'enregistrement: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def send_virtual_event_cancellation_email(registration):
    """
    Envoie un email d'annulation pour un événement virtuel
    """
    try:
        event = registration.event
        
        # 🎯 CORRECTION : Déterminer l'email du destinataire (utilisateur ou invité)
        recipient_email = None
        if registration.user:
            recipient_email = registration.user.email
        elif registration.guest_email:
            recipient_email = registration.guest_email
        
        if not recipient_email:
            return {
                "success": False,
                "error": "Aucun email trouvé pour cette inscription"
            }
        
        # 🎯 CORRECTION : Préparer le contexte selon le type d'inscription
        if registration.user:
            # Utilisateur connecté
            context = {
                'user': registration.user,
                'event': event,
                'registration': registration,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/event_cancelled_participant.html', context)
            text_content = render_to_string('emails/event_cancelled_participant.txt', context)
        else:
            # Invité
            context = {
                'guest_full_name': registration.guest_full_name,
                'event': event,
                'registration': registration,
                'current_time': timezone.now(),
            }
            html_content = render_to_string('emails/guest_event_cancelled.html', context)
            text_content = render_to_string('emails/guest_event_cancelled.txt', context)
        
        # Sujet
        subject = f"Événement annulé : {event.title}"
        
        # Envoi de l'email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        logger.info(f"Email d'annulation envoyé à {recipient_email} ({'Utilisateur' if registration.user else 'Invitée'}) pour l'événement {event.title}")
        
        return {
            "success": True,
            "message": "Email d'annulation envoyé avec succès",
            "recipient": recipient_email,
            "event": event.title
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email d'annulation: {e}")
        return {
            "success": False,
            "error": str(e)
        }
