from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
import uuid
import io
from decimal import Decimal

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrateur'),  # 👑 Niveau le plus élevé
        ('organizer', 'Organisateur'),           # 🎪 Niveau intermédiaire
        ('participant', 'Participant'),          # 👤 Niveau utilisateur
        ('guest', 'Invité'),                     # 🚶‍♂️ Niveau visiteur
    ]
    
    STATUS_APPROVAL_CHOICES = [
        ('pending', 'En attente d\'approbation'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=3, blank=True, null=True, verbose_name="Pays")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    status_approval = models.CharField(max_length=20, choices=STATUS_APPROVAL_CHOICES, default='approved')
    approval_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_profiles')
    rejection_reason = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Si le statut passe à 'approved', enregistrer la date et l'approbateur
        if self.status_approval == 'approved' and not self.approval_date:
            from django.utils import timezone
            self.approval_date = timezone.now()
        super().save(*args, **kwargs)
    
    @property
    def is_super_admin(self):
        """Vérifie si l'utilisateur est un Super Admin"""
        return self.role == 'super_admin'
    
    @property
    def is_organizer(self):
        """Vérifie si l'utilisateur est un Organisateur"""
        return self.role == 'organizer'
    
    @property
    def is_participant(self):
        """Vérifie si l'utilisateur est un Participant"""
        return self.role == 'participant'
    
    @property
    def can_manage_all_events(self):
        """Vérifie si l'utilisateur peut gérer tous les événements"""
        return self.role == 'super_admin'
    
    @property
    def can_manage_users(self):
        """Vérifie si l'utilisateur peut gérer d'autres utilisateurs"""
        return self.role == 'super_admin'
    
    @property
    def requires_approval(self):
        """Vérifie si le compte nécessite une approbation"""
        return self.role == 'organizer' and self.status_approval != 'approved'
    
    @property
    def is_fully_approved(self):
        """Vérifie si le compte est entièrement approuvé"""
        return self.status_approval == 'approved'


try:
    import qrcode
    from PIL import Image
except Exception:  # pragma: no cover - handled by requirements
    qrcode = None
    Image = None


class Category(models.Model):
    """Modèle pour les catégories d'événements"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#1976d2')  # Code couleur hex
    icon = models.CharField(max_length=10, blank=True)  # Emoji ou icône
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['name']

    def __str__(self):
        return self.name

class Tag(models.Model):
    """Modèle pour les tags d'événements"""
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#666666')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ['name']

    def __str__(self):
        return self.name


class Event(models.Model):
    """Modèle principal pour les événements"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('published', 'Publié'),
        ('cancelled', 'Annulé'),
        ('completed', 'Terminé'),
        ('postponed', 'Reporté'),
    ]

    PLACE_TYPE_CHOICES = [
        ('limited', 'Places limitées'),
        ('unlimited', 'Places illimitées'),
    ]

    EVENT_TYPE_CHOICES = [
        ('physical', 'Événement physique'),
        ('virtual', 'Événement virtuel'),
    ]

    VIRTUAL_PLATFORM_CHOICES = [
        ('zoom', 'Zoom'),
        ('youtube_live', 'YouTube Live'),
        ('teams', 'Microsoft Teams'),
        ('meet', 'Google Meet'),
        ('webex', 'Cisco Webex'),
        ('custom', 'Plateforme personnalisée'),
    ]

    # Informations de base
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    short_description = models.CharField(max_length=300, blank=True, verbose_name="Description courte")
    
    # Type d'événement
    event_type = models.CharField(
        max_length=10, 
        choices=EVENT_TYPE_CHOICES, 
        default='physical', 
        verbose_name="Type d'événement"
    )
    
    # Dates et lieu
    start_date = models.DateTimeField(verbose_name="Date de début")
    end_date = models.DateTimeField(verbose_name="Date de fin")
    location = models.CharField(max_length=200, verbose_name="Lieu")
    address = models.TextField(blank=True, verbose_name="Adresse complète")
    
    # Gestion des places
    place_type = models.CharField(max_length=10, choices=PLACE_TYPE_CHOICES, default='unlimited', verbose_name="Type de places")
    max_capacity = models.PositiveIntegerField(null=True, blank=True, verbose_name="Capacité maximale")
    current_registrations = models.PositiveIntegerField(default=0, verbose_name="Inscriptions actuelles")
    enable_waitlist = models.BooleanField(default=True, verbose_name="Activer la liste d'attente pour les billets par défaut")
    
    # Prix
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Prix")
    is_free = models.BooleanField(default=True, verbose_name="Gratuit")
    
    # Images et médias
    poster = models.ImageField(upload_to='events/posters/', blank=True, null=True, verbose_name="Affiche")
    banner = models.ImageField(upload_to='events/banners/', blank=True, null=True, verbose_name="Bannière")
    
    # Relations
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Catégorie")
    tags = models.ManyToManyField(Tag, blank=True, verbose_name="Tags")
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events_organized', verbose_name="Organisateur")
    
    # Statut et métadonnées
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Statut")
    is_featured = models.BooleanField(default=False, verbose_name="Événement en vedette")
    is_public = models.BooleanField(default=True, verbose_name="Public")
    ACCESS_CHOICES = [
        ('public', 'Public'),
        ('private', 'Privé'),
        ('invite', 'Sur invitation'),
    ]
    access_type = models.CharField(max_length=10, choices=ACCESS_CHOICES, default='public')
    virtual_link = models.URLField(blank=True)
    
    # Informations de contact
    contact_email = models.EmailField(blank=True, verbose_name="Email de contact")
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone de contact")
    website = models.URLField(blank=True, verbose_name="Site web")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Slug pour URL
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    
    class Meta:
        verbose_name = "Événement"
        verbose_name_plural = "Événements"
        ordering = ['-start_date']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = f"{uuid.uuid4().hex[:8]}-{self.title.lower().replace(' ', '-')}"
        
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        # 🎯 NOUVELLE LOGIQUE : Déterminer si l'événement est gratuit
        try:
            # Si des types de billets existent, vérifier s'ils sont tous gratuits
            if self.ticket_types.exists():
                # L'événement est gratuit seulement si TOUS les types de billets sont gratuits
                self.is_free = all(Decimal(ticket_type.price or 0) == Decimal('0') for ticket_type in self.ticket_types.all())
            else:
                # Pas de types de billets, utiliser le prix par défaut
                self.is_free = (Decimal(self.price or 0) == Decimal('0'))
        except Exception:
            pass
        
        super().save(*args, **kwargs)

    @property
    def is_full(self):
        """Vérifie si l'événement est complet"""
        if self.place_type == 'unlimited' or self.max_capacity is None:
            return False
        return self.current_registrations >= self.max_capacity

    @property
    def available_places(self):
        """Retourne le nombre de places disponibles"""
        if self.place_type == 'unlimited' or self.max_capacity is None:
            return None
        return max(0, self.max_capacity - self.current_registrations)

    # 🎯 NOUVELLE LOGIQUE DE COMPTAGE SÉPARÉ
    @property
    def default_ticket_available_places(self):
        """Places disponibles pour les billets par défaut (SEULEMENT les billets sans type spécifique)"""
        if self.place_type == 'unlimited' or self.max_capacity is None:
            return None
        
        # 🎯 CORRECTION MAJEURE : Compter SEULEMENT les inscriptions confirmées SANS type de billet spécifique
        default_confirmed_registrations = self.registrations.filter(
            status__in=['confirmed', 'attended'],
            ticket_type__isnull=True  # Seulement les billets par défaut
        ).count()
        
        print(f"🔍 DEBUG: default_ticket_available_places - Total: {self.max_capacity}, Billets par défaut confirmés: {default_confirmed_registrations}")
        
        return max(0, self.max_capacity - default_confirmed_registrations)

    @property
    def default_ticket_is_full(self):
        """Vérifie si les billets par défaut sont complets"""
        if self.place_type == 'unlimited' or self.max_capacity is None:
            return False
        return self.default_ticket_available_places <= 0

    def get_ticket_type_availability(self):
        """Retourne la disponibilité de chaque type de billet"""
        availability = {}
        
        for ticket_type in self.ticket_types.all():
            # 🎯 CORRECTION MAJEURE : Utiliser sold_count au lieu de compter les inscriptions
            confirmed_count = ticket_type.sold_count
            
            available = max(0, ticket_type.quantity - confirmed_count) if ticket_type.quantity else None
            availability[ticket_type.id] = {
                'name': ticket_type.name,
                'max_quantity': ticket_type.quantity,
                'confirmed_count': confirmed_count,
                'available': available,
                'is_full': available == 0 if available is not None else False
            }
        
        return availability

    def get_session_availability(self):
        """Retourne la disponibilité de chaque session"""
        availability = {}
        
        for session in self.session_types.all():
            # Compter les inscriptions confirmées pour cette session
            confirmed_count = self.registrations.filter(
                status__in=['confirmed', 'attended'],
                session_type=session
            ).count()
            
            availability[session.id] = {
                'name': session.name,
                'confirmed_count': confirmed_count,
                'is_active': session.is_active,
                'is_mandatory': session.is_mandatory
            }
        
        return availability

    def can_register_for_default_ticket(self):
        """Vérifie si on peut encore s'inscrire avec un billet par défaut"""
        if self.place_type == 'unlimited':
            return True
        return self.default_ticket_available_places > 0
    
    @property
    def min_ticket_price(self):
        """Retourne le prix minimum des types de billets"""
        if self.ticket_types.exists():
            prices = [Decimal(ticket_type.price or 0) for ticket_type in self.ticket_types.all()]
            return min(prices)
        return Decimal(self.price or 0)
    
    @property
    def max_ticket_price(self):
        """Retourne le prix maximum des types de billets"""
        if self.ticket_types.exists():
            prices = [Decimal(ticket_type.price or 0) for ticket_type in self.ticket_types.all()]
            return max(prices)
        return Decimal(self.price or 0)
    
    @property
    def price_range_display(self):
        """Retourne l'affichage de la gamme de prix"""
        if self.ticket_types.exists():
            min_price = self.min_ticket_price
            max_price = self.max_ticket_price
            
            if min_price == max_price:
                if min_price == 0:
                    return "Gratuit"
                else:
                    return f"${min_price:.2f}"
            else:
                if min_price == 0:
                    return f"Gratuit - ${max_price:.2f}"
                else:
                    return f"${min_price:.2f} - ${max_price:.2f}"
        else:
            if self.is_free:
                return "Gratuit"
            else:
                return f"${self.price:.2f}"

    def can_register_for_ticket_type(self, ticket_type_id):
        """Vérifie si on peut encore s'inscrire avec un type de billet spécifique"""
        try:
            ticket_type = self.ticket_types.get(id=ticket_type_id)
            if ticket_type.quantity is None:  # Illimité
                return True
            
            confirmed_count = self.registrations.filter(
                status__in=['confirmed', 'attended'],
                ticket_type=ticket_type
            ).count()
            
            return confirmed_count < ticket_type.quantity
        except TicketType.DoesNotExist:
            return False

    def can_register_for_session(self, session_id):
        """Vérifie si on peut encore s'inscrire pour une session spécifique"""
        try:
            session = self.session_types.get(id=session_id)
            return session.is_active
        except SessionType.DoesNotExist:
            return False

    @property
    def is_upcoming(self):
        """Vérifie si l'événement est à venir"""
        return self.start_date > timezone.now()

    @property
    def is_ongoing(self):
        """Vérifie si l'événement est en cours"""
        now = timezone.now()
        return self.start_date <= now <= self.end_date

    @property
    def is_past(self):
        """Vérifie si l'événement est passé"""
        return self.end_date < timezone.now()

    @property
    def is_virtual(self):
        """Vérifie si l'événement est virtuel"""
        return self.event_type == 'virtual'

    @property
    def is_physical(self):
        """Vérifie si l'événement est physique"""
        return self.event_type == 'physical'

    def is_registration_open(self):
        """Vérifie si les inscriptions sont encore ouvertes"""
        from django.utils import timezone
        now = timezone.now()
        
        # Blocage 30 minutes avant la fin de l'événement
        cutoff_time = self.end_date - timezone.timedelta(minutes=30)
        return now < cutoff_time
    
    def is_streaming_accessible(self):
        """Vérifie si le streaming est encore accessible"""
        from django.utils import timezone
        now = timezone.now()
        
        # Le streaming est accessible jusqu'à la fin de l'événement
        return now <= self.end_date
    
    def get_registration_status(self):
        """Retourne le statut des inscriptions"""
        if self.is_registration_open():
            return "open"
        elif self.is_streaming_accessible():
            return "closed_but_streaming"
        else:
            return "closed"
    
    def get_registration_message(self):
        """Retourne un message explicatif sur le statut des inscriptions"""
        status = self.get_registration_status()
        
        if status == "open":
            return "Inscriptions ouvertes"
        elif status == "closed_but_streaming":
            return "Inscriptions fermées (30 min avant la fin) - Streaming accessible"
        else:
            return "Événement terminé - Inscriptions et streaming fermés"


class VirtualEvent(models.Model):
    """Modèle pour les détails spécifiques aux événements virtuels"""
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='virtual_details')
    
    # Plateforme de streaming
    platform = models.CharField(
        max_length=20, 
        choices=Event.VIRTUAL_PLATFORM_CHOICES, 
        default='zoom',
        verbose_name="Plateforme"
    )
    
    # Informations de connexion
    meeting_id = models.CharField(max_length=100, blank=True, verbose_name="ID de réunion")
    meeting_password = models.CharField(max_length=100, blank=True, verbose_name="Mot de passe de réunion")
    meeting_url = models.URLField(blank=True, verbose_name="URL de la réunion")
    
    # Paramètres de la réunion
    auto_record = models.BooleanField(default=False, verbose_name="Enregistrement automatique")
    allow_chat = models.BooleanField(default=True, verbose_name="Autoriser le chat")
    allow_screen_sharing = models.BooleanField(default=True, verbose_name="Autoriser le partage d'écran")
    waiting_room = models.BooleanField(default=True, verbose_name="Salle d'attente")
    
    # Rediffusion
    recording_url = models.URLField(blank=True, verbose_name="URL de la rediffusion")
    recording_available = models.BooleanField(default=False, verbose_name="Rediffusion disponible")
    recording_expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Expiration de la rediffusion")
    
    # Instructions d'accès
    access_instructions = models.TextField(blank=True, verbose_name="Instructions d'accès")
    technical_requirements = models.TextField(blank=True, verbose_name="Exigences techniques")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Détails de l'événement virtuel"
        verbose_name_plural = "Détails des événements virtuels"

    def __str__(self):
        return f"Événement virtuel: {self.event.title}"

    def save(self, *args, **kwargs):
        # 🔍 LOG CRITIQUE: Vérifier si le stream se lance automatiquement lors de la sauvegarde
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 LOG CRITIQUE: VirtualEvent.save() appelé pour event {self.event_id if hasattr(self, 'event_id') else 'N/A'}")
        logger.info(f"🔍 LOG CRITIQUE: Meeting ID: {self.meeting_id}")
        logger.info(f"🔍 LOG CRITIQUE: Meeting URL: {self.meeting_url}")
        logger.info(f"🔍 LOG CRITIQUE: Platform: {self.platform}")
        
        super().save(*args, **kwargs)
        
        # 🔍 LOG CRITIQUE: Après sauvegarde
        logger.info(f"🔍 LOG CRITIQUE: VirtualEvent.save() terminé - Aucun appel à configure_stream ou start_stream effectué")

    def get_access_code(self):
        """Génère un code d'accès unique pour l'événement"""
        if self.meeting_id and self.meeting_password:
            return f"{self.meeting_id}#{self.meeting_password}"
        elif self.meeting_id:
            return self.meeting_id
        else:
            return str(uuid.uuid4().hex[:8]).upper()


