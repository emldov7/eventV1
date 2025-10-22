"""
🤖 GÉNÉRATEUR DE CONTENU IA AVANCÉ
Utilise de vrais modèles IA (Mistral/Claude) et s'intègre avec le système de prédiction
"""

import logging
import os
from typing import Dict, List, Optional
from django.conf import settings
import anthropic
try:
    from mistralai.client import MistralClient
    from mistralai.models.chat_completion import ChatMessage
    MISTRAL_AVAILABLE = True
except ImportError:
    MISTRAL_AVAILABLE = False
    MistralClient = None
    ChatMessage = None

logger = logging.getLogger(__name__)

class AIContentGenerator:
    """
    Générateur de contenu utilisant de vrais modèles IA
    S'intègre avec le système de prédiction existant
    """
    
    def __init__(self):
        """Initialise le générateur IA avec les modèles disponibles"""
        self.anthropic_client = None
        self.mistral_client = None
        self.openai_client = None
        
        # Initialiser les clients IA selon les clés disponibles
        self._initialize_ai_clients()
        
        # Modèle par défaut (priorité : Mistral > Claude > OpenAI)
        self.default_model = self._get_default_model()
        
    def _initialize_ai_clients(self):
        """Initialise les clients IA selon les clés API disponibles"""
        try:
            # Claude (Anthropic) - Priorité 1
            if os.getenv('ANTHROPIC_API_KEY'):
                self.anthropic_client = anthropic.Anthropic(
                    api_key=os.getenv('ANTHROPIC_API_KEY')
                )
                logger.info("✅ Client Claude (Anthropic) initialisé")
            
            # Mistral AI - Priorité 2
            if os.getenv('MISTRAL_API_KEY') and MISTRAL_AVAILABLE:
                try:
                    self.mistral_client = MistralClient(
                        api_key=os.getenv('MISTRAL_API_KEY')
                    )
                    logger.info("✅ Client Mistral AI initialisé")
                except Exception as e:
                    logger.error(f"❌ Erreur initialisation Mistral: {str(e)}")
                    self.mistral_client = None
            elif os.getenv('MISTRAL_API_KEY') and not MISTRAL_AVAILABLE:
                logger.warning("⚠️ Clé Mistral configurée mais package non installé")
            
            # OpenAI - Priorité 3
            if os.getenv('OPENAI_API_KEY'):
                import openai
                openai.api_key = os.getenv('OPENAI_API_KEY')
                self.openai_client = openai
                logger.info("✅ Client OpenAI initialisé")
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'initialisation des clients IA: {str(e)}")
    
    def _get_default_model(self) -> str:
        """Détermine le modèle IA par défaut disponible"""
        if self.mistral_client:
            return "mistral"
        elif self.anthropic_client:
            return "claude"
        elif self.openai_client:
            return "openai"
        else:
            return "none"
    
    def generate_event_description(self, title: str, category: str, location: str, 
                                 price: float = 0, max_capacity: int = None,
                                 prediction_data: Dict = None) -> str:
        """
        Génère une description d'événement avec de l'IA
        
        Args:
            title: Titre de l'événement
            category: Catégorie de l'événement
            location: Lieu de l'événement
            price: Prix de l'événement
            max_capacity: Capacité maximale
            prediction_data: Données de prédiction du système existant
            
        Returns:
            Description générée par l'IA
        """
        try:
            if self.default_model == "none":
                logger.warning("⚠️ Aucun modèle IA disponible, utilisation du fallback")
                return self._generate_fallback_description(title, category, location, price, max_capacity)
            
            # Construire le prompt intelligent
            prompt = self._build_smart_prompt(
                title, category, location, price, max_capacity, prediction_data
            )
            
            # Générer avec le modèle IA
            if self.default_model == "claude":
                return self._generate_with_claude(prompt)
            elif self.default_model == "mistral":
                return self._generate_with_mistral(prompt)
            elif self.default_model == "openai":
                return self._generate_with_openai(prompt)
            else:
                return self._generate_fallback_description(title, category, location, price, max_capacity)
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de la génération IA: {str(e)}")
            return self._generate_fallback_description(title, category, location, price, max_capacity)
    
    def generate_hashtags(self, title: str, category: str, description: str = None,
                          prediction_data: Dict = None) -> List[str]:
        """
        Génère des hashtags optimisés avec l'IA
        
        Args:
            title: Titre de l'événement
            category: Catégorie de l'événement
            description: Description de l'événement
            prediction_data: Données de prédiction
            
        Returns:
            Liste de hashtags optimisés
        """
        try:
            if self.default_model == "none":
                return self._generate_fallback_hashtags(title, category)
            
            # Construire le prompt pour les hashtags
            hashtag_prompt = self._build_hashtag_prompt(
                title, category, description, prediction_data
            )
            
            # Générer avec le modèle IA
            if self.default_model == "claude":
                hashtags_text = self._generate_with_claude(hashtag_prompt)
            elif self.default_model == "mistral":
                hashtags_text = self._generate_with_mistral(hashtag_prompt)
            elif self.default_model == "openai":
                hashtags_text = self._generate_with_openai(hashtag_prompt)
            else:
                return self._generate_fallback_hashtags(title, category)
            
            # Parser la réponse de l'IA
            return self._parse_hashtags_response(hashtags_text)
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la génération de hashtags IA: {str(e)}")
            return self._generate_fallback_hashtags(title, category)
    
    def generate_visual_suggestions(self, category: str, title: str, description: str = None,
                                   prediction_data: Dict = None) -> Dict:
        """
        Génère des suggestions visuelles avec l'IA
        
        Args:
            category: Catégorie de l'événement
            title: Titre de l'événement
            description: Description de l'événement
            prediction_data: Données de prédiction
            
        Returns:
            Suggestions visuelles générées par l'IA
        """
        try:
            if self.default_model == "none":
                return self._generate_fallback_visual_suggestions(category)
            
            # Construire le prompt pour les suggestions visuelles
            visual_prompt = self._build_visual_prompt(
                category, title, description, prediction_data
            )
            
            # Générer avec le modèle IA
            if self.default_model == "claude":
                visual_text = self._generate_with_claude(visual_prompt)
            elif self.default_model == "mistral":
                visual_text = self._generate_with_mistral(visual_prompt)
            elif self.default_model == "openai":
                visual_text = self._generate_with_openai(visual_prompt)
            else:
                return self._generate_fallback_visual_suggestions(category)
            
            # Parser la réponse de l'IA
            return self._parse_visual_response(visual_text)
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la génération de suggestions visuelles IA: {str(e)}")
            return self._generate_fallback_visual_suggestions(category)
    
    def _build_smart_prompt(self, title: str, category: str, location: str, 
                           price: float, max_capacity: int, prediction_data: Dict = None) -> str:
        """Construit un prompt intelligent pour l'IA"""
        
        # Base du prompt
        prompt = f"""
Tu es un expert en marketing d'événements et en copywriting français. 
Crée une description captivante et professionnelle pour l'événement suivant :

📋 INFORMATIONS DE BASE :
- Titre : {title}
- Catégorie : {category}
- Lieu : {location}
- Prix : {price}€ {'(Gratuit)' if price == 0 else ''}
- Capacité : {max_capacity if max_capacity else 'Illimitée'} participants

🎯 OBJECTIFS :
- Description engageante et professionnelle
- Optimisée pour la conversion (inscriptions)
- Ton adapté à la catégorie {category}
- En français naturel et fluide
- Longueur : 150-200 mots
- Structure : Accroche + Contenu + Call-to-action

"""
        
        # Ajouter les données de prédiction si disponibles
        if prediction_data:
            prompt += f"""
🚀 DONNÉES D'INTELLIGENCE ARTIFICIELLE (de notre système de prédiction) :
- Taux de remplissage prévu : {prediction_data.get('predicted_fill_rate', 'N/A')}%
- Prix optimal recommandé : {prediction_data.get('optimal_price', 'N/A')}€
- Tendances détectées : {prediction_data.get('trends', 'N/A')}
- Recommandations : {prediction_data.get('recommendations', 'N/A')}

Utilise ces insights pour créer une description encore plus persuasive !
"""
        
        prompt += f"""
💡 CONSEILS SPÉCIFIQUES POUR {category.upper()} :
"""
        
        # Conseils spécifiques par catégorie
        category_tips = {
            "Conférence": "Mettez l'accent sur l'expertise, l'apprentissage et le networking professionnel",
            "Concert": "Créez une ambiance festive, évoquez les émotions et l'expérience musicale",
            "Sport": "Soulignez la motivation, le dépassement de soi et l'énergie",
            "Workshop": "Insistez sur l'apprentissage pratique, les compétences acquises et l'interactivité",
            "Meetup": "Mettez l'accent sur la communauté, le partage et les échanges"
        }
        
        prompt += category_tips.get(category, "Créez une description engageante et professionnelle")
        
        prompt += """

🎨 STYLE ET TON :
- Professionnel mais accessible
- Utilise des verbes d'action
- Crée de l'urgence et de l'exclusivité
- Termine par un call-to-action clair

Génère maintenant la description en français :
"""
        
        return prompt
    
    def _build_hashtag_prompt(self, title: str, category: str, description: str = None,
                              prediction_data: Dict = None) -> str:
        """Construit un prompt pour la génération de hashtags"""
        
        prompt = f"""
Tu es un expert en marketing digital et réseaux sociaux.

Génère 8-10 hashtags optimisés pour l'événement suivant :

📋 ÉVÉNEMENT :
- Titre : {title}
- Catégorie : {category}
- Description : {description[:200] + '...' if description and len(description) > 200 else description or 'Non fournie'}

🎯 OBJECTIFS :
- Hashtags populaires et recherchés
- Optimisés pour la visibilité sur Instagram, LinkedIn, Twitter
- Mélange de hashtags génériques et spécifiques
- Maximum 10 hashtags
- Format : #Hashtag (sans espaces)

💡 EXEMPLES POUR {category} :
- Hashtags de catégorie (#{category}, #Événement, etc.)
- Hashtags de localisation (#{title.split()[0] if title else 'Ville'})
- Hashtags de tendance (#Innovation, #Découverte, etc.)

Génère maintenant les hashtags (un par ligne, format #Hashtag) :
"""
        
        return prompt
    
    def _build_visual_prompt(self, category: str, title: str, description: str = None,
                             prediction_data: Dict = None) -> str:
        """Construit un prompt pour les suggestions visuelles"""
        
        prompt = f"""
Tu es un expert en design et marketing visuel.

Génère des suggestions visuelles pour l'événement suivant :

📋 ÉVÉNEMENT :
- Titre : {title}
- Catégorie : {category}
- Description : {description[:200] + '...' if description and len(description) > 200 else description or 'Non fournie'}

🎨 SUGGESTIONS DEMANDÉES :
1. Palette de couleurs (codes hexadécimaux)
2. Thèmes visuels
3. Éléments de design
4. Style recommandé
5. Recommandations personnalisées

📊 FORMAT DE RÉPONSE (JSON) :
{{
    "colors": ["#code1", "#code2", "#code3"],
    "themes": ["thème1", "thème2", "thème3"],
    "elements": ["élément1", "élément2", "élément3"],
    "style": "description du style",
    "recommendations": ["recommandation1", "recommandation2"]
}}

💡 CONSEILS POUR {category.upper()} :
- Adapte les couleurs à l'ambiance de la catégorie
- Suggère des éléments visuels cohérents
- Donne des recommandations pratiques

Génère maintenant les suggestions au format JSON :
"""
        
        return prompt
    
    def _generate_with_claude(self, prompt: str) -> str:
        """Génère du contenu avec Claude (Anthropic)"""
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"❌ Erreur Claude: {str(e)}")
            raise
    
    def _generate_with_mistral(self, prompt: str) -> str:
        """Génère du contenu avec Mistral AI"""
        try:
            messages = [ChatMessage(role="user", content=prompt)]
            response = self.mistral_client.chat(
                model="mistral-large-latest",
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"❌ Erreur Mistral: {str(e)}")
            raise
    
    def _generate_with_openai(self, prompt: str) -> str:
        """Génère du contenu avec OpenAI"""
        try:
            response = self.openai_client.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"❌ Erreur OpenAI: {str(e)}")
            raise
    
    def _parse_hashtags_response(self, response: str) -> List[str]:
        """Parse la réponse de l'IA pour extraire les hashtags"""
        try:
            # Nettoyer la réponse
            lines = response.strip().split('\n')
            hashtags = []
            
            for line in lines:
                line = line.strip()
                if line.startswith('#'):
                    # Nettoyer le hashtag
                    hashtag = line.split()[0]  # Prendre le premier mot
                    if len(hashtag) <= 30:  # Limiter la longueur
                        hashtags.append(hashtag)
                elif '#' in line:
                    # Chercher les hashtags dans la ligne
                    words = line.split()
                    for word in words:
                        if word.startswith('#') and len(word) <= 30:
                            hashtags.append(word)
            
            # Limiter à 10 hashtags et ajouter des hashtags par défaut si nécessaire
            if len(hashtags) < 5:
                default_hashtags = ["#Événement", "#Découverte", "#Expérience"]
                hashtags.extend(default_hashtags)
            
            return hashtags[:10]
            
        except Exception as e:
            logger.error(f"❌ Erreur parsing hashtags: {str(e)}")
            return ["#Événement", "#Découverte", "#Expérience"]
    
    def _parse_visual_response(self, response: str) -> Dict:
        """Parse la réponse de l'IA pour extraire les suggestions visuelles"""
        try:
            # Essayer de parser le JSON
            import json
            import re
            
            # Chercher du JSON dans la réponse
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    return {
                        "colors": data.get("colors", ["#1976d2", "#42a5f5"]),
                        "themes": data.get("themes", ["moderne", "professionnel"]),
                        "elements": data.get("elements", ["icônes", "typographie"]),
                        "style": data.get("style", "moderne et élégant"),
                        "recommendations": data.get("recommendations", ["Utilisez un design épuré"])
                    }
                except json.JSONDecodeError:
                    pass
            
            # Fallback si pas de JSON valide
            return self._generate_fallback_visual_suggestions("Conférence")
            
        except Exception as e:
            logger.error(f"❌ Erreur parsing suggestions visuelles: {str(e)}")
            return self._generate_fallback_visual_suggestions("Conférence")
    
    def _generate_fallback_description(self, title: str, category: str, location: str, 
                                    price: float, max_capacity: int) -> str:
        """Génère une description de fallback si l'IA n'est pas disponible"""
        return f"Un événement passionnant sur {title} à {location}. Rejoignez-nous pour une expérience unique !"
    
    def _generate_fallback_hashtags(self, title: str, category: str) -> List[str]:
        """Génère des hashtags de fallback"""
        return ["#Événement", "#Découverte", "#Expérience", "#Incontournable"]
    
    def _generate_fallback_visual_suggestions(self, category: str) -> Dict:
        """Génère des suggestions visuelles de fallback"""
        return {
            "colors": ["#1976d2", "#42a5f5"],
            "themes": ["moderne", "professionnel"],
            "elements": ["icônes", "typographie"],
            "style": "moderne et élégant",
            "recommendations": ["Utilisez un design épuré et professionnel"]
        }

def get_ai_content_generator():
    """Retourne une instance du générateur de contenu IA"""
    return AIContentGenerator()
