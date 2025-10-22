from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from .models import Event, Category, Tag, EventRegistration, EventHistory, TicketType, SessionType, VirtualEvent, VirtualEventInteraction, CustomReminder, CustomReminderRecipient


class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les utilisateurs"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'color', 'icon', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TagSerializer(serializers.ModelSerializer):
    """Serializer pour les tags"""
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VirtualEventSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les détails des événements virtuels"""
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = VirtualEvent
        fields = [
            'id', 'platform', 'platform_display', 'meeting_id', 'meeting_password',
            'meeting_url', 'auto_record', 'allow_chat', 'allow_screen_sharing',
            'waiting_room', 'recording_url', 'recording_available',
            'recording_expires_at', 'access_instructions', 'technical_requirements',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VirtualEventInteractionSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les interactions sur les événements virtuels"""
    user = UserSerializer(read_only=True)
    interaction_type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    
    class Meta:
        model = VirtualEventInteraction
        fields = [
            'id', 'event', 'user', 'interaction_type', 'interaction_type_display',
            'content', 'rating', 'ip_address', 'user_agent', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'ip_address', 'user_agent', 'created_at', 'updated_at']


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les inscriptions aux événements"""
    user = UserSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    session_type_name = serializers.CharField(source='session_type.name', read_only=True)
    is_virtual_event = serializers.SerializerMethodField()
    virtual_access_code = serializers.CharField(read_only=True)
    
    # 🎯 NOUVEAUX CHAMPS POUR LES INVITÉS
    guest_display_name = serializers.SerializerMethodField()
    guest_display_email = serializers.SerializerMethodField()
    guest_display_phone = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['id', 'registered_at', 'updated_at', 'confirmed_at', 'cancelled_at', 'virtual_access_code']
    
    def get_guest_display_name(self, obj):
        """Retourne le nom à afficher (utilisateur ou invité)"""
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return obj.guest_full_name or "Invité"
    
    def get_guest_display_email(self, obj):
        """Retourne l'email à afficher (utilisateur ou invité)"""
        if obj.user:
            return obj.user.email
        return obj.guest_email or ""
    
    def get_guest_display_phone(self, obj):
        """Retourne le téléphone à afficher (utilisateur ou invité)"""
        if obj.user:
            return getattr(obj.user.profile, 'phone', '') if hasattr(obj.user, 'profile') else ''
        return obj.guest_phone or ""

    def get_is_virtual_event(self, obj):
        return obj.event.is_virtual


class EventHistorySerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des événements"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = EventHistory
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class EventSerializer(serializers.ModelSerializer):
    """Sérialiseur principal pour les événements"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    organizer = UserSerializer(read_only=True)
    registrations = EventRegistrationSerializer(many=True, read_only=True)
    ticket_types = serializers.SerializerMethodField()
    history = EventHistorySerializer(many=True, read_only=True)
    virtual_details = VirtualEventSerializer(read_only=True)
    
    # Propriétés calculées
    is_full = serializers.BooleanField(read_only=True)
    available_places = serializers.IntegerField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_virtual = serializers.BooleanField(read_only=True)
    is_physical = serializers.BooleanField(read_only=True)
    
    # 🎯 NOUVELLES PROPRIÉTÉS DE DISPONIBILITÉ SÉPARÉE
    default_ticket_available_places = serializers.IntegerField(read_only=True)
    default_ticket_is_full = serializers.BooleanField(read_only=True)
    ticket_type_availability = serializers.SerializerMethodField()
    session_availability = serializers.SerializerMethodField()
    
    # 🎯 NOUVELLES PROPRIÉTÉS DE PRIX POUR LES TYPES DE BILLETS
    min_ticket_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    max_ticket_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_range_display = serializers.CharField(read_only=True)
    
    # Statistiques
    registration_count = serializers.SerializerMethodField()
    confirmed_registration_count = serializers.SerializerMethodField()
    interaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = [
            'id', 'slug', 'created_at', 'updated_at', 'published_at',
            'current_registrations', 'organizer'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_confirmed_registration_count(self, obj):
        return obj.registrations.filter(status='confirmed').count()

    def get_interaction_count(self, obj):
        """Retourner des statistiques détaillées par type d'interaction"""
        interactions = obj.interactions.all()
        
        # Compter par type
        likes = interactions.filter(interaction_type='like').count()
        comments = interactions.filter(interaction_type='comment').count()
        shares = interactions.filter(interaction_type='share').count()
        ratings = interactions.filter(interaction_type='rating').count()
        
        # Calculer la note moyenne
        rating_interactions = interactions.filter(interaction_type='rating')
        avg_rating = 0
        if rating_interactions.exists():
            total_rating = sum(interaction.rating for interaction in rating_interactions if interaction.rating)
            avg_rating = round(total_rating / rating_interactions.count(), 1)
        
        return {
            'likes': likes,
            'comments': comments,
            'shares': shares,
            'ratings': ratings,
            'total': interactions.count(),
            'average_rating': avg_rating
        }

    def get_ticket_types(self, obj):
        return TicketTypeListSerializer(obj.ticket_types.all(), many=True).data

    def get_ticket_type_availability(self, obj):
        """Retourne la disponibilité de chaque type de billet"""
        return obj.get_ticket_type_availability()

    def get_session_availability(self, obj):
        """Retourne la disponibilité de chaque session"""
        return obj.get_session_availability()

    def create(self, validated_data, **kwargs):
        print(f"DEBUG: EventSerializer.create - Données validées: {validated_data}")
        print(f"DEBUG: EventSerializer.create - Clés disponibles: {list(validated_data.keys())}")
        print(f"DEBUG: EventSerializer.create - Kwargs reçus: {kwargs}")
        
        # Récupérer l'organizer depuis kwargs (passé par perform_create)
        organizer = kwargs.get('organizer')
        if organizer:
            validated_data['organizer'] = organizer
            print(f"DEBUG: EventSerializer.create - Organizer défini: {organizer}")
        else:
            print(f"DEBUG: EventSerializer.create - Aucun organizer reçu dans kwargs")
        
        # Gérer les tags
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Créer l'événement
        event = Event.objects.create(**validated_data)
        
        # Ajouter les tags
        if tag_ids:
            event.tags.set(tag_ids)
        
        return event

    def update(self, instance, validated_data):
        # Gérer les tags
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Mettre à jour l'événement
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les tags si fournis
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance

    def validate_website(self, value):
        """Validation et correction automatique de l'URL du site web"""
        if not value:
            return value
        
        # Si l'URL ne commence pas par http:// ou https://, ajouter https://
        if not value.startswith(('http://', 'https://')):
            value = 'https://' + value
        
        return value

    def validate(self, data):
        """Validation personnalisée"""
        print(f"DEBUG: EventSerializer.validate - Données reçues: {data}")
        print(f"DEBUG: EventSerializer.validate - Clés disponibles: {list(data.keys())}")
        
        # Validation de l'image
        if 'poster' in data:
            poster = data['poster']
            print(f"DEBUG: EventSerializer.validate - Image reçue: {poster}")
            print(f"DEBUG: EventSerializer.validate - Type d'image: {type(poster)}")
            if hasattr(poster, 'content_type'):
                print(f"DEBUG: EventSerializer.validate - Content-Type: {poster.content_type}")
            if hasattr(poster, 'size'):
                print(f"DEBUG: EventSerializer.validate - Taille: {poster.size}")
        
        # Vérifier que la date de fin est après la date de début
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError(
                    "La date de fin doit être postérieure à la date de début."
                )
        
        # Vérifier la cohérence des places
        if 'place_type' in data and 'max_capacity' in data:
            if data['place_type'] == 'limited' and not data['max_capacity']:
                raise serializers.ValidationError(
                    "La capacité maximale est requise pour les événements avec places limitées."
                )
            elif data['place_type'] == 'unlimited' and data['max_capacity']:
                raise serializers.ValidationError(
                    "La capacité maximale ne doit pas être définie pour les événements avec places illimitées."
                )
        
        # Vérifier la cohérence du prix
        if 'is_free' in data and 'price' in data:
            if data['is_free'] and data['price'] > 0:
                raise serializers.ValidationError(
                    "Le prix doit être 0 pour un événement gratuit."
                )
            elif not data['is_free'] and data['price'] <= 0:
                raise serializers.ValidationError(
                    "Le prix doit être supérieur à 0 pour un événement payant."
                )
        
        return data


class TicketTypeListSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour la liste des types de billets"""
    available_quantity = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    has_discount = serializers.BooleanField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = TicketType
        fields = ['id', 'name', 'description', 'price', 'discount_price', 'discount_percent', 
                 'is_discount_active', 'quantity', 'is_vip', 'sale_start', 'sale_end', 
                 'sold_count', 'available_quantity', 'is_available', 'has_discount', 'effective_price']


class TicketTypeSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour les types de billets"""
    event_title = serializers.CharField(source='event.title', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    has_discount = serializers.BooleanField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = TicketType
        fields = '__all__'
        read_only_fields = ['id', 'sold_count', 'created_at']


class SessionTypeSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les types de sessions"""
    event_title = serializers.CharField(source='event.title', read_only=True)
    is_available_for_registration = serializers.SerializerMethodField()

    def get_is_available_for_registration(self, obj):
        """Vérifie si la session est disponible pour les inscriptions"""
        return obj.is_active

    class Meta:
        model = SessionType
        fields = '__all__'
        read_only_fields = ['id', 'current_participants', 'created_at', 'updated_at']

    def validate(self, data):
        """Validation personnalisée pour les sessions"""
        # Vérifier que la date de fin est après la date de début
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError(
                    "L'heure de fin doit être postérieure à l'heure de début."
                )
        
        # Vérifier que la date de session est dans le futur
        if 'date' in data:
            from django.utils import timezone
            today = timezone.now().date()
            if data['date'] < today:
                raise serializers.ValidationError(
                    "La date de session ne peut pas être dans le passé."
                )
        
        return data


class EventRegistrationCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer une inscription à un événement"""
    session_type_id = serializers.IntegerField(write_only=True, required=False)
    
    # 🎯 NOUVEAUX CHAMPS POUR LES INVITÉS
    guest_full_name = serializers.CharField(max_length=200, required=False, write_only=True)
    guest_email = serializers.EmailField(required=False, write_only=True)
    guest_phone = serializers.CharField(max_length=20, required=False, write_only=True)
    guest_country = serializers.CharField(max_length=3, required=False, write_only=True)
    
    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'ticket_type', 'session_type', 'session_type_id', 'notes', 'special_requirements', 'status', 'payment_status', 'price_paid', 'guest_full_name', 'guest_email', 'guest_phone', 'guest_country']
        read_only_fields = ['id', 'user', 'status', 'registered_at', 'updated_at', 'payment_status']

    def validate(self, data):
        # 🎯 NOUVEAU : Logs de débogage détaillés
        
        # 🎯 NOUVELLE VALIDATION : Vérifier la disponibilité du type de billet
        ticket_type = data.get('ticket_type')
        if ticket_type and ticket_type.quantity is not None:
            if not ticket_type.is_available:
                raise serializers.ValidationError({
                    'ticket_type': f"Le type de billet '{ticket_type.name}' n'est plus disponible (quantité épuisée)."
                })
            print(f"🔍 DEBUG: Ticket type {ticket_type.name} is available: {ticket_type.available_quantity} places left")
        print(f"🔍 DEBUG: validate() appelé avec data: {data}")
        print(f"🔍 DEBUG: Clés dans data: {list(data.keys())}")
        print(f"🔍 DEBUG: guest_full_name: {data.get('guest_full_name')}")
        print(f"🔍 DEBUG: guest_email: {data.get('guest_email')}")
        print(f"🔍 DEBUG: guest_phone: {data.get('guest_phone')}")
        print(f"🔍 DEBUG: guest_country: {data.get('guest_country')}")
        
        event = data['event']
        request = self.context['request']
        user = getattr(request, 'user', None)
        
        # 🎯 NOUVELLE LOGIQUE : Gérer les utilisateurs connectés ET les invités
        guest_full_name = data.get('guest_full_name')
        guest_email = data.get('guest_email')
        guest_phone = data.get('guest_phone')
        guest_country = data.get('guest_country')
        
        # Déterminer si c'est une inscription d'invité
        is_guest = bool(guest_full_name and guest_email and guest_phone and guest_country)
        
        # 🎯 CORRECTION MAJEURE : Récupérer le ticket_type_id depuis les données de la requête
        request = self.context['request']
        ticket_type_id = request.data.get('ticket_type_id')
        ticket_type = None
        if ticket_type_id:
            try:
                ticket_type = TicketType.objects.get(id=ticket_type_id, event=event)
                print(f"🔍 DEBUG: Ticket type found: {ticket_type.name}")
            except TicketType.DoesNotExist:
                print(f"🔍 DEBUG: Ticket type not found: {ticket_type_id}")
                raise serializers.ValidationError("Type de billet invalide.")
        
        if is_guest:
            # 🎯 VALIDATION POUR LES INVITÉS
            print(f"🔍 DEBUG: Guest registration - Name: {guest_full_name}, Email: {guest_email}")
            
            # 🎯 CORRECTION CRITIQUE : Vérifier TOUTES les inscriptions avec cet email (utilisateurs ET invités)
            existing_registration = EventRegistration.objects.filter(
                event=event
            ).filter(
                models.Q(guest_email=guest_email) |  # Invités avec cet email
                models.Q(user__email=guest_email)    # Utilisateurs connectés avec cet email
            ).first()
            
            print(f"🔍 DEBUG: Existing registration search - Email: {guest_email}, Found: {existing_registration is not None}")
            if existing_registration:
                print(f"🔍 DEBUG: Existing registration details - ID: {existing_registration.id}, Status: {existing_registration.status}, Type: {'Guest' if existing_registration.is_guest_registration else 'User'}, Email: {existing_registration.guest_email or existing_registration.user.email if existing_registration.user else 'N/A'}")
            
            if existing_registration:
                if existing_registration.status == 'confirmed':
                    print(f"🔍 DEBUG: BLOCKING - Email already used for confirmed registration")
                    raise serializers.ValidationError("Cet email est déjà utilisé pour une inscription confirmée à cet événement.")
                elif existing_registration.status in ['pending', 'waitlisted']:
                    print(f"🔍 DEBUG: BLOCKING - Email already used for pending/waitlisted registration")
                    raise serializers.ValidationError("Cet email est déjà utilisé pour une inscription en cours à cet événement.")
            
            # 🎯 NOUVEAU : Validation du téléphone unique
            if guest_phone:
                existing_phone_registration = EventRegistration.objects.filter(
                    event=event,
                    guest_phone=guest_phone
                ).first()
                
                if existing_phone_registration:
                    if existing_phone_registration.status == 'confirmed':
                        raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé pour une inscription confirmée à cet événement.")
                    elif existing_phone_registration.status in ['pending', 'waitlisted']:
                        print(f"🔍 DEBUG: BLOCKING - Phone already used for pending/waitlisted registration")
                        raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé pour une inscription en cours à cet événement.")
                
                # 🎯 NOUVEAU : Validation de cohérence pays/numéro COMPLÈTE
                import re
                cleaned_phone = re.sub(r'\D', '', guest_phone)
                print(f"🔍 DEBUG: Validation - Phone: {guest_phone}, Cleaned: {cleaned_phone}, Country: {guest_country}")
                
                # Numéros canadiens (514, 438, 450, 579, 581, 819, 873)
                if cleaned_phone.startswith(('514', '438', '450', '579', '581', '819', '873')):
                    if guest_country != 'CA':
                        print(f"🔍 DEBUG: BLOCKING - Numéro canadien ({cleaned_phone[:3]}) avec pays {guest_country}")
                        raise serializers.ValidationError(f"Le numéro de téléphone commence par {cleaned_phone[:3]} (Canada) mais le pays sélectionné est {guest_country}. Veuillez sélectionner le Canada ou utiliser un numéro correspondant au pays sélectionné.")
                
                # Numéros français (06, 07)
                elif cleaned_phone.startswith(('06', '07')):
                    if guest_country != 'FR':
                        print(f"🔍 DEBUG: BLOCKING - Numéro français mobile ({cleaned_phone[:2]}) avec pays {guest_country}")
                        raise serializers.ValidationError(f"Le numéro de téléphone commence par {cleaned_phone[:2]} (France) mais le pays sélectionné est {guest_country}. Veuillez sélectionner la France ou utiliser un numéro correspondant au pays sélectionné.")
                
                # Numéros togolais (90, 91, 92, 93, 96, 97, 98, 99)
                elif cleaned_phone.startswith(('90', '91', '92', '93', '96', '97', '98', '99')):
                    if guest_country != 'TG':
                        print(f"🔍 DEBUG: BLOCKING - Numéro togolais ({cleaned_phone[:2]}) avec pays {guest_country}")
                        raise serializers.ValidationError(f"Le numéro de téléphone commence par {cleaned_phone[:2]} (Togo) mais le pays sélectionné est {guest_country}. Veuillez sélectionner le Togo ou utiliser un numéro correspondant au pays sélectionné.")
                
                print(f"🔍 DEBUG: Validation ACCEPTED - Numéro {cleaned_phone} avec pays {guest_country}")
        else:
            # 🎯 VALIDATION POUR LES UTILISATEURS CONNECTÉS
            if not user or not user.is_authenticated:
                raise serializers.ValidationError("Vous devez être connecté ou fournir les informations d'invité.")
            
            print(f"🔍 DEBUG: User registration - User: {user.username}")
            
            # Vérifier si l'utilisateur a déjà une inscription confirmée
            existing_confirmed = EventRegistration.objects.filter(
                event=event, 
                user=user, 
                status='confirmed'
            ).exists()
            
            print(f"🔍 DEBUG: Existing confirmed: {existing_confirmed}")
            
            if existing_confirmed:
                raise serializers.ValidationError("Vous êtes déjà inscrit à cet événement.")
            
            # Permettre les inscriptions en attente de paiement
            existing_pending = EventRegistration.objects.filter(
                event=event, 
                user=user, 
                status='pending',
                payment_status='pending'
            ).exists()
            
            print(f"🔍 DEBUG: Existing pending: {existing_pending}")
            
            if existing_pending:
                raise serializers.ValidationError("Vous avez déjà une inscription en attente de paiement pour cet événement.")
        
        # 🎯 CORRECTION MAJEURE : Récupérer le ticket_type_id depuis les données de la requête
        request = self.context['request']
        ticket_type_id = request.data.get('ticket_type_id')
        ticket_type = None
        if ticket_type_id:
            try:
                ticket_type = TicketType.objects.get(id=ticket_type_id, event=event)
                print(f"🔍 DEBUG: Ticket type found: {ticket_type.name}")
            except TicketType.DoesNotExist:
                print(f"🔍 DEBUG: Ticket type not found: {ticket_type_id}")
                raise serializers.ValidationError("Type de billet invalide.")
        
        # 🎯 CORRECTION MAJEURE : Séparer la logique des billets par défaut et des types de billets
        
        if ticket_type and ticket_type.event != event:
            raise serializers.ValidationError("Le type de billet ne correspond pas à l'événement.")
        
        # 🎯 NOUVELLE LOGIQUE : Si un type de billet est sélectionné, vérifier SEULEMENT sa capacité
        if ticket_type and ticket_type.quantity is not None:
            # 🎯 CORRECTION MAJEURE : Utiliser sold_count au lieu de compter les inscriptions
            confirmed_ticket_count = ticket_type.sold_count
            
            print(f"🔍 DEBUG: ===== VALIDATION BILLET PERSONNALISÉ =====")
            print(f"🔍 DEBUG: Custom ticket validation - {ticket_type.name}: {confirmed_ticket_count}/{ticket_type.quantity}")
            print(f"🔍 DEBUG: ticket_type.is_available: {ticket_type.is_available}")
            
            # Vérifier si le type de billet est complet
            if confirmed_ticket_count >= ticket_type.quantity:
                print(f"🔍 DEBUG: Custom ticket full - Registration blocked")
                raise serializers.ValidationError(f"Le type de billet '{ticket_type.name}' est complet.")
            else:
                print(f"🔍 DEBUG: Custom ticket has available places - Validation passed")
            
            print(f"🔍 DEBUG: ===== FIN VALIDATION BILLET PERSONNALISÉ =====")
        else:
            # 🎯 NOUVELLE LOGIQUE : Si PAS de type de billet (billet par défaut), vérifier la capacité globale
            if event.place_type == 'limited' and event.max_capacity:
                # Compter seulement les inscriptions confirmées SANS type de billet spécifique
                confirmed_default_count = EventRegistration.objects.filter(
                    event=event, 
                    ticket_type__isnull=True,  # Seulement les billets par défaut
                    status__in=['confirmed', 'attended']
                ).count()
                
                print(f"🔍 DEBUG: Default ticket validation - {confirmed_default_count}/{event.max_capacity}")
                
                # Vérifier si l'événement est complet et gérer la liste d'attente
                if confirmed_default_count >= event.max_capacity:
                    if event.enable_waitlist:
                        print(f"🔍 DEBUG: Event full but waitlist enabled - User will be waitlisted")
                        # Ne pas bloquer l'inscription, permettre la liste d'attente
                    else:
                        print(f"🔍 DEBUG: Event full and waitlist disabled - Registration blocked")
                        raise serializers.ValidationError("L'événement est complet.")
        
        # 🎯 NOUVELLE LOGIQUE : Vérifier que la session est active
        session_type = data.get('session_type')
        if session_type and not session_type.is_active:
            raise serializers.ValidationError(f"La session '{session_type.name}' n'est pas active.")
        
        if session_type:
            print(f"🔍 DEBUG: Session selected - {session_type.name} (active: {session_type.is_active})")
        
        # 🎯 NOUVELLE LOGIQUE : Gérer les utilisateurs connectés ET les invités
        # NOTE: La vérification des inscriptions existantes est déjà faite plus haut
        # Pas besoin de la refaire ici pour éviter la duplication
        
        print(f"🔍 DEBUG: Validation OK - Proceeding to create")
        
        # 🎯 CORRECTION MAJEURE : Ajouter ticket_type aux données validées
        if ticket_type:
            data['ticket_type'] = ticket_type
            print(f"🔍 DEBUG: Ticket type added to validated data: {ticket_type.name}")
        else:
            print(f"🔍 DEBUG: No ticket type provided")
        
        return data

    def create(self, validated_data):
        # 🎯 NOUVEAU : Logs de débogage pour create()
        print(f"🔍 DEBUG: create() appelé avec validated_data: {validated_data}")
        print(f"🔍 DEBUG: Clés dans validated_data: {list(validated_data.keys())}")
        
        request = self.context['request']
        user = getattr(request, 'user', None)
        event = validated_data['event']
        
        # 🎯 NOUVELLE LOGIQUE : Gérer les utilisateurs connectés ET les invités
        guest_full_name = validated_data.get('guest_full_name')
        guest_email = validated_data.get('guest_email')
        guest_phone = validated_data.get('guest_phone')
        guest_country = validated_data.get('guest_country')
        
        # Déterminer si c'est une inscription d'invité
        is_guest = bool(guest_full_name and guest_email and guest_phone and guest_country)
        
        # 🎯 SUPPRIMÉ : La validation empêche déjà les doublons, pas besoin de retourner une inscription existante
        
        if is_guest:
            print(f"🔍 DEBUG: Creating GUEST registration - Event: {event.title}, Guest: {guest_full_name}")
        else:
            print(f"🔍 DEBUG: Creating USER registration - Event: {event.title}, User: {user.username}")
        
        print(f"🔍 DEBUG: Validated data keys: {list(validated_data.keys())}")
        
        # 🔥 NOUVELLE LOGIQUE: Déterminer le statut selon le type de billet
        ticket_type = validated_data.get('ticket_type')
        
        if ticket_type and ticket_type.quantity is not None:
            # Billet personnalisé avec quantité limitée
            print(f"🔍 DEBUG: Custom ticket capacity - {ticket_type.name}: {ticket_type.sold_count}/{ticket_type.quantity}")
            
            if ticket_type.sold_count >= ticket_type.quantity:
                # Billet complet - refuser l'inscription
                raise serializers.ValidationError({
                    'ticket_type': f"Le type de billet '{ticket_type.name}' est complet."
                })
            else:
                # Billet disponible - déterminer le statut selon le prix
                if ticket_type.price == 0:
                    status = 'confirmed'  # Confirmer directement si gratuit
                else:
                    status = 'pending'  # En attente de paiement si payant
        else:
            # Billet "Par défaut" - vérifier la capacité globale de l'événement
            if event.place_type == 'limited' and event.max_capacity:
                # Compter seulement les billets par défaut confirmés
                confirmed_default_count = EventRegistration.objects.filter(
                    event=event,
                    ticket_type__isnull=True,  # Seulement les billets par défaut
                    status__in=['confirmed', 'attended']
                ).count()
                print(f"🔍 DEBUG: Default ticket - Event capacity: {confirmed_default_count}/{event.max_capacity}")
                
                if confirmed_default_count >= event.max_capacity:
                    # Événement complet - gérer selon la liste d'attente
                    if event.enable_waitlist:
                        status = 'waitlisted'  # Mettre en liste d'attente
                        print(f"🔍 DEBUG: Event full but waitlist enabled - Status set to waitlisted")
                    else:
                        # Refuser l'inscription
                        raise serializers.ValidationError({
                            'event': "L'événement est complet."
                        })
                else:
                    # Événement avec places disponibles - déterminer le statut selon le prix
                    if event.is_free:
                        status = 'confirmed'  # Confirmer directement si gratuit
                    else:
                        status = 'pending'  # En attente de paiement si payant
            else:
                # Événement sans limite de places - déterminer le statut selon le prix
                if event.is_free:
                    status = 'confirmed'  # Confirmer directement si gratuit
                else:
                    status = 'pending'  # En attente de paiement si payant

        
        # Créer l'inscription
        # Supprimer les champs déjà passés explicitement de validated_data
        data_for_create = validated_data.copy()
        data_for_create.pop('event', None)
        data_for_create.pop('status', None)
        data_for_create.pop('payment_status', None)  # Supprimer aussi payment_status
        
        # 🎯 NOUVELLE LOGIQUE : Ajouter session_type si présent
        session_type_id = validated_data.get('session_type_id')
        if session_type_id:
            try:
                from events.models import SessionType
                session_type = SessionType.objects.get(id=session_type_id, event=event)
                print(f"🔍 DEBUG: Session type included: {session_type.name}")
                data_for_create['session_type'] = session_type
            except SessionType.DoesNotExist:
                print(f"🔍 DEBUG: Session type not found: {session_type_id}")
        else:
            print(f"🔍 DEBUG: No session_type_id provided")
        
        # Supprimer session_type_id de data_for_create car ce n'est pas un champ du modèle
        data_for_create.pop('session_type_id', None)
        
        # 🎯 CORRECTION MAJEURE : Ajouter ticket_type si présent
        if ticket_type:
            data_for_create['ticket_type'] = ticket_type
            print(f"🔍 DEBUG: Ticket type included: {ticket_type.name}")
            print(f"🔍 DEBUG: Ticket type ID: {ticket_type.id}")
            print(f"🔍 DEBUG: Ticket type price: {ticket_type.price}")
        else:
            print(f"🔍 DEBUG: No ticket type provided")
            print(f"🔍 DEBUG: ticket_type variable: {ticket_type}")
            print(f"🔍 DEBUG: validated_data ticket_type: {validated_data.get('ticket_type')}")
        
        print(f"🔍 DEBUG: Data for create keys: {list(data_for_create.keys())}")
        
        # 🎯 NOUVELLE LOGIQUE : Calculer le prix selon le type de billet
        price_paid = 0
        if ticket_type:
            # Utiliser le prix du type de billet sélectionné
            if ticket_type.is_discount_active and ticket_type.discount_price is not None:
                price_paid = ticket_type.discount_price
                print(f"🔍 DEBUG: Prix avec remise: {price_paid} (prix normal: {ticket_type.price}, remise: {ticket_type.discount_price})")
            else:
                price_paid = ticket_type.price
                print(f"🔍 DEBUG: Prix normal du billet: {price_paid}")
        else:
            # Utiliser le prix par défaut de l'événement
            price_paid = event.price
            print(f"🔍 DEBUG: Prix par défaut de l'événement: {price_paid}")
        
        # Ajouter le prix calculé aux données de création
        data_for_create['price_paid'] = price_paid
        
        # 🎯 NOUVELLE LOGIQUE : Déterminer le payment_status selon le statut
        payment_status = 'pending'
        if status == 'confirmed':
            payment_status = 'paid'  # Si confirmé directement (gratuit), marquer comme payé
        elif status == 'waitlisted':
            payment_status = 'pending'  # En attente si en liste d'attente
        
        # 🎯 NOUVELLE LOGIQUE : Créer l'inscription selon le type (utilisateur ou invité)
        if is_guest:
            # Créer une inscription d'invité
            registration = EventRegistration.objects.create(
                user=None,  # Pas d'utilisateur pour les invités
                event=event,
                status=status,
                payment_status=payment_status,
                is_guest_registration=True,
                **data_for_create
            )
            print(f"🔍 DEBUG: Guest registration created - ID: {registration.id}, Guest: {guest_full_name}")
        else:
            # Créer une inscription d'utilisateur connecté
            registration = EventRegistration.objects.create(
                user=user,
                event=event,
                status=status,
                payment_status=payment_status,
                **data_for_create
            )
            print(f"🔍 DEBUG: User registration created - ID: {registration.id}, User: {user.username}")
        
        print(f"🔍 DEBUG: Registration created - ID: {registration.id}, Status: {registration.status}, Payment: {registration.payment_status}")
        
        # 🎯 CORRECTION MAJEURE : NE PAS incrémenter ici - c'est fait dans EventRegistration.save()
        # La méthode _update_ticket_counters() dans EventRegistration.save() gère déjà les compteurs
        print(f"🔍 DEBUG: Compteurs gérés par EventRegistration.save() - Pas d'incrémentation ici")
        
        return registration


class EventRegistrationUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour une inscription"""
    class Meta:
        model = EventRegistration
        fields = ['status', 'notes', 'special_requirements']
        read_only_fields = ['id', 'user', 'event', 'registered_at', 'updated_at']

    def validate_status(self, value):
        # Empêcher le changement de statut vers 'confirmed' si l'événement est complet
        if value == 'confirmed':
            event = self.instance.event
            if (event.place_type == 'limited' and 
                event.max_capacity and 
                event.current_registrations >= event.max_capacity):
                raise serializers.ValidationError("Impossible de confirmer l'inscription, l'événement est complet.")
        
        return value

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Mettre à jour l'inscription
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Gérer les changements de statut
        if old_status != new_status:
            event = instance.event
            
            # 🎯 CORRECTION : Les compteurs sont gérés par EventRegistration.save()
        
        return instance


class EventListSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour la liste des événements"""
    category = CategorySerializer(read_only=True)
    organizer = UserSerializer(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    available_places = serializers.IntegerField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_virtual = serializers.BooleanField(read_only=True)
    is_physical = serializers.BooleanField(read_only=True)
    registration_count = serializers.SerializerMethodField()
    interaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'short_description', 'start_date', 'end_date',
            'location', 'event_type', 'place_type', 'max_capacity', 'price',
            'is_free', 'poster', 'banner', 'category', 'organizer', 'status',
            'is_featured', 'is_public', 'access_type', 'slug', 'created_at',
            'is_full', 'available_places', 'is_upcoming', 'is_ongoing',
            'is_past', 'is_virtual', 'is_physical', 'registration_count',
            'interaction_count', 'current_registrations'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_interaction_count(self, obj):
        """Retourner des statistiques détaillées par type d'interaction"""
        interactions = obj.interactions.all()
        
        # Compter par type
        likes = interactions.filter(interaction_type='like').count()
        comments = interactions.filter(interaction_type='comment').count()
        shares = interactions.filter(interaction_type='share').count()
        ratings = interactions.filter(interaction_type='rating').count()
        
        # Calculer la note moyenne
        rating_interactions = interactions.filter(interaction_type='rating')
        avg_rating = 0
        if rating_interactions.exists():
            total_rating = sum(interaction.rating for interaction in rating_interactions if interaction.rating)
            avg_rating = round(total_rating / rating_interactions.count(), 1)
        
        return {
            'likes': likes,
            'comments': comments,
            'shares': shares,
            'ratings': ratings,
            'total': interactions.count(),
            'average_rating': avg_rating
        }


class VirtualEventCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer un événement virtuel"""
    event_data = EventSerializer(write_only=True)
    
    # Ajouter explicitement le champ photo pour s'assurer qu'il est inclus
    poster = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = VirtualEvent
        fields = ['event_data', 'poster', 'platform', 'meeting_id', 'meeting_password', 
                 'meeting_url', 'auto_record', 'allow_chat', 'allow_screen_sharing',
                 'waiting_room', 'access_instructions', 'technical_requirements']

    def create(self, validated_data, **kwargs):
        event_data = validated_data.pop('event_data')
        event_data['event_type'] = 'virtual'
        
        # Traiter le champ photo séparément
        poster = validated_data.pop('poster', None)
        if poster:
            event_data['poster'] = poster
        
        # Ajouter l'organisateur depuis kwargs ou le contexte
        user = kwargs.get('user')
        if not user:
            request = self.context.get('request')
            if request and request.user:
                user = request.user
        
        if user:
            event_data['organizer'] = user
        else:
            raise serializers.ValidationError("Utilisateur non connecté")
        
        # Créer l'événement directement avec l'organisateur
        event = Event.objects.create(**event_data)
        
        # Créer les détails virtuels (enlever user des validated_data)
        if 'user' in validated_data:
            validated_data.pop('user')
        virtual_event = VirtualEvent.objects.create(event=event, **validated_data)
        
        # 🎥 LES STREAMS NE SE CRÉENT PLUS AUTOMATIQUEMENT
        # L'organisateur doit lancer le stream manuellement via le bouton "Lancer le live"
        print("🎥 Stream non créé automatiquement - L'organisateur doit le lancer manuellement")
        
        return virtual_event


class VirtualEventUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour un événement virtuel"""
    class Meta:
        model = VirtualEvent
        fields = ['platform', 'meeting_id', 'meeting_password', 'meeting_url',
                 'auto_record', 'allow_chat', 'allow_screen_sharing', 'waiting_room',
                 'recording_url', 'recording_available', 'recording_expires_at',
                 'access_instructions', 'technical_requirements']


class VirtualEventInteractionCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer une interaction sur un événement virtuel"""
    class Meta:
        model = VirtualEventInteraction
        fields = ['event', 'interaction_type', 'content', 'rating']
        read_only_fields = ['id', 'user', 'ip_address', 'user_agent', 'created_at', 'updated_at']

    def validate(self, data):
        event = data['event']
        user = self.context['request'].user
        
        # Vérifier que l'événement est virtuel
        if not event.is_virtual:
            raise serializers.ValidationError("Les interactions ne sont autorisées que pour les événements virtuels.")
        
        # Permettre les interactions de base (like, share) sans inscription
        if data['interaction_type'] in ['like', 'share']:
            # Pas de vérification d'inscription pour les interactions simples
            pass
        else:
            # Vérifier l'inscription pour les interactions plus engageantes
            if not EventRegistration.objects.filter(event=event, user=user, status__in=['confirmed', 'attended']).exists():
                raise serializers.ValidationError("Vous devez être inscrit à l'événement pour commenter ou évaluer.")
        
        # Vérifier la note si c'est une évaluation
        if data['interaction_type'] == 'rating':
            rating = data.get('rating')
            if not rating or rating < 1 or rating > 5:
                raise serializers.ValidationError("La note doit être comprise entre 1 et 5.")
        
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        request = self.context['request']
        
        # Récupérer l'IP et le User Agent
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        
        # Vérifier si l'interaction existe déjà
        existing_interaction = VirtualEventInteraction.objects.filter(
            user=user,
            event=validated_data['event'],
            interaction_type=validated_data['interaction_type']
        ).first()
        
        if existing_interaction:
            # Si c'est un like, le supprimer (toggle)
            if validated_data['interaction_type'] == 'like':
                existing_interaction.delete()
                # Retourner un objet vide pour éviter l'erreur serializer
                return VirtualEventInteraction()
            else:
                # Pour les autres types, mettre à jour
                existing_interaction.content = validated_data.get('content', '')
                existing_interaction.rating = validated_data.get('rating')
                existing_interaction.save()
                return existing_interaction
        
        # Créer une nouvelle interaction
        interaction = VirtualEventInteraction.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            **validated_data
        )
        
        return interaction

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# Premier sérialiseur supprimé - conflit avec le second


class CustomReminderCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer un rappel personnalisé"""
    custom_recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text="Liste des IDs d'inscriptions pour ciblage personnalisé"
    )
    
    class Meta:
        model = CustomReminder
        fields = [
            'event', 'title', 'message', 'reminder_type', 'target_audience',
            'send_email', 'send_sms', 'scheduled_at', 'custom_recipient_ids'
        ]
    
    def validate_custom_recipient_ids(self, value):
        """Validation des destinataires personnalisés"""
        if not value:
            return value
        
        # Vérifier que tous les IDs correspondent à des inscriptions de l'événement
        event = self.initial_data.get('event')
        if event:
            valid_registrations = EventRegistration.objects.filter(
                id__in=value,
                event_id=event
            ).count()
            
            if valid_registrations != len(value):
                raise serializers.ValidationError("Certains destinataires ne sont pas valides pour cet événement.")
        
        return value
    
    def create(self, validated_data):
        """Créer le rappel personnalisé"""
        custom_recipient_ids = validated_data.pop('custom_recipient_ids', [])
        
        # Créer le rappel
        reminder = CustomReminder.objects.create(
            created_by=self.context['request'].user,
            **validated_data
        )
        
        # Ajouter les destinataires personnalisés si spécifiés
        if custom_recipient_ids:
            custom_recipients = EventRegistration.objects.filter(id__in=custom_recipient_ids)
            reminder.custom_recipients.set(custom_recipients)
        
        # Calculer le nombre total de destinataires
        try:
            # Vérifier si le champ total_recipients existe
            if hasattr(reminder, 'total_recipients'):
                reminder.total_recipients = reminder.get_recipients().count()
                reminder.save()
            else:
                print("🔍 DEBUG: Champ total_recipients n'existe pas encore dans la base de données")
        except Exception as e:
            print(f"🔍 DEBUG: Erreur lors du calcul des destinataires: {e}")
            if hasattr(reminder, 'total_recipients'):
                reminder.total_recipients = 0
                reminder.save()
        
        return reminder


class CustomReminderRecipientSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les destinataires personnalisés des rappels"""
    guest_name = serializers.SerializerMethodField()
    guest_email = serializers.SerializerMethodField()
    guest_phone = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomReminderRecipient
        fields = ['id', 'guest_name', 'guest_email', 'guest_phone', 'status']
        read_only_fields = ['id']
    
    def get_guest_name(self, obj):
        if obj.registration.user:
            return f"{obj.registration.user.first_name} {obj.registration.user.last_name}".strip() or obj.registration.user.username
        else:
            return obj.registration.guest_full_name
    
    def get_guest_email(self, obj):
        if obj.registration.user:
            return obj.registration.user.email
        else:
            return obj.registration.guest_email
    
    def get_guest_phone(self, obj):
        if obj.registration.user and hasattr(obj.registration.user, 'profile'):
            return obj.registration.user.profile.phone
        else:
            return obj.registration.guest_phone
    
    def get_status(self, obj):
        return obj.registration.status


class CustomReminderSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les rappels personnalisés"""
    event_title = serializers.CharField(source='event.title', read_only=True)
    organizer_name = serializers.CharField(source='created_by.username', read_only=True)
    reminder_type_display = serializers.CharField(read_only=True)
    target_audience_display = serializers.CharField(read_only=True)
    recipients_count = serializers.IntegerField(read_only=True)
    custom_recipients = CustomReminderRecipientSerializer(source='recipient_entries', many=True, read_only=True)
    
    # 🎯 NOUVEAU: Champ pour choisir entre manuel et automatique
    send_mode = serializers.ChoiceField(
        choices=[
            ('manual', 'Envoi manuel'),
            ('automatic', 'Envoi automatique')
        ],
        write_only=True,
        required=False,  # Rendre optionnel pour compatibilité
        default='manual',  # Valeur par défaut
        help_text="Choisir entre envoi manuel (brouillon) ou automatique (programmé)"
    )
    
    class Meta:
        model = CustomReminder
        fields = [
            'id', 'title', 'message', 'reminder_type', 'reminder_type_display',
            'target_audience', 'target_audience_display', 'send_email', 'send_sms',
            'scheduled_at', 'sent_at', 'status', 'emails_sent', 'sms_sent',
            'emails_failed', 'sms_failed', 'created_at', 'updated_at',
            'event', 'event_title', 'created_by', 'organizer_name',
            'recipients_count', 'custom_recipients', 'send_mode'
        ]
        read_only_fields = [
            'id', 'created_by', 'sent_at', 'emails_sent', 'sms_sent',
            'emails_failed', 'sms_failed', 'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier qu'au moins un canal d'envoi est sélectionné
        if not data.get('send_email', False) and not data.get('send_sms', False):
            raise serializers.ValidationError(
                "Au moins un canal d'envoi (email ou SMS) doit être sélectionné."
            )
        
        # Vérifier que la date de programmation est dans le futur
        if data.get('scheduled_at'):
            if data['scheduled_at'] <= timezone.now():
                raise serializers.ValidationError(
                    "La date de programmation doit être dans le futur."
                )
        
        return data
    
    def create(self, validated_data):
        """Créer un rappel avec l'organisateur automatiquement défini"""
        print(f"🔍 DEBUG: CustomReminderSerializer.create() DÉBUT")
        print(f"🔍 DEBUG: validated_data reçu: {validated_data}")
        print(f"🔍 DEBUG: validated_data keys: {list(validated_data.keys())}")
        
        validated_data['created_by'] = self.context['request'].user
        print(f"🔍 DEBUG: created_by ajouté: {validated_data['created_by']}")
        
        # Ajouter total_recipients avec une valeur par défaut
        validated_data['total_recipients'] = 0
        print(f"🔍 DEBUG: total_recipients ajouté: {validated_data['total_recipients']}")
        
        # 🎯 NOUVEAU: Gestion du mode d'envoi
        send_mode = validated_data.pop('send_mode', 'manual')  # Par défaut: manuel
        scheduled_at = validated_data.get('scheduled_at')
        
        print(f"🔍 DEBUG: Mode d'envoi choisi: {send_mode}")
        print(f"🔍 DEBUG: Heure programmée: {scheduled_at}")
        
        if send_mode == 'automatic':
            # Mode automatique: nécessite une heure programmée
            if not scheduled_at:
                raise serializers.ValidationError(
                    "Pour l'envoi automatique, une heure de programmation est requise."
                )
            from django.utils import timezone
            if scheduled_at <= timezone.now():
                raise serializers.ValidationError(
                    "Pour l'envoi automatique, l'heure doit être dans le futur."
                )
            validated_data['status'] = 'scheduled'
            print(f"🔍 DEBUG: Mode automatique - Statut défini à 'scheduled'")
        else:
            # Mode manuel: statut brouillon par défaut
            validated_data['status'] = 'draft'
            print(f"🔍 DEBUG: Mode manuel - Statut défini à 'draft'")
            # Si une heure est fournie en mode manuel, on la garde mais on reste en brouillon
            if scheduled_at:
                print(f"🔍 DEBUG: Heure programmée fournie en mode manuel: {scheduled_at}")
        
        print(f"🔍 DEBUG: validated_data final: {validated_data}")
        
        try:
            result = super().create(validated_data)
            print(f"🔍 DEBUG: CustomReminder créé avec succès: {result}")
            print(f"🔍 DEBUG: ID du rappel créé: {result.id}")
            print(f"🔍 DEBUG: Statut final: {result.status}")
            return result
        except Exception as e:
            print(f"🔍 DEBUG: ERREUR lors de la création: {e}")
            print(f"🔍 DEBUG: Type d'erreur: {type(e)}")
            raise