class TicketType(models.Model):
    """Types de billets pour un événement (Gratuit, Standard, VIP, etc.)"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types', verbose_name="Événement")
    name = models.CharField(max_length=100, verbose_name="Nom du billet")
    description = models.TextField(blank=True, verbose_name="Description")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="Prix")
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name="Prix remisé")
    discount_percent = models.PositiveIntegerField(null=True, blank=True, verbose_name="Réduction (%)")
    is_discount_active = models.BooleanField(default=False, verbose_name="Réduction active")
    quantity = models.PositiveIntegerField(null=True, blank=True, verbose_name="Quantité disponible")
    is_vip = models.BooleanField(default=False, verbose_name="Billet VIP")
    sale_start = models.DateTimeField(null=True, blank=True, verbose_name="Début de vente")
    sale_end = models.DateTimeField(null=True, blank=True, verbose_name="Fin de vente")
    sold_count = models.PositiveIntegerField(default=0, verbose_name="Billets vendus")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Type de billet"
        verbose_name_plural = "Types de billets"
        unique_together = ['event', 'name']
        ordering = ['price', 'name']

    def __str__(self):
        return f"{self.name} - {self.event.title}"

    @property
    def available_quantity(self):
        """Retourne le nombre de places disponibles (calculé dynamiquement)"""
        if self.quantity is None:
            return None
        
        # 🎯 CORRECTION : Utiliser sold_count au lieu de compter les inscriptions
        # sold_count est mis à jour lors de la confirmation de paiement
        available = max(0, self.quantity - self.sold_count)
        print(f"🔍 DEBUG: {self.name}.available_quantity - Max: {self.quantity}, Vendus: {self.sold_count}, Disponibles: {available}")
        
        return available

    @property
    def is_available(self) -> bool:
        """Vérifie si le billet est encore disponible"""
        if self.quantity is None:
            return True  # Quantité illimitée
        
        return self.available_quantity > 0
    
    @property
    def has_discount(self) -> bool:
        if not self.is_discount_active:
            return False
        if self.discount_price is not None:
            try:
                return self.discount_price < self.price
            except Exception:
                return False
        if self.discount_percent:
            return self.discount_percent > 0
        return False

    @property
    def effective_price(self):
        if not self.has_discount:
            return self.price
        if self.discount_price is not None:
            return self.discount_price
        if self.discount_percent:
            try:
                return (self.price or 0) * (Decimal('1') - (Decimal(self.discount_percent) / Decimal('100')))
            except Exception:
                return self.price
        return self.price

    @property
    def is_full(self):
        """Vérifie si le type de billet est complet (calculé dynamiquement)"""
        if self.quantity is None:
            return False
        
        confirmed_count = self.registrations.filter(
            status__in=['confirmed', 'attended']
        ).count()
        
        return confirmed_count >= self.quantity


class SessionType(models.Model):
    """Types de sessions pour un événement (obligatoire lors du paiement si créé)"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='session_types', verbose_name="Événement")
    name = models.CharField(max_length=100, verbose_name="Nom de la session")
    
    # Statut et visibilité
    is_active = models.BooleanField(default=True, verbose_name="Session active")
    is_mandatory = models.BooleanField(default=True, verbose_name="Choix obligatoire")
    
    # Ordre d'affichage
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Type de session"
        verbose_name_plural = "Types de sessions"
        unique_together = ['event', 'name']
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.event.title} - {self.name}"

    @property
    def is_available(self):
        """Vérifie si la session est disponible pour les inscriptions"""
        return self.is_active

    # 🎯 NOTE: Les méthodes add_participant/remove_participant ont été supprimées
    # car le comptage est maintenant géré dynamiquement via les inscriptions
    # Le champ current_participants est conservé pour compatibilité mais n'est plus utilisé


