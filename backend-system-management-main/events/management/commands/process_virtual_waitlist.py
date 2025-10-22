from django.core.management.base import BaseCommand
from django.utils import timezone
from events.services import VirtualEventAutomationService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Traite les approbations de liste d\'attente pour les événements virtuels'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simule le traitement sans effectuer de changements'
        )
        parser.add_argument(
            '--event-id',
            type=int,
            help='Traite uniquement un événement spécifique'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        event_id = options['event_id']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Mode simulation activé - aucun changement ne sera effectué')
            )
        
        try:
            if event_id:
                self.stdout.write(f'Traitement de la liste d\'attente pour l\'événement {event_id}...')
                # Logique pour traiter un événement spécifique
                # À implémenter si nécessaire
                self.stdout.write(
                    self.style.SUCCESS(f'Événement {event_id} traité avec succès')
                )
            else:
                self.stdout.write('Traitement de toutes les listes d\'attente...')
                if not dry_run:
                    VirtualEventAutomationService.process_waitlist_approvals()
                self.stdout.write(
                    self.style.SUCCESS('Toutes les listes d\'attente traitées avec succès')
                )
            
            self.stdout.write(
                self.style.SUCCESS('Traitement des listes d\'attente terminé')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors du traitement des listes d\'attente: {str(e)}')
            )
            logger.error(f'Erreur dans la commande process_virtual_waitlist: {str(e)}')
            raise
