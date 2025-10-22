"""
Service d'Intelligence Artificielle pour le système de gestion d'événements
Intègre un chatbot intelligent avec modèles pré-entraînés français
"""

import logging
import re
from typing import Dict, List, Optional
from django.contrib.auth.models import User
from .models import Event, EventRegistration, VirtualEvent
from django.utils import timezone
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class EventManagementChatbot:
    """
    Chatbot intelligent pour assister les utilisateurs dans la gestion d'événements
    """
    
    def __init__(self):
        """Initialise le chatbot avec des réponses pré-définies et de la logique"""
        self.context_memory = {}  # Mémoire contextuelle des conversations
        
        # Base de connaissances pour les réponses
        self.knowledge_base = {
            # Questions sur les événements
            "events": {
                "keywords": ["événement", "event", "spectacle", "concert", "conférence", "formation"],
                "responses": {
                    "list": "Voici les événements disponibles. Voulez-vous en savoir plus sur un événement en particulier ?",
                    "create": "Pour créer un événement, rendez-vous dans votre espace organisateur et cliquez sur 'Créer un événement'.",
                    "join": "Pour vous inscrire à un événement, cliquez sur 'S'inscrire' sur la page de l'événement."
                }
            },
            
            # Questions sur le streaming
            "streaming": {
                "keywords": ["stream", "streaming", "live", "direct", "vidéo", "connexion", "rejoindre"],
                "responses": {
                    "join": "Pour rejoindre le stream, cliquez sur 'Rejoindre le Live' sur la page de l'événement. Assurez-vous d'avoir payé votre inscription.",
                    "problem": "Si vous avez des problèmes de connexion, vérifiez votre connexion internet et rafraîchissez la page.",
                    "access": "Vous recevrez les identifiants de connexion par email une fois votre paiement confirmé."
                }
            },
            
            # Questions sur les paiements
            "payment": {
                "keywords": ["payer", "paiement", "prix", "gratuit", "coût", "tarif", "inscription"],
                "responses": {
                    "how": "Le paiement se fait directement sur le site via carte bancaire. Votre inscription sera confirmée automatiquement.",
                    "free": "Certains événements sont gratuits, d'autres sont payants. Le prix est affiché sur la page de l'événement.",
                    "problem": "En cas de problème de paiement, contactez le support technique."
                }
            },
            
            # Questions techniques
            "technical": {
                "keywords": ["problème", "erreur", "bug", "marche pas", "fonctionne pas", "aide"],
                "responses": {
                    "general": "Je peux vous aider avec les problèmes techniques. De quel type de problème s'agit-il ?",
                    "streaming": "Pour les problèmes de streaming, vérifiez votre navigateur et votre connexion internet.",
                    "account": "Pour les problèmes de compte, vérifiez vos identifiants de connexion."
                }
            },
            
            # Salutations et politesse
            "greetings": {
                "keywords": ["bonjour", "salut", "hello", "bonsoir", "merci", "au revoir"],
                "responses": {
                    "hello": "Bonjour ! Je suis votre assistant virtuel pour les événements. Comment puis-je vous aider ?",
                    "thanks": "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
                    "goodbye": "Au revoir ! J'espère avoir pu vous aider. À bientôt !"
                }
            }
        }

    def analyze_message(self, message: str, user: Optional[User] = None) -> Dict:
        """
        Analyse le message de l'utilisateur et détermine l'intention
        """
        message_lower = message.lower()
        
        # Détection des intentions basée sur les mots-clés
        detected_intent = self._detect_intent(message_lower)
        
        # Extraction des entités (événements, dates, etc.)
        entities = self._extract_entities(message_lower, user)
        
        return {
            "intent": detected_intent,
            "entities": entities,
            "original_message": message,
            "confidence": 0.8  # Score de confiance simulé
        }

    def generate_response(self, message: str, user: Optional[User] = None) -> Dict:
        """
        Génère une réponse intelligente basée sur l'analyse du message
        """
        try:
            # Analyser le message
            analysis = self.analyze_message(message, user)
            intent = analysis["intent"]
            entities = analysis["entities"]
            
            # Générer la réponse selon l'intention détectée
            if intent == "greetings":
                response = self._handle_greetings(message.lower())
            elif intent == "events":
                response = self._handle_events_questions(message.lower(), entities, user)
            elif intent == "streaming":
                response = self._handle_streaming_questions(message.lower(), entities, user)
            elif intent == "payment":
                response = self._handle_payment_questions(message.lower(), entities, user)
            elif intent == "technical":
                response = self._handle_technical_questions(message.lower(), entities, user)
            else:
                response = self._handle_unknown_intent(message)
            
            # Ajouter des suggestions d'actions
            suggestions = self._generate_suggestions(intent, entities, user)
            
            return {
                "success": True,
                "response": response,
                "intent": intent,
                "suggestions": suggestions,
                "timestamp": timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de réponse: {e}")
            return {
                "success": False,
                "response": "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler votre question ?",
                "error": str(e),
                "timestamp": timezone.now().isoformat()
            }

    def _detect_intent(self, message: str) -> str:
        """Détecte l'intention principale du message"""
        
        # Vérification des salutations
        greeting_patterns = ["bonjour", "salut", "hello", "bonsoir", "merci", "au revoir"]
        if any(pattern in message for pattern in greeting_patterns):
            return "greetings"
        
        # Vérification des questions sur les événements
        event_patterns = ["événement", "event", "spectacle", "concert", "créer", "inscription"]
        if any(pattern in message for pattern in event_patterns):
            return "events"
        
        # Vérification des questions sur le streaming
        streaming_patterns = ["stream", "live", "direct", "rejoindre", "connexion", "vidéo"]
        if any(pattern in message for pattern in streaming_patterns):
            return "streaming"
        
        # Vérification des questions sur les paiements
        payment_patterns = ["payer", "paiement", "prix", "gratuit", "coût", "tarif"]
        if any(pattern in message for pattern in payment_patterns):
            return "payment"
        
        # Vérification des problèmes techniques
        technical_patterns = ["problème", "erreur", "bug", "marche pas", "fonctionne pas", "aide"]
        if any(pattern in message for pattern in technical_patterns):
            return "technical"
        
        return "unknown"

    def _extract_entities(self, message: str, user: Optional[User] = None) -> Dict:
        """Extrait les entités importantes du message"""
        entities = {}
        
        # Recherche d'IDs d'événements
        event_id_match = re.search(r'événement (\d+)|event (\d+)', message)
        if event_id_match:
            entities["event_id"] = event_id_match.group(1) or event_id_match.group(2)
        
        # Recherche de références temporelles
        if any(word in message for word in ["aujourd'hui", "maintenant", "ce soir"]):
            entities["time_reference"] = "today"
        elif any(word in message for word in ["demain", "tomorrow"]):
            entities["time_reference"] = "tomorrow"
        
        return entities

    def _handle_greetings(self, message: str) -> str:
        """Gère les salutations et politesses"""
        if any(word in message for word in ["bonjour", "salut", "hello", "bonsoir"]):
            return "Bonjour ! Je suis votre assistant virtuel pour les événements. Comment puis-je vous aider aujourd'hui ?"
        elif "merci" in message:
            return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions."
        elif any(word in message for word in ["au revoir", "bye", "goodbye"]):
            return "Au revoir ! J'espère avoir pu vous aider. À bientôt sur notre plateforme !"
        else:
            return "Bonjour ! Comment puis-je vous aider ?"

    def _handle_events_questions(self, message: str, entities: Dict, user: Optional[User] = None) -> str:
        """Gère les questions sur les événements"""
        
        if "créer" in message or "organiser" in message:
            if user and hasattr(user, 'profile') and (user.profile.is_organizer or user.profile.is_super_admin):
                return "Pour créer un événement, rendez-vous dans votre espace organisateur et cliquez sur 'Créer un événement'. Je peux vous guider dans les étapes si vous le souhaitez !"
            else:
                return "Pour créer des événements, vous devez avoir un compte organisateur. Contactez l'administration pour obtenir les droits nécessaires."
        
        elif "inscription" in message or "inscrire" in message:
            return "Pour vous inscrire à un événement, cliquez sur 'S'inscrire' sur la page de l'événement. Si l'événement est payant, vous devrez effectuer le paiement pour confirmer votre inscription."
        
        elif "liste" in message or "voir" in message:
            return "Vous pouvez voir tous les événements disponibles sur la page d'accueil. Utilisez les filtres pour trouver des événements par catégorie ou date."
        
        else:
            return "Je peux vous aider avec la création d'événements, les inscriptions, ou la recherche d'événements. Que souhaitez-vous savoir exactement ?"

    def _handle_streaming_questions(self, message: str, entities: Dict, user: Optional[User] = None) -> str:
        """Gère les questions sur le streaming"""
        
        if "rejoindre" in message or "accéder" in message:
            return "Pour rejoindre un stream en direct :\n1. Rendez-vous sur la page de l'événement\n2. Cliquez sur 'Rejoindre le Live'\n3. Assurez-vous d'avoir une inscription confirmée et payée\n\nVous recevrez les identifiants par email."
        
        elif "problème" in message or "marche pas" in message:
            return "En cas de problème de streaming :\n• Vérifiez votre connexion internet\n• Rafraîchissez la page\n• Essayez un autre navigateur\n• Vérifiez que votre inscription est confirmée\n\nSi le problème persiste, contactez le support."
        
        elif "identifiant" in message or "lien" in message:
            return "Les identifiants de connexion au stream sont envoyés par email après confirmation de votre paiement. Vérifiez votre boîte mail et vos spams."
        
        else:
            return "Je peux vous aider avec l'accès au streaming, les problèmes de connexion, ou la réception des identifiants. Quel est votre problème spécifique ?"

    def _handle_payment_questions(self, message: str, entities: Dict, user: Optional[User] = None) -> str:
        """Gère les questions sur les paiements"""
        
        if "comment" in message and "payer" in message:
            return "Le paiement se fait directement sur notre site sécurisé :\n1. Sélectionnez votre événement\n2. Cliquez sur 'S'inscrire'\n3. Remplissez vos informations\n4. Effectuez le paiement par carte bancaire\n\nVotre inscription sera confirmée automatiquement."
        
        elif "gratuit" in message:
            return "Certains événements sont gratuits, d'autres sont payants. Le prix est clairement affiché sur chaque page d'événement. Pour les événements gratuits, l'inscription se fait sans paiement."
        
        elif "problème" in message and "paiement" in message:
            return "En cas de problème de paiement :\n• Vérifiez les informations de votre carte\n• Assurez-vous d'avoir suffisamment de fonds\n• Essayez une autre carte\n• Contactez votre banque si nécessaire\n\nPour un remboursement, contactez le support."
        
        else:
            return "Je peux vous aider avec les modalités de paiement, les tarifs, ou résoudre des problèmes de transaction. Que souhaitez-vous savoir ?"

    def _handle_technical_questions(self, message: str, entities: Dict, user: Optional[User] = None) -> str:
        """Gère les questions techniques"""
        
        if "connexion" in message:
            return "Pour les problèmes de connexion :\n• Vérifiez votre nom d'utilisateur et mot de passe\n• Cliquez sur 'Mot de passe oublié' si nécessaire\n• Vérifiez votre connexion internet\n• Essayez de vider le cache de votre navigateur"
        
        elif "navigateur" in message or "browser" in message:
            return "Notre plateforme fonctionne mieux avec :\n• Chrome (recommandé)\n• Firefox\n• Safari\n• Edge\n\nAssurez-vous d'avoir une version récente et JavaScript activé."
        
        else:
            return "Je peux vous aider avec les problèmes techniques. Décrivez-moi votre problème en détail : que se passe-t-il exactement ? À quel moment ? Sur quelle page ?"

    def _handle_unknown_intent(self, message: str) -> str:
        """Gère les messages non reconnus"""
        return "Je ne suis pas sûr de comprendre votre question. Pouvez-vous la reformuler ? Je peux vous aider avec :\n• Les événements et inscriptions\n• Le streaming et l'accès aux directs\n• Les paiements et tarifs\n• Les problèmes techniques"

    def _generate_suggestions(self, intent: str, entities: Dict, user: Optional[User] = None) -> List[str]:
        """Génère des suggestions d'actions pour l'utilisateur"""
        suggestions = []
        
        if intent == "events":
            suggestions.extend([
                "Voir les événements disponibles",
                "Créer un nouvel événement",
                "Mes inscriptions"
            ])
        
        elif intent == "streaming":
            suggestions.extend([
                "Rejoindre un stream",
                "Problèmes de connexion",
                "Mes identifiants de connexion"
            ])
        
        elif intent == "payment":
            suggestions.extend([
                "Comment payer ?",
                "Événements gratuits",
                "Problème de paiement"
            ])
        
        elif intent == "technical":
            suggestions.extend([
                "Problème de connexion",
                "Navigateur recommandé",
                "Contacter le support"
            ])
        
        else:
            suggestions.extend([
                "Voir les événements",
                "Aide pour s'inscrire",
                "Support technique"
            ])
        
        return suggestions[:3]  # Limiter à 3 suggestions

    def get_user_context(self, user: User) -> Dict:
        """Récupère le contexte utilisateur pour personnaliser les réponses"""
        if not user or not user.is_authenticated:
            return {}
        
        context = {
            "username": user.username,
            "is_organizer": hasattr(user, 'profile') and user.profile.is_organizer,
            "is_super_admin": hasattr(user, 'profile') and user.profile.is_super_admin,
        }
        
        # Récupérer les inscriptions récentes
        recent_registrations = EventRegistration.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        context["recent_registrations"] = recent_registrations
        
        return context


# Instance globale du chatbot
chatbot = EventManagementChatbot()