class EventRegistration(models.Model):
    """Modèle pour les inscriptions aux événements"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('cancelled', 'Annulée'),
        ('attended', 'Présent'),
        ('no_show', 'Absent'),
        ('waitlisted', 'Liste d\'attente'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations', verbose_name="Événement")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='registrations', verbose_name="Utilisateur")
    
    # 🎯 NOUVEAUX CHAMPS POUR LES INVITÉS SANS COMPTE
    guest_full_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nom complet de l'invité")
    guest_email = models.EmailField(blank=True, null=True, verbose_name="Email de l'invité")
    guest_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone de l'invité")
    guest_country = models.CharField(max_length=3, blank=True, null=True, verbose_name="Pays de l'invité")
    is_guest_registration = models.BooleanField(default=False, verbose_name="Inscription d'invité")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Statut")
    ticket_type = models.ForeignKey('TicketType', on_delete=models.SET_NULL, null=True, blank=True, related_name='registrations', verbose_name="Type de billet")
    session_type = models.ForeignKey('SessionType', on_delete=models.SET_NULL, null=True, blank=True, related_name='registrations', verbose_name="Type de session")
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="Prix payé")
    payment_status = models.CharField(max_length=20, default='unpaid', choices=[
        ('unpaid', 'Non payé'),
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('refunded', 'Remboursé')
    ], verbose_name="Statut de paiement")
    payment_provider = models.CharField(max_length=30, blank=True, verbose_name="Fournisseur de paiement")
    payment_reference = models.CharField(max_length=100, blank=True, verbose_name="Référence de paiement")
    qr_token = models.CharField(max_length=64, unique=True, blank=True, null=True)
    qr_code = models.ImageField(upload_to='tickets/qr/', blank=True, null=True, verbose_name="QR Code")
    
    # Code d'accès virtuel
    virtual_access_code = models.CharField(max_length=100, blank=True, null=True, verbose_name="Code d'accès virtuel")
    virtual_access_sent = models.BooleanField(default=False, verbose_name="Code d'accès envoyé")
    
    # Informations supplémentaires
    notes = models.TextField(blank=True, verbose_name="Notes")
    special_requirements = models.TextField(blank=True, verbose_name="Besoins spéciaux")
    
    # Timestamps
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Inscription"
        verbose_name_plural = "Inscriptions"
        # 🎯 NOUVELLE LOGIQUE : Permettre les inscriptions d'invités
        # Un utilisateur connecté ne peut s'inscrire qu'une fois
        # Un invité peut s'inscrire avec un email différent
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'user'],
                name='unique_user_event_registration',
                condition=models.Q(user__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['event', 'guest_email'],
                name='unique_guest_email_event_registration',
                condition=models.Q(guest_email__isnull=False)
            ),
            # 🎯 NOUVEAU : Contrainte unique pour le téléphone
            models.UniqueConstraint(
                fields=['event', 'guest_phone'],
                name='unique_guest_phone_event_registration',
                condition=models.Q(guest_phone__isnull=False)
            )
        ]
        ordering = ['-registered_at']

    def __str__(self):
        if self.user:
            return f"{self.user.username} - {self.event.title}"
        else:
            return f"{self.guest_full_name} (Invité) - {self.event.title}"

    def save(self, *args, **kwargs):
        # 🔍 LOG CRITIQUE: Vérifier si le stream se lance automatiquement lors de la sauvegarde
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 LOG CRITIQUE: EventRegistration.save() appelé pour inscription {self.id if self.id else 'NEW'}")
        logger.info(f"🔍 LOG CRITIQUE: Event {self.event_id if hasattr(self, 'event_id') else 'N/A'} - is_virtual: {getattr(self.event, 'is_virtual', 'N/A') if hasattr(self, 'event') else 'N/A'}")
        
        # 🎯 CORRECTION MAJEURE : Détecter si c'est une nouvelle inscription ou une mise à jour
        is_new = self.pk is None
        old_status = None
        old_ticket_type_id = None
        
        # Vérifier si on doit mettre à jour les compteurs
        update_counters = kwargs.pop('update_counters', True)
        
        if not is_new:
            try:
                old_instance = EventRegistration.objects.get(pk=self.pk)
                old_status = old_instance.status
                old_ticket_type_id = old_instance.ticket_type_id
            except EventRegistration.DoesNotExist:
                is_new = True
        
        if self.status == 'confirmed' and not self.confirmed_at:
            self.confirmed_at = timezone.now()
        elif self.status == 'cancelled' and not self.cancelled_at:
            self.cancelled_at = timezone.now()

        # Ensure a token exists
        if not self.qr_token:
            self.qr_token = uuid.uuid4().hex

        # Générer le code d'accès virtuel si c'est un événement virtuel
        if self.event.is_virtual and not self.virtual_access_code:
            self.virtual_access_code = self._generate_virtual_access_code()

        super().save(*args, **kwargs)
        
        # 🎯 CORRECTION MAJEURE : Mettre à jour les compteurs après sauvegarde
        # Seulement si c'est nécessaire (nouvelle inscription ou changement de statut) ET si update_counters est True
        if update_counters and (is_new or (old_status != self.status)):
            self._update_ticket_counters(is_new, old_status, old_ticket_type_id)

        # Generate QR after we have an ID and token (seulement pour événements physiques)
        if (self.event.is_physical and 
            self.status in ['confirmed', 'attended'] and 
            qrcode is not None and 
            not self.qr_code):
            self._generate_and_store_qr()
            
        # 🔍 LOG CRITIQUE: Après sauvegarde
        logger.info(f"🔍 LOG CRITIQUE: EventRegistration.save() terminé - Aucun appel à configure_stream ou start_stream effectué")

    def _update_ticket_counters(self, is_new, old_status, old_ticket_type_id):
        """Met à jour les compteurs de billets selon le statut et le type de billet"""
        print(f"🔍 DEBUG: ===== _update_ticket_counters DÉBUT =====")
        print(f"🔍 DEBUG: _update_ticket_counters - is_new: {is_new}, old_status: {old_status}, current_status: {self.status}")
        print(f"🔍 DEBUG: _update_ticket_counters - ticket_type: {self.ticket_type}")
        print(f"🔍 DEBUG: _update_ticket_counters - ticket_type_id: {self.ticket_type_id if hasattr(self, 'ticket_type_id') else 'N/A'}")
        print(f"🔍 DEBUG: _update_ticket_counters - event_id: {self.event_id}")
        
        if self.ticket_type:
            print(f"🔍 DEBUG: _update_ticket_counters - ticket_type.name: {self.ticket_type.name}")
            print(f"🔍 DEBUG: _update_ticket_counters - ticket_type.quantity: {self.ticket_type.quantity}")
            print(f"🔍 DEBUG: _update_ticket_counters - ticket_type.sold_count: {self.ticket_type.sold_count}")
            print(f"🔍 DEBUG: _update_ticket_counters - ticket_type.is_available: {self.ticket_type.is_available}")
        else:
            print(f"🔍 DEBUG: _update_ticket_counters - Pas de ticket_type (billet par défaut)")
            print(f"🔍 DEBUG: _update_ticket_counters - event.max_capacity: {self.event.max_capacity}")
            print(f"🔍 DEBUG: _update_ticket_counters - event.current_registrations: {self.event.current_registrations}")
        
        # 🎯 CORRECTION MAJEURE : Gérer la liste d'attente pour les billets par défaut
        if self.status == 'confirmed' and not self.ticket_type:
            # Vérifier si l'événement a encore de la place
            if (self.event.place_type == 'limited' and 
                self.event.max_capacity is not None and 
                self.event.current_registrations >= self.event.max_capacity):
                
                # Événement complet - mettre en liste d'attente si activée
                if self.event.enable_waitlist:
                    print(f"🔍 DEBUG: Événement complet - Mise en liste d'attente")
                    self.status = 'waitlisted'
                    # Sauvegarder le changement de statut
                    self.save(update_fields=['status'])
                    # Ne pas incrémenter les compteurs
                    return
                else:
                    print(f"🔍 DEBUG: Événement complet - Pas de liste d'attente")
                    # L'événement est complet et pas de liste d'attente
                    # Ne pas incrémenter les compteurs
                    return
        
        # Si c'est une nouvelle inscription confirmée
        if is_new and self.status == 'confirmed':
            print(f"🔍 DEBUG: ===== NOUVELLE INSCRIPTION CONFIRMÉE =====")
            print(f"🔍 DEBUG: Registration ID: {self.id}")
            print(f"🔍 DEBUG: Event: {self.event.title}")
            print(f"🔍 DEBUG: User: {self.user if self.user else 'Guest'}")
            print(f"🔍 DEBUG: Guest: {self.guest_full_name if self.guest_full_name else 'N/A'}")
            
            # Incrémenter les compteurs pour les nouvelles inscriptions confirmées
            if self.ticket_type and self.ticket_type.quantity is not None:
                print(f"🔍 DEBUG: ===== INCREMENTATION BILLET PERSONNALISE (NOUVELLE INSCRIPTION) =====")
                print(f"🔍 DEBUG: BILLET PERSONNALISÉ - {self.ticket_type.name}")
                print(f"🔍 DEBUG: AVANT INCREMENTATION - sold_count: {self.ticket_type.sold_count}")
                
                # Billet personnalisé - incrémenter le compteur
                self.ticket_type.sold_count += 1
                self.ticket_type.save(update_fields=['sold_count'])
                
                print(f"🔍 DEBUG: APRÈS INCREMENTATION - sold_count: {self.ticket_type.sold_count}")
                print(f"🔍 DEBUG: ===== FIN INCREMENTATION BILLET PERSONNALISE (NOUVELLE INSCRIPTION) =====")
            else:
                print(f"🔍 DEBUG: ===== INCREMENTATION BILLET PAR DÉFAUT (NOUVELLE INSCRIPTION) =====")
                print(f"🔍 DEBUG: Avant - current_registrations: {self.event.current_registrations}")
                # Billet par défaut - incrémenter le compteur global
                self.event.current_registrations += 1
                self.event.save(update_fields=['current_registrations'])
                print(f"🔍 DEBUG: Après - current_registrations: {self.event.current_registrations}")
                print(f"🔍 DEBUG: ===== FIN INCREMENTATION BILLET PAR DÉFAUT (NOUVELLE INSCRIPTION) =====")
            
            print(f"🔍 DEBUG: ===== FIN NOUVELLE INSCRIPTION CONFIRMÉE =====")
        
        # 🎯 NOUVELLE LOGIQUE : Si c'est une nouvelle inscription en attente, ne pas compter encore
        elif is_new and self.status == 'pending':
            print(f"🔍 DEBUG: NOUVELLE INSCRIPTION EN ATTENTE - Pas de mise à jour des compteurs")
            if self.ticket_type:
                print(f"🔍 DEBUG: Billet personnalisé en attente - {self.ticket_type.name}")
            else:
                print(f"🔍 DEBUG: Billet par défaut en attente")
        
        # Si le statut change de non-confirmé à confirmé
        elif not is_new and old_status != 'confirmed' and self.status == 'confirmed':
            print(f"🔍 DEBUG: ===== STATUT CHANGÉ VERS CONFIRMÉ =====")
            print(f"🔍 DEBUG: Registration ID: {self.id}")
            print(f"🔍 DEBUG: Old Status: {old_status} -> New Status: {self.status}")
            
            if self.ticket_type and self.ticket_type.quantity is not None:
                print(f"🔍 DEBUG: ===== INCREMENTATION BILLET PERSONNALISE (CHANGEMENT STATUT) =====")
                print(f"🔍 DEBUG: BILLET PERSONNALISÉ - {self.ticket_type.name}")
                print(f"🔍 DEBUG: AVANT INCREMENTATION - sold_count: {self.ticket_type.sold_count}")
                print(f"🔍 DEBUG: Ticket Type ID: {self.ticket_type.id}")
                
                # Billet personnalisé - incrémenter le compteur
                self.ticket_type.sold_count += 1
                self.ticket_type.save(update_fields=['sold_count'])
                
                print(f"🔍 DEBUG: APRÈS INCREMENTATION - sold_count: {self.ticket_type.sold_count}")
                print(f"🔍 DEBUG: ===== FIN INCREMENTATION BILLET PERSONNALISE (CHANGEMENT STATUT) =====")
                print(f"🔍 DEBUG: Statut changé vers confirmé - {self.ticket_type.name}: {self.ticket_type.sold_count}/{self.ticket_type.quantity}")
            else:
                print(f"🔍 DEBUG: BILLET PAR DÉFAUT")
                print(f"🔍 DEBUG: Avant - current_registrations: {self.event.current_registrations}")
                # Billet par défaut - incrémenter le compteur global
                self.event.current_registrations += 1
                self.event.save(update_fields=['current_registrations'])
                print(f"🔍 DEBUG: Après - current_registrations: {self.event.current_registrations}")
                print(f"🔍 DEBUG: Statut changé vers confirmé (par défaut) - {self.event.current_registrations}/{self.event.max_capacity}")
        
        # Si le statut change de confirmé à non-confirmé (annulation)
        # MAIS PAS si c'est juste un changement vers 'attended' (confirmation de présence)
        elif not is_new and old_status == 'confirmed' and self.status not in ['confirmed', 'attended']:
            print(f"🔍 DEBUG: INSCRIPTION ANNULÉE")
            if old_ticket_type_id:
                try:
                    old_ticket_type = TicketType.objects.get(id=old_ticket_type_id)
                    print(f"🔍 DEBUG: BILLET PERSONNALISÉ ANCIEN - {old_ticket_type.name}")
                    print(f"🔍 DEBUG: Avant - sold_count: {old_ticket_type.sold_count}")
                    old_ticket_type.sold_count = max(0, old_ticket_type.sold_count - 1)
                    old_ticket_type.save(update_fields=['sold_count'])
                    print(f"🔍 DEBUG: Après - sold_count: {old_ticket_type.sold_count}")
                    print(f"🔍 DEBUG: Inscription annulée - {old_ticket_type.name}: {old_ticket_type.sold_count}/{old_ticket_type.quantity}")
                except TicketType.DoesNotExist:
                    print(f"🔍 DEBUG: Ancien type de billet non trouvé: {old_ticket_type_id}")
                    pass
            else:
                print(f"🔍 DEBUG: BILLET PAR DÉFAUT ANCIEN")
                print(f"🔍 DEBUG: Avant - current_registrations: {self.event.current_registrations}")
                # Billet par défaut - décrémenter le compteur global
                self.event.current_registrations = max(0, self.event.current_registrations - 1)
                self.event.save(update_fields=['current_registrations'])
                print(f"🔍 DEBUG: Après - current_registrations: {self.event.current_registrations}")
                print(f"🔍 DEBUG: Inscription par défaut annulée - {self.event.current_registrations}/{self.event.max_capacity}")
        else:
            print(f"🔍 DEBUG: AUCUNE MISE À JOUR NÉCESSAIRE")
            print(f"🔍 DEBUG: is_new: {is_new}, old_status: {old_status}, current_status: {self.status}")
        
        print(f"🔍 DEBUG: ===== _update_ticket_counters FIN =====")

    def _generate_virtual_access_code(self):
        """Génère un code d'accès unique pour les événements virtuels"""
        if hasattr(self.event, 'virtual_details'):
            return self.event.virtual_details.get_access_code()
        return str(uuid.uuid4().hex[:8]).upper()

    def _generate_and_store_qr(self):
        """Generate and store a QR code image for the registration."""
        qr_payload = {
            'event_id': self.event_id,
            'registration_id': self.id,
            'user_id': self.user_id,
            'token': self.qr_token,
        }
        data = f"EMSv1|{qr_payload['event_id']}|{qr_payload['registration_id']}|{qr_payload['user_id']}|{qr_payload['token']}"

        qr_img = qrcode.make(data)
        buffer = io.BytesIO()
        qr_img.save(buffer, format='PNG')
        buffer.seek(0)

        from django.core.files.base import ContentFile
        filename = f"qr_{self.qr_token}.png"
        self.qr_code.save(filename, ContentFile(buffer.read()), save=False)
        super().save(update_fields=['qr_code'])


