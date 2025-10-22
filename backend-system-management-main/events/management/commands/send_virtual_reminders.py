from django.core.management.base import BaseCommand
from django.utils import timezone
from events.services import VirtualEventAutomationService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Envoie les rappels automatiques pour les événements virtuels'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['24h', '1h', 'all'],
            default='all',
            help='Type de rappel à envoyer (24h, 1h, ou tous)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simule l\'envoi sans envoyer réellement les emails'
        )
    
    def handle(self, *args, **options):
        reminder_type = options['type']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Mode simulation activé - aucun email ne sera envoyé')
            )
        
        try:
            if reminder_type in ['24h', 'all']:
                self.stdout.write('Envoi des rappels 24h...')
                if not dry_run:
                    VirtualEventAutomationService.send_24h_reminders()
                self.stdout.write(
                    self.style.SUCCESS('Rappels 24h traités avec succès')
                )
            
            if reminder_type in ['1h', 'all']:
                self.stdout.write('Envoi des rappels 1h...')
                if not dry_run:
                    VirtualEventAutomationService.send_1h_reminders()
                self.stdout.write(
                    self.style.SUCCESS('Rappels 1h traités avec succès')
                )
            
            self.stdout.write(
                self.style.SUCCESS('Traitement des rappels terminé avec succès')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors du traitement des rappels: {str(e)}')
            )
            logger.error(f'Erreur dans la commande send_virtual_reminders: {str(e)}')
            raise
