from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Event, Category, Tag, EventRegistration, EventHistory, TicketType, SessionType, CustomReminder, CustomReminderRecipient


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def color_display(self, obj):
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            obj.color, obj.color
        )
    color_display.short_description = 'Couleur'
    
    def event_count(self, obj):
        return obj.event_set.count()
    event_count.short_description = 'Nombre d\'événements'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']
    ordering = ['name']
    
    def color_display(self, obj):
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            obj.color, obj.color
        )
    color_display.short_description = 'Couleur'


class EventRegistrationInline(admin.TabularInline):
    model = EventRegistration
    extra = 0
    readonly_fields = ['registered_at', 'updated_at']
    fields = ['user', 'status', 'notes', 'registered_at']


class EventHistoryInline(admin.TabularInline):
    model = EventHistory
    extra = 0
    readonly_fields = ['timestamp', 'user', 'action', 'field_name', 'old_value', 'new_value']
    fields = ['timestamp', 'user', 'action', 'field_name']
    can_delete = False


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'organizer', 'category', 'status', 'start_date', 
        'location', 'is_featured', 'registration_count', 'is_full_display'
    ]
    list_filter = [
        'status', 'category', 'is_featured', 'is_free', 'place_type',
        'start_date', 'created_at'
    ]
    search_fields = ['title', 'description', 'location', 'organizer__username']
    readonly_fields = [
        'slug', 'created_at', 'updated_at', 'published_at',
        'current_registrations', 'is_full', 'available_places',
        'is_upcoming', 'is_ongoing', 'is_past'
    ]
    filter_horizontal = ['tags']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('title', 'description', 'short_description', 'slug')
        }),
        ('Dates et lieu', {
            'fields': ('start_date', 'end_date', 'location', 'address')
        }),
        ('Gestion des places', {
            'fields': ('place_type', 'max_capacity', 'current_registrations')
        }),
        ('Prix', {
            'fields': ('price', 'is_free')
        }),
        ('Images', {
            'fields': ('poster', 'banner'),
            'classes': ('collapse',)
        }),
        ('Catégorisation', {
            'fields': ('category', 'tags')
        }),
        ('Statut et métadonnées', {
            'fields': ('status', 'is_featured', 'is_public', 'organizer')
        }),
        ('Contact', {
            'fields': ('contact_email', 'contact_phone', 'website'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
        ('Propriétés calculées', {
            'fields': ('is_full', 'available_places', 'is_upcoming', 'is_ongoing', 'is_past'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [EventRegistrationInline, EventHistoryInline]
    
    def registration_count(self, obj):
        return obj.registrations.count()
    registration_count.short_description = 'Inscriptions'
    
    def is_full_display(self, obj):
        if obj.is_full:
            return format_html(
                '<span style="color: red; font-weight: bold;">COMPLET</span>'
            )
        return format_html(
            '<span style="color: green;">Disponible</span>'
        )
    is_full_display.short_description = 'Statut'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('organizer', 'category')
    
    actions = ['publish_events', 'cancel_events', 'mark_as_featured']
    
    def publish_events(self, request, queryset):
        updated = queryset.update(status='published')
        self.message_user(request, f'{updated} événement(s) publié(s) avec succès.')
    publish_events.short_description = "Publier les événements sélectionnés"
    
    def cancel_events(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} événement(s) annulé(s) avec succès.')
    cancel_events.short_description = "Annuler les événements sélectionnés"
    
    def mark_as_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} événement(s) marqué(s) comme en vedette.')
    mark_as_featured.short_description = "Marquer comme en vedette"


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'price', 'quantity', 'sold_count', 'is_vip']
    list_filter = ['is_vip', 'event']
    search_fields = ['name', 'event__title']
    ordering = ['event', 'price']


@admin.register(SessionType)
class SessionTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'is_active', 'is_mandatory', 'display_order']
    list_filter = ['is_active', 'is_mandatory', 'event']
    search_fields = ['name', 'event__title']
    ordering = ['event', 'display_order', 'name']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('event', 'name')
        }),
        ('Statut', {
            'fields': ('is_active', 'is_mandatory', 'display_order')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = [
        'event', 'user', 'status', 'registered_at', 'event_date'
    ]
    list_filter = ['status', 'registered_at', 'event__start_date']
    search_fields = ['event__title', 'user__username', 'user__email']
    readonly_fields = ['registered_at', 'updated_at', 'confirmed_at', 'cancelled_at']
    date_hierarchy = 'registered_at'
    ordering = ['-registered_at']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('event', 'user', 'status')
        }),
        ('Détails', {
            'fields': ('notes', 'special_requirements')
        }),
        ('Timestamps', {
            'fields': ('registered_at', 'updated_at', 'confirmed_at', 'cancelled_at'),
            'classes': ('collapse',)
        }),
    )
    
    def event_date(self, obj):
        return obj.event.start_date
    event_date.short_description = 'Date de l\'événement'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event', 'user')


@admin.register(EventHistory)
class EventHistoryAdmin(admin.ModelAdmin):
    list_display = ['event', 'user', 'action', 'timestamp']
    list_filter = ['action', 'timestamp', 'event__status']
    search_fields = ['event__title', 'user__username', 'action']
    readonly_fields = ['event', 'user', 'action', 'field_name', 'old_value', 'new_value', 'timestamp']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event', 'user')


@admin.register(CustomReminder)
class CustomReminderAdmin(admin.ModelAdmin):
    list_display = ['title', 'event', 'created_by', 'reminder_type', 'target_audience', 'status', 'created_at']
    list_filter = ['status', 'reminder_type', 'target_audience', 'created_at']
    search_fields = ['title', 'message', 'event__title', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'sent_at', 'emails_sent', 'sms_sent', 'emails_failed', 'sms_failed']
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'message', 'reminder_type', 'event', 'created_by')
        }),
        ('Audience et canaux', {
            'fields': ('target_audience', 'send_email', 'send_sms')
        }),
        ('Programmation', {
            'fields': ('scheduled_at', 'status')
        }),
        ('Statistiques', {
            'fields': ('sent_at', 'emails_sent', 'sms_sent', 'emails_failed', 'sms_failed'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CustomReminderRecipient)
class CustomReminderRecipientAdmin(admin.ModelAdmin):
    list_display = ['reminder', 'registration', 'guest_name', 'guest_email']
    list_filter = ['reminder__status', 'registration__status']
    search_fields = ['reminder__title', 'registration__guest_full_name', 'registration__guest_email']
    
    def guest_name(self, obj):
        if obj.registration.user:
            return f"{obj.registration.user.first_name} {obj.registration.user.last_name}".strip() or obj.registration.user.username
        else:
            return obj.registration.guest_full_name
    guest_name.short_description = 'Nom'
    
    def guest_email(self, obj):
        if obj.registration.user:
            return obj.registration.user.email
        else:
            return obj.registration.guest_email
    guest_email.short_description = 'Email'