class VirtualEventInteraction(models.Model):
    """Modèle pour les interactions sur les événements virtuels (likes, commentaires, partages)"""
    INTERACTION_TYPE_CHOICES = [
        ('like', 'J\'aime'),
        ('comment', 'Commentaire'),
        ('share', 'Partage'),
        ('rating', 'Évaluation'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='interactions', verbose_name="Événement")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_interactions', verbose_name="Utilisateur")
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES, verbose_name="Type d'interaction")
    
    # Contenu de l'interaction
    content = models.TextField(blank=True, verbose_name="Contenu")
    rating = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Note")
    
    # Métadonnées
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, verbose_name="User Agent")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Interaction événement virtuel"
        verbose_name_plural = "Interactions événements virtuels"
        unique_together = ['event', 'user', 'interaction_type']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.interaction_type} - {self.event.title}"


class EventHistory(models.Model):
    """Modèle pour l'historique des changements d'événements"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='history', verbose_name="Événement")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Utilisateur")
    action = models.CharField(max_length=100, verbose_name="Action")
    field_name = models.CharField(max_length=100, blank=True, verbose_name="Champ modifié")
    old_value = models.TextField(blank=True, verbose_name="Ancienne valeur")
    new_value = models.TextField(blank=True, verbose_name="Nouvelle valeur")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historique"
        verbose_name_plural = "Historiques"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event.title} - {self.action} - {self.timestamp}" 


class RefundPolicy(models.Model):
    """Politique de remboursement pour un événement"""
    REFUND_MODE_CHOICES = [
        ('disabled', 'Remboursements désactivés'),
        ('manual', 'Remboursement manuel uniquement'),
        ('auto', 'Remboursement automatique'),
        ('mixed', 'Manuel puis automatique après délai'),
    ]
    
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='refund_policy')
    mode = models.CharField(max_length=20, choices=REFUND_MODE_CHOICES, default='manual')
    
    # Délais en heures
    auto_refund_delay_hours = models.PositiveIntegerField(
        default=24, 
        help_text="Délai en heures avant remboursement automatique (si mode auto/mixed)"
    )
    
    # Pourcentages de remboursement selon le timing
    refund_percentage_immediate = models.PositiveIntegerField(
        default=100, validators=[MaxValueValidator(100)],
        help_text="% remboursé si annulation immédiate"
    )
    refund_percentage_after_delay = models.PositiveIntegerField(
        default=80, validators=[MaxValueValidator(100)],
        help_text="% remboursé après le délai"
    )
    
    # Limite temporelle (heures avant l'événement)
    cutoff_hours_before_event = models.PositiveIntegerField(
        default=24,
        help_text="Nombre d'heures avant l'événement où les remboursements cessent"
    )
    
    # Paramètres
    allow_partial_refunds = models.BooleanField(
        default=True,
        help_text="Autoriser les remboursements partiels"
    )
    require_reason = models.BooleanField(
        default=False,
        help_text="Exiger une raison pour l'annulation"
    )
    
    # Notifications
    notify_organizer_on_cancellation = models.BooleanField(
        default=True,
        help_text="Notifier l'organisateur lors d'une annulation"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Politique remboursement - {self.event.title} ({self.mode})"
    
    def can_refund_now(self):
        """Vérifie si l'événement accepte encore les remboursements"""
        if self.mode == 'disabled':
            return False
        
        from django.utils import timezone
        hours_before = (self.event.start_date - timezone.now()).total_seconds() / 3600
        return hours_before >= self.cutoff_hours_before_event
    
    def get_refund_percentage(self, hours_since_cancellation=0):
        """Calcule le pourcentage de remboursement selon le délai"""
        if hours_since_cancellation < self.auto_refund_delay_hours:
            return self.refund_percentage_immediate
        return self.refund_percentage_after_delay


