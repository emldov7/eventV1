"""
Permissions personnalisées pour le système de rôles
"""
from rest_framework.permissions import BasePermission
from django.contrib.auth.decorators import user_passes_test
from functools import wraps
from django.http import JsonResponse


class IsSuperAdmin(BasePermission):
    """
    Permission personnalisée pour autoriser seulement les Super Admins
    """
    message = "Seuls les Super Administrateurs peuvent accéder à cette ressource."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Vérifier si l'utilisateur est staff (admin Django natif)
        if request.user.is_staff or request.user.is_superuser:
            return True
            
        # Vérifier le rôle dans le profil
        return hasattr(request.user, 'profile') and request.user.profile.is_super_admin


class IsOrganizerOrSuperAdmin(BasePermission):
    """
    Permission pour Organisateurs et Super Admins
    """
    message = "Seuls les Organisateurs et Super Administrateurs peuvent accéder à cette ressource."
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Staff/superuser Django
        if request.user.is_staff or request.user.is_superuser:
            return True
            
        # Vérifier le profil
        if hasattr(request.user, 'profile'):
            return request.user.profile.is_super_admin or request.user.profile.is_organizer
            
        return False


class IsOwnerOrganizerOrSuperAdmin(BasePermission):
    """
    Permission pour le propriétaire, organisateur du même événement, ou Super Admin
    """
    message = "Vous devez être le propriétaire, l'organisateur de l'événement, ou un Super Administrateur."
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Staff/superuser Django
        if request.user.is_staff or request.user.is_superuser:
            return True
            
        # Super Admin
        if hasattr(request.user, 'profile') and request.user.profile.is_super_admin:
            return True
            
        # Propriétaire de l'objet
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
            
        # Organisateur de l'événement associé
        if hasattr(obj, 'event') and obj.event.organizer == request.user:
            return True
            
        # Organisateur direct (pour les événements)
        if hasattr(obj, 'organizer') and obj.organizer == request.user:
            return True
            
        return False


# =====================================
# DÉCORATEURS POUR LES VUES FONCTION
# =====================================

def super_admin_required(function=None, message="Accès réservé aux Super Administrateurs"):
    """
    Décorateur pour restreindre l'accès aux Super Admins seulement
    """
    def check_super_admin(user):
        if user.is_staff or user.is_superuser:
            return True
        return hasattr(user, 'profile') and user.profile.is_super_admin
    
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentification requise'}, status=401)
                
            if not check_super_admin(request.user):
                return JsonResponse({'error': message}, status=403)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    
    if function:
        return decorator(function)
    return decorator


def organizer_or_super_admin_required(function=None):
    """
    Décorateur pour autoriser Organisateurs et Super Admins
    """
    def check_role(user):
        if user.is_staff or user.is_superuser:
            return True
        if hasattr(user, 'profile'):
            return user.profile.is_super_admin or user.profile.is_organizer
        return False
    
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentification requise'}, status=401)
                
            if not check_role(request.user):
                return JsonResponse({'error': 'Accès réservé aux Organisateurs et Super Administrateurs'}, status=403)
                
            return view_func(request, *args, **kwargs)
        return wrapper
    
    if function:
        return decorator(function)
    return decorator


# =====================================
# HELPERS UTILITAIRES
# =====================================

def get_user_role(user):
    """Récupère le rôle d'un utilisateur"""
    if user.is_superuser:
        return 'django_superuser'
    if user.is_staff:
        return 'django_staff'
    if hasattr(user, 'profile'):
        return user.profile.role
    return 'unknown'


def can_manage_user(current_user, target_user):
    """Vérifie si current_user peut gérer target_user"""
    # Super admins peuvent gérer tout le monde
    if current_user.is_staff or current_user.is_superuser:
        return True
    if hasattr(current_user, 'profile') and current_user.profile.is_super_admin:
        return True
    
    # Un utilisateur ne peut pas se gérer lui-même via cette fonction
    if current_user == target_user:
        return False
        
    return False


def can_manage_event(user, event):
    """Vérifie si un utilisateur peut gérer un événement spécifique"""
    # Super admins peuvent gérer tous les événements
    if user.is_staff or user.is_superuser:
        return True
    if hasattr(user, 'profile') and user.profile.is_super_admin:
        return True
    
    # Organisateur peut gérer ses propres événements
    return event.organizer == user


def get_accessible_events(user):
    """Retourne les événements accessibles pour un utilisateur"""
    from .models import Event
    
    # Super admins voient tout
    if user.is_staff or user.is_superuser:
        return Event.objects.all()
    if hasattr(user, 'profile') and user.profile.is_super_admin:
        return Event.objects.all()
    
    # Organisateurs voient leurs événements
    if hasattr(user, 'profile') and user.profile.is_organizer:
        return Event.objects.filter(organizer=user)
    
    # Participants voient les événements publics
    return Event.objects.filter(status='published')


def get_manageable_users(current_user):
    """Retourne les utilisateurs que current_user peut gérer"""
    from django.contrib.auth.models import User
    
    # Seuls les Super Admins peuvent gérer les utilisateurs
    if current_user.is_staff or current_user.is_superuser:
        return User.objects.all()
    if hasattr(current_user, 'profile') and current_user.profile.is_super_admin:
        return User.objects.all()
    
    # Les autres ne peuvent gérer personne
    return User.objects.none()






