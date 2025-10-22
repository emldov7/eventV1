from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from . import ai_views
from .views import (
    EventViewSet, CategoryViewSet, TagViewSet,
    EventRegistrationViewSet, EventHistoryViewSet, register_user, get_current_user, change_password, update_profile,
    process_refund_view, approve_refund, reject_refund, system_health_check,
    super_admin_event_detail, super_admin_reject_event, super_admin_delete_event,
    super_admin_export_registrations_csv, super_admin_export_registrations_excel,
    organizer_refunds_list, process_refund_request, organizer_bulk_process_refunds,
    VirtualEventViewSet, VirtualEventInteractionViewSet, CustomReminderViewSet
)
from .health_views import simple_health_check, detailed_health_check
from .admin_views import (
    SuperAdminViewSet, platform_analytics, pending_moderation,
    super_admin_refunds_list, super_admin_process_refund, super_admin_bulk_process_refunds,
    pending_registrations, confirm_registration, reject_registration, bulk_confirm_registrations,
    predictive_analytics_dashboard, train_ml_models, predict_event_fill_rate,
    optimize_event_pricing, get_emerging_trends, get_market_analysis, get_predictive_insights,
    generate_event_content, pending_organizer_approvals, approve_organizer_account, reject_organizer_account
)
from .streaming_views import (
    create_stream, get_stream_status, update_stream, delete_stream,
    get_streaming_instructions, test_platform_connection, list_platforms,
    configure_stream, start_stream, pause_stream, stop_stream, join_stream
)

# Configuration du routeur
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'registrations', EventRegistrationViewSet, basename='registration')
router.register(r'history', EventHistoryViewSet, basename='history')
router.register(r'admin', SuperAdminViewSet, basename='admin')
router.register(r'virtual-events', VirtualEventViewSet, basename='virtual_event')
router.register(r'virtual-interactions', VirtualEventInteractionViewSet, basename='virtual_interaction')

# Enregistrement du ViewSet CustomReminder
try:
    router.register(r'custom-reminders', CustomReminderViewSet, basename='custom_reminder')
except Exception as e:
    print(f"⚠️ Erreur lors de l'enregistrement de CustomReminderViewSet: {e}")