class RefundRequest(models.Model):
    """Demande de remboursement"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('processed', 'Traité'),
        ('rejected', 'Rejeté'),
        ('expired', 'Expiré'),
    ]
    
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='refund_request')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True, help_text="Raison de l'annulation")
    
    # Montants
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, help_text="Montant initialement payé")
    refund_percentage = models.PositiveIntegerField(validators=[MaxValueValidator(100)])
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Montant à rembourser")
    
    # Traitement
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    stripe_refund_id = models.CharField(max_length=100, blank=True, help_text="ID du remboursement Stripe")
    
    # Échéances
    auto_process_at = models.DateTimeField(null=True, blank=True, help_text="Date de traitement automatique")
    expires_at = models.DateTimeField(help_text="Date limite pour le remboursement")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Remboursement {self.registration.user.username} - {self.registration.event.title} ({self.status})"
    
    def can_auto_process(self):
        """Vérifie si la demande peut être traitée automatiquement"""
        from django.utils import timezone
        return (
            self.status == 'pending' and
            self.auto_process_at and
            timezone.now() >= self.auto_process_at
        )


class NotificationLog(models.Model):
    """Trace des notifications envoyées pour éviter les doublons."""
    TYPE_CHOICES = [
        ('reminder_1d', 'Rappel J-1'),
        ('reminder_1h', 'Rappel 1h avant'),
        ('reminder_day', 'Rappel jour J'),
        ('update', 'Mise à jour'),
        ('thank_you', 'Remerciement'),
        ('virtual_access', 'Code d\'accès virtuel'),
        ('virtual_reminder', 'Rappel événement virtuel'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='notifications')
    registration = models.ForeignKey(EventRegistration, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['event', 'type']),
            models.Index(fields=['registration', 'type']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self) -> str:
        return f"{self.event_id} - {self.type} - {self.created_at:%Y-%m-%d %H:%M}"



class SocialAccount(models.Model):
    """Modèle pour gérer l'authentification via réseaux sociaux"""
    PROVIDER_CHOICES = [
        ('google', 'Google'),
        ('facebook', 'Facebook'),
        ('github', 'GitHub'),
        ('twitter', 'Twitter'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_accounts')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    provider_account_id = models.CharField(max_length=255, unique=True)  # ID unique du compte social
    email = models.EmailField()
    name = models.CharField(max_length=255, blank=True)
    picture_url = models.URLField(blank=True)
    access_token = models.TextField(blank=True)  # Token d'accès (chiffré)
    refresh_token = models.TextField(blank=True)  # Token de rafraîchissement (chiffré)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['provider', 'provider_account_id']
        verbose_name = "Compte social"
        verbose_name_plural = "Comptes sociaux"
    
    def __str__(self):
        return f"{self.user.username} - {self.provider}"
    
    @property
    def is_expired(self):
        """Vérifie si le token d'accès a expiré"""
        if not self.expires_at:
            return True
        return timezone.now() > self.expires_at
    
    def refresh_access_token(self):
        """Rafraîchit le token d'accès (à implémenter selon le provider)"""
        # Cette méthode sera implémentée selon le provider
        pass


class CustomReminder(models.Model):
    """Modèle pour les rappels personnalisés des organisateurs"""
    REMINDER_TYPE_CHOICES = [
        ('general', 'Rappel général'),
        ('reminder', 'Rappel d\'événement'),
        ('update', 'Mise à jour'),
        ('cancellation', 'Annulation'),
        ('postponement', 'Report'),
        ('custom', 'Message personnalisé'),
    ]
    
    TARGET_CHOICES = [
        ('all', 'Tous les participants'),
        ('confirmed', 'Participants confirmés uniquement'),
        ('waitlisted', 'Liste d\'attente uniquement'),
        ('attended', 'Participants présents uniquement'),
        ('custom', 'Sélection personnalisée'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='custom_reminders', verbose_name="Événement")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reminders', verbose_name="Créé par")
    
    # Contenu du rappel
    title = models.CharField(max_length=200, verbose_name="Titre du rappel")
    message = models.TextField(verbose_name="Message")
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPE_CHOICES, default='general', verbose_name="Type de rappel")
    
    # Ciblage
    target_audience = models.CharField(max_length=20, choices=TARGET_CHOICES, default='all', verbose_name="Audience cible")
    custom_recipients = models.ManyToManyField('EventRegistration', blank=True, related_name='custom_reminders', verbose_name="Destinataires personnalisés")
    
    # Envoi
    send_email = models.BooleanField(default=True, verbose_name="Envoyer par email")
    send_sms = models.BooleanField(default=True, verbose_name="Envoyer par SMS")
    
    # Statut
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Brouillon'),
        ('scheduled', 'Programmé'),
        ('sent', 'Envoyé'),
        ('failed', 'Échec'),
    ], default='draft', verbose_name="Statut")
    
    # Programmation
    scheduled_at = models.DateTimeField(null=True, blank=True, verbose_name="Date d'envoi programmée")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Date d'envoi")
    
    # Statistiques
    total_recipients = models.PositiveIntegerField(default=0, verbose_name="Total destinataires")
    emails_sent = models.PositiveIntegerField(default=0, verbose_name="Emails envoyés")
    sms_sent = models.PositiveIntegerField(default=0, verbose_name="SMS envoyés")
    emails_failed = models.PositiveIntegerField(default=0, verbose_name="Emails échoués")
    sms_failed = models.PositiveIntegerField(default=0, verbose_name="SMS échoués")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Rappel personnalisé"
        verbose_name_plural = "Rappels personnalisés"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.event.title}"
    
    def get_recipients(self):
        """Retourne la liste des destinataires selon le ciblage"""
        if self.target_audience == 'all':
            return self.event.registrations.filter(status__in=['confirmed', 'waitlisted', 'attended'])
        elif self.target_audience == 'confirmed':
            return self.event.registrations.filter(status='confirmed')
        elif self.target_audience == 'waitlisted':
            return self.event.registrations.filter(status='waitlisted')
        elif self.target_audience == 'attended':
            return self.event.registrations.filter(status='attended')
        elif self.target_audience == 'custom':
            return self.custom_recipients.all()
        else:
            return self.event.registrations.none()
    
    def can_send(self):
        """Vérifie si le rappel peut être envoyé"""
        return self.status in ['draft', 'scheduled'] and self.get_recipients().exists()
    
    def mark_as_sent(self):
        """Marque le rappel comme envoyé"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save()
    
    def save(self, *args, **kwargs):
        """Override save pour gérer automatiquement le statut"""
        # 🎯 CORRECTION: Ne pas forcer le statut si c'est un nouveau rappel
        # Le statut est géré par le serializer selon le send_mode
        if self.pk is None:
            # Nouveau rappel - laisser le serializer gérer le statut
            print(f"🔍 DEBUG: Nouveau rappel - statut géré par le serializer: {self.status}")
        else:
            # Rappel existant - gérer la logique automatique seulement si nécessaire
            if self.scheduled_at and self.status == 'draft':
                from django.utils import timezone
                if self.scheduled_at > timezone.now():
                    # Si l'heure est dans le futur, passer automatiquement en statut 'scheduled'
                    self.status = 'scheduled'
                    print(f"🔍 DEBUG: Statut automatiquement changé de 'draft' à 'scheduled' pour le rappel {self.id}")
        
        super().save(*args, **kwargs)


class CustomReminderRecipient(models.Model):
    """Modèle pour les destinataires personnalisés des rappels"""
    reminder = models.ForeignKey(CustomReminder, on_delete=models.CASCADE, related_name='recipient_entries', verbose_name="Rappel")
    registration = models.ForeignKey(EventRegistration, on_delete=models.CASCADE, related_name='custom_reminder_recipients', verbose_name="Inscription")
    
    class Meta:
        verbose_name = "Destinataire personnalisé"
        verbose_name_plural = "Destinataires personnalisés"
        unique_together = ['reminder', 'registration']
    
    def __str__(self):
        if self.registration.user:
            return f"{self.registration.user.username} - {self.reminder.title}"
        else:
            return f"{self.registration.guest_full_name} - {self.reminder.title}"