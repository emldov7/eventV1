from django.core.management.base import BaseCommand
from events.models import Event, EventRegistration


class Command(BaseCommand):
    help = 'Corrige les compteurs d\'inscriptions pour tous les événements'

    def handle(self, *args, **options):
        """
        Recalcule et corrige les compteurs d'inscriptions pour tous les événements.
        Seules les inscriptions confirmées et assistées sont comptées.
        """
        events = Event.objects.all()
        fixed_count = 0
        
        for event in events:
            # Compter les inscriptions confirmées et assistées
            confirmed_count = event.registrations.filter(
                status__in=['confirmed', 'attended']
            ).count()
            
            # Mettre à jour le compteur si nécessaire
            if event.current_registrations != confirmed_count:
                old_count = event.current_registrations
                event.current_registrations = confirmed_count
                event.save(update_fields=['current_registrations'])
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Événement "{event.title}": {old_count} → {confirmed_count} inscriptions'
                    )
                )
                fixed_count += 1
        
        if fixed_count == 0:
            self.stdout.write(
                self.style.SUCCESS('Tous les compteurs sont déjà corrects.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Corrigé {fixed_count} événement(s) avec des compteurs incorrects.'
                )
            )