urlpatterns = [
    path('', include(router.urls)),
    # Auth JWT
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/login/', views.custom_login, name='custom_login'),
    
    # 🔐 AUTHENTIFICATION SOCIALE
    path('auth/google/', views.google_auth, name='google_auth'),
    path('auth/facebook/', views.facebook_auth, name='facebook_auth'),
    path('refund/<int:refund_request_id>/process/', process_refund_view, name='process_refund'),
    # Nouvelles routes pour les remboursements
    path('refunds/<int:refund_id>/approve/', approve_refund, name='approve_refund'),
    path('refunds/<int:refund_id>/reject/', reject_refund, name='reject_refund'),
    path('auth/register/', register_user, name='register'),
    path('auth/user/', get_current_user, name='get_current_user'),
    path('auth/change_password/', change_password, name='change_password'),
    path('auth/update_profile/', update_profile, name='update_profile'),
    
    # Route pour la vérification QR
    path('verify_qr/', views.verify_qr_endpoint, name='verify_qr'),
    # Route alternative pour la vérification QR
    path('registrations/verify_qr/', views.verify_qr_endpoint, name='verify_qr_alt'),
    # Route de test
    path('test_qr/', views.test_qr_endpoint, name='test_qr'),
    
    # Super Admin routes
    path('admin/analytics/', platform_analytics, name='admin_analytics'),
    path('admin/moderation/', pending_moderation, name='admin_moderation'),
    
    # Nouvelles routes Super Admin
    path('admin/global_stats/', views.super_admin_global_stats, name='super_admin_global_stats'),
    path('admin/analytics_advanced/', views.super_admin_analytics, name='super_admin_analytics'),
    path('admin/users/', views.super_admin_users_list, name='super_admin_users_list'),
    path('admin/create_user/', views.super_admin_create_user, name='super_admin_create_user'),
    path('admin/manage_user/', views.super_admin_manage_user, name='super_admin_manage_user'),
    
    # Routes pour la gestion complète des événements
    path('admin/events/<int:event_id>/detail/', super_admin_event_detail, name='super_admin_event_detail'),
    path('admin/events/<int:event_id>/reject/', super_admin_reject_event, name='super_admin_reject_event'),
    path('admin/events/<int:event_id>/delete/', super_admin_delete_event, name='super_admin_delete_event'),
    
    # Routes pour catégories et tags
    path('categories_management/', views.categories_list, name='categories_list'),
    path('categories_management/<int:pk>/', views.category_detail, name='category_detail'),
    path('tags_management/', views.tags_list, name='tags_list'),
    path('tags_management/<int:pk>/', views.tag_detail, name='tag_detail'),
    
    # Routes pour la gestion des remboursements
    path('admin/refunds/', super_admin_refunds_list, name='super_admin_refunds_list'),
    path('admin/process_refund/', super_admin_process_refund, name='super_admin_process_refund'),
    path('admin/bulk_process_refunds/', super_admin_bulk_process_refunds, name='super_admin_bulk_process_refunds'),
    
    # Routes pour les organisateurs (remboursements)
    path('organizer/refunds/', organizer_refunds_list, name='organizer_refunds_list'),
    path('organizer/refunds/<int:refund_id>/process/', process_refund_request, name='process_refund_request'),
    path('organizer/bulk_process_refunds/', organizer_bulk_process_refunds, name='organizer_bulk_process_refunds'),
    
    # 🆕 NOUVELLES ROUTES POUR LA GESTION DES REMBOURSEMENTS D'ÉVÉNEMENTS ANNULÉS
    path('organizer/events/<int:event_id>/create_missing_refunds/', views.create_missing_refunds_for_cancelled_event, name='create_missing_refunds_for_cancelled_event'),

    # Routes pour la gestion des inscriptions en attente
    path('admin/pending_registrations/', pending_registrations, name='pending_registrations'),
    path('admin/confirm_registration/', confirm_registration, name='confirm_registration'),
    path('admin/reject_registration/', reject_registration, name='reject_registration'),
    path('admin/bulk_confirm_registrations/', bulk_confirm_registrations, name='bulk_confirm_registrations'),
    
    # Routes pour l'export des inscriptions (Super Admin)
    path('admin/events/<int:event_id>/export_csv/', views.super_admin_export_registrations_csv, name='super_admin_export_csv'),
    path('admin/events/<int:event_id>/export_excel/', views.super_admin_export_registrations_excel, name='super_admin_export_excel'),
    
    # Routes pour la gestion de la liste d'attente (organisateurs)
    path('registrations/<int:registration_id>/approve_waitlist/', views.approve_waitlist_registration, name='approve_waitlist'),
    path('registrations/<int:registration_id>/reject_waitlist/', views.reject_waitlist_registration, name='reject_waitlist'),
    
    # Route pour la santé du système
    path('admin/system_health/', system_health_check, name='system_health_check'),
    
    # Routes de healthcheck pour Railway (sans authentification)
    path('health/', simple_health_check, name='simple_health_check'),
    path('health/detailed/', detailed_health_check, name='detailed_health_check'),
    
    # 🎯 ANALYTICS PRÉDICTIFS AVANCÉS
    path('admin/predictive_analytics/', predictive_analytics_dashboard, name='predictive_analytics_dashboard'),
    path('admin/train_ml_models/', train_ml_models, name='train_ml_models'),
    path('admin/predict_fill_rate/', predict_event_fill_rate, name='predict_event_fill_rate'),
    path('admin/optimize_pricing/', optimize_event_pricing, name='optimize_event_pricing'),
    path('admin/emerging_trends/', get_emerging_trends, name='get_emerging_trends'),
    path('admin/market_analysis/', get_market_analysis, name='get_market_analysis'),
    path('admin/predictive_insights/', get_predictive_insights, name='get_predictive_insights'),
    
    # 🎨 GÉNÉRATION AUTOMATIQUE DE CONTENU
    path('admin/generate_content/', generate_event_content, name='generate_event_content'),
    
    # Routes pour l'approbation des comptes organisateurs
    path('admin/pending_organizer_approvals/', pending_organizer_approvals, name='pending_organizer_approvals'),
    path('admin/approve_organizer_account/', approve_organizer_account, name='approve_organizer_account'),
    path('admin/reject_organizer_account/', reject_organizer_account, name='reject_organizer_account'),
    
    # Route de test simple pour vérifier la connexion
    
    # Route pour la vérification d'accès au stream
    path('events/<int:event_id>/verify-stream-access/', views.verify_stream_access, name='verify_stream_access'),
    
    # Route pour le formulaire d'accès au stream
    path('events/<int:event_id>/stream-access-form/', views.get_stream_access_form, name='get_stream_access_form'),
    path('test/', views.test_connection, name='test_connection'),
    
    # 🎥 NOUVELLES ROUTES POUR LE STREAMING
    # Gestion des streams pour événements virtuels
    path('streaming/<int:event_id>/create/', create_stream, name='create_stream'),
    path('streaming/<int:event_id>/status/', get_stream_status, name='get_stream_status'),
    path('streaming/<int:event_id>/update/', update_stream, name='update_stream'),
    path('streaming/<int:event_id>/delete/', delete_stream, name='delete_stream'),
    path('streaming/<int:event_id>/instructions/', get_streaming_instructions, name='get_streaming_instructions'),
    
    # 🚀 NOUVELLES ROUTES POUR LANCER ET REJOINDRE LE STREAMING
    path('streaming/<int:event_id>/configure/', configure_stream, name='configure_stream'),
    path('streaming/<int:event_id>/start/', start_stream, name='start_stream'),
    path('streaming/<int:event_id>/pause/', pause_stream, name='pause_stream'),
    path('streaming/<int:event_id>/stop/', stop_stream, name='stop_stream'),
    path('streaming/<int:event_id>/join/', join_stream, name='join_stream'),
    
    # Tests et gestion des plateformes
    path('streaming/platforms/', list_platforms, name='list_platforms'),
    path('streaming/platforms/<str:platform>/test/', test_platform_connection, name='test_platform_connection'),
    
    # === INTELLIGENCE ARTIFICIELLE - CHATBOT ===
    path('ai/chat/', ai_views.chat_with_ai, name='ai_chat'),
    path('ai/suggestions/', ai_views.get_ai_suggestions, name='ai_suggestions'),
    path('ai/help/event/<int:event_id>/', ai_views.ai_help_with_event, name='ai_help_event'),
    path('ai/info/', ai_views.ai_public_info, name='ai_info'),
    path('ai/feedback/', ai_views.ai_feedback, name='ai_feedback'),
] 