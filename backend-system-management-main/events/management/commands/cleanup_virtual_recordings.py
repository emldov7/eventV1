from django.core.management.base import BaseCommand
from django.utils import timezone
from events.services import VirtualEventAutomationService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Nettoie les enregistrements virtuels expirés'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simule le nettoyage sans effectuer de changements'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force le nettoyage même si les enregistrements ne sont pas expirés'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Mode simulation activé - aucun changement ne sera effectué')
            )
        
        if force:
            self.stdout.write(
                self.style.WARNING('Mode force activé - tous les enregistrements seront nettoyés')
            )
        
        try:
            self.stdout.write('Nettoyage des enregistrements expirés...')
            if not dry_run:
                VirtualEventAutomationService.cleanup_expired_recordings()
            self.stdout.write(
                self.style.SUCCESS('Nettoyage des enregistrements terminé avec succès')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors du nettoyage: {str(e)}')
            )
            logger.error(f'Erreur dans la commande cleanup_virtual_recordings: {str(e)}')
            raise
