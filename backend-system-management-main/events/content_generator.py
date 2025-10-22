"""
🎨 GÉNÉRATEUR AUTOMATIQUE DE CONTENU POUR ÉVÉNEMENTS
Service d'IA pour générer automatiquement :
- Descriptions d'événements
- Suggestions de visuels
- Hashtags optimisés
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from django.utils import timezone
from datetime import datetime

logger = logging.getLogger(__name__)

class EventContentGenerator:
    """
    Générateur automatique de contenu pour les événements
    Utilise des modèles pré-entraînés et des règles intelligentes
    """
    
    def __init__(self):
        """Initialise le générateur de contenu"""
        self.templates = self._load_templates()
        self.hashtag_database = self._load_hashtag_database()
        self.visual_suggestions = self._load_visual_suggestions()
        
    def _load_templates(self) -> Dict:
        """Charge les modèles de description par catégorie"""
        return {
            "Conférence": {
                "intro_patterns": [
                    "Découvrez {topic} lors de cette conférence exclusive",
                    "Une conférence passionnante sur {topic}",
                    "Plongez dans l'univers de {topic} avec nos experts",
                    "Une conférence incontournable sur {topic}"
                ],
                "content_patterns": [
                    "Nos intervenants partageront leur expertise et leur vision sur {topic}",
                    "Vous découvrirez les dernières tendances et innovations dans le domaine de {topic}",
                    "Un programme riche avec des présentations, des échanges et des networking",
                    "Une opportunité unique d'apprendre et de réseauter avec des professionnels"
                ],
                "outro_patterns": [
                    "Ne manquez pas cette conférence qui va transformer votre vision de {topic}",
                    "Inscrivez-vous dès maintenant pour cette conférence exceptionnelle",
                    "Une expérience enrichissante qui va marquer votre parcours professionnel"
                ]
            },
            "Concert": {
                "intro_patterns": [
                    "Vivez une expérience musicale unique avec {topic}",
                    "Un concert exceptionnel de {topic}",
                    "Laissez-vous porter par la musique de {topic}",
                    "Une soirée inoubliable avec {topic}"
                ],
                "content_patterns": [
                    "Une ambiance festive et conviviale vous attend",
                    "Découvrez des artistes talentueux dans un cadre intimiste",
                    "Une programmation musicale variée et de qualité",
                    "Partagez des moments de pure émotion musicale"
                ],
                "outro_patterns": [
                    "Réservez vos places pour cette soirée musicale exceptionnelle",
                    "Une expérience musicale qui restera gravée dans vos mémoires",
                    "Ne manquez pas ce concert qui va vous faire vibrer"
                ]
            },
            "Sport": {
                "intro_patterns": [
                    "Participez à une activité sportive passionnante : {topic}",
                    "Rejoignez-nous pour une session de {topic}",
                    "Une expérience sportive unique autour de {topic}",
                    "Défiez-vous avec {topic}"
                ],
                "content_patterns": [
                    "Une activité adaptée à tous les niveaux, débutants comme confirmés",
                    "Un encadrement professionnel pour progresser en toute sécurité",
                    "Une ambiance conviviale et motivante pour se dépasser",
                    "Des équipements de qualité pour une expérience optimale"
                ],
                "outro_patterns": [
                    "Inscrivez-vous pour cette activité sportive qui va vous faire du bien",
                    "Une expérience sportive qui va transformer votre quotidien",
                    "Rejoignez-nous pour cette aventure sportive exceptionnelle"
                ]
            },
            "Workshop": {
                "intro_patterns": [
                    "Apprenez {topic} lors de ce workshop pratique",
                    "Un workshop interactif sur {topic}",
                    "Développez vos compétences en {topic}",
                    "Une formation pratique sur {topic}"
                ],
                "content_patterns": [
                    "Un apprentissage par la pratique avec des exercices concrets",
                    "Des formateurs expérimentés pour vous accompagner",
                    "Un programme progressif adapté à votre niveau",
                    "Des supports de cours et des ressources complémentaires"
                ],
                "outro_patterns": [
                    "Inscrivez-vous à ce workshop qui va booster vos compétences",
                    "Une formation pratique qui va transformer votre approche",
                    "Ne manquez pas cette opportunité d'apprentissage unique"
                ]
            },
            "Meetup": {
                "intro_patterns": [
                    "Rejoignez notre communauté autour de {topic}",
                    "Un meetup convivial sur {topic}",
                    "Échangez avec des passionnés de {topic}",
                    "Une rencontre enrichissante sur {topic}"
                ],
                "content_patterns": [
                    "Un espace d'échange et de partage d'expériences",
                    "Des présentations courtes suivies de discussions",
                    "Une ambiance décontractée pour réseauter",
                    "Des sujets variés et des intervenants passionnés"
                ],
                "outro_patterns": [
                    "Rejoignez-nous pour ce meetup qui va enrichir votre réseau",
                    "Une rencontre qui va vous inspirer et vous motiver",
                    "Inscrivez-vous pour partager et apprendre ensemble"
                ]
            }
        }
        
    def _load_hashtag_database(self) -> Dict:
        """Charge la base de données des hashtags par catégorie"""
        return {
            "Conférence": [
                "#Conférence", "#Événement", "#Formation", "#Expertise", "#Innovation",
                "#Professionnel", "#Développement", "#Leadership", "#Stratégie", "#Business"
            ],
            "Concert": [
                "#Concert", "#Musique", "#Live", "#Artiste", "#Spectacle",
                "#Soirée", "#Ambiance", "#Culture", "#Divertissement", "#Émotion"
            ],
            "Sport": [
                "#Sport", "#Activité", "#Fitness", "#Bienêtre", "#Santé",
                "#Défis", "#Performance", "#Équipe", "#Motivation", "#Energie"
            ],
            "Workshop": [
                "#Workshop", "#Formation", "#Apprentissage", "#Pratique", "#Compétences",
                "#Développement", "#Formation", "#Expertise", "#Progression", "#Savoir"
            ],
            "Meetup": [
                "#Meetup", "#Communauté", "#Réseau", "#Partage", "#Échange",
                "#Passion", "#Inspiration", "#Collaboration", "#Innovation", "#Découverte"
            ]
        }
        
    def _load_visual_suggestions(self) -> Dict:
        """Charge les suggestions de visuels par type d'événement"""
        return {
            "Conférence": {
                "colors": ["#1976d2", "#0d47a1", "#1565c0", "#42a5f5"],
                "themes": ["professionnel", "corporate", "moderne", "élégant"],
                "elements": ["graphiques", "diagrammes", "icônes", "typographie"],
                "style": "épuré et professionnel"
            },
            "Concert": {
                "colors": ["#e91e63", "#c2185b", "#ad1457", "#f48fb1"],
                "themes": ["artistique", "créatif", "dynamique", "expressif"],
                "elements": ["instruments", "notes de musique", "gradients", "formes organiques"],
                "style": "créatif et énergique"
            },
            "Sport": {
                "colors": ["#4caf50", "#2e7d32", "#388e3c", "#81c784"],
                "themes": ["dynamique", "actif", "motivant", "énergique"],
                "elements": ["équipements sportifs", "mouvement", "défis", "performance"],
                "style": "dynamique et motivant"
            },
            "Workshop": {
                "colors": ["#ff9800", "#f57c00", "#ef6c00", "#ffb74d"],
                "themes": ["éducatif", "interactif", "pratique", "apprentissage"],
                "elements": ["outils", "processus", "collaboration", "progression"],
                "style": "éducatif et engageant"
            },
            "Meetup": {
                "colors": ["#9c27b0", "#7b1fa2", "#6a1b9a", "#ba68c8"],
                "themes": ["communautaire", "convivial", "partage", "réseau"],
                "elements": ["personnes", "connexions", "partage", "communauté"],
                "style": "convivial et communautaire"
            }
        }
    
    def generate_event_description(self, title: str, category: str, location: str, 
                                 price: float = 0, max_capacity: int = None) -> str:
        """
        Génère automatiquement une description d'événement
        
        Args:
            title: Titre de l'événement
            category: Catégorie de l'événement
            location: Lieu de l'événement
            price: Prix de l'événement
            max_capacity: Capacité maximale
            
        Returns:
            Description générée automatiquement
        """
        try:
            # Extraire le thème principal du titre
            topic = self._extract_topic_from_title(title)
            
            # Obtenir le template pour la catégorie
            category_template = self.templates.get(category, self.templates.get("Conférence", {}))
            
            # Générer la description
            description_parts = []
            
            # Introduction
            if category_template.get("intro_patterns"):
                intro = self._select_random_pattern(category_template["intro_patterns"])
                description_parts.append(intro.format(topic=topic))
            
            # Contenu principal
            if category_template.get("content_patterns"):
                content = self._select_random_pattern(category_template["content_patterns"])
                description_parts.append(content.format(topic=topic))
            
            # Informations pratiques
            practical_info = self._generate_practical_info(location, price, max_capacity)
            if practical_info:
                description_parts.append(practical_info)
            
            # Conclusion
            if category_template.get("outro_patterns"):
                outro = self._select_random_pattern(category_template["outro_patterns"])
                description_parts.append(outro.format(topic=topic))
            
            # Assembler la description
            description = " ".join(description_parts)
            
            # Nettoyer et formater
            description = self._clean_and_format_description(description)
            
            logger.info(f"Description générée pour l'événement '{title}': {len(description)} caractères")
            
            return description
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de description: {str(e)}")
            return f"Un événement passionnant sur {title} à {location}. Rejoignez-nous pour une expérience unique !"
    
    def generate_hashtags(self, title: str, category: str, description: str = None) -> List[str]:
        """
        Génère des hashtags optimisés pour la visibilité
        
        Args:
            title: Titre de l'événement
            category: Catégorie de l'événement
            description: Description de l'événement (optionnel)
            
        Returns:
            Liste de hashtags optimisés
        """
        try:
            hashtags = []
            
            # Hashtags de base par catégorie
            category_hashtags = self.hashtag_database.get(category, [])
            hashtags.extend(category_hashtags[:3])  # Prendre les 3 premiers
            
            # Hashtags spécifiques au titre
            title_keywords = self._extract_keywords_from_title(title)
            for keyword in title_keywords[:3]:  # Maximum 3 hashtags du titre
                hashtag = f"#{keyword.capitalize()}"
                if hashtag not in hashtags:
                    hashtags.append(hashtag)
            
            # Hashtags de localisation
            location_hashtags = self._generate_location_hashtags(title)
            hashtags.extend(location_hashtags[:2])  # Maximum 2 hashtags de localisation
            
            # Hashtags de description si disponible
            if description:
                desc_keywords = self._extract_keywords_from_description(description)
                for keyword in desc_keywords[:2]:  # Maximum 2 hashtags de la description
                    hashtag = f"#{keyword.capitalize()}"
                    if hashtag not in hashtags and len(hashtag) <= 20:  # Limiter la longueur
                        hashtags.append(hashtag)
            
            # Hashtags génériques populaires
            generic_hashtags = ["#Événement", "#Découverte", "#Expérience", "#Incontournable"]
            for hashtag in generic_hashtags:
                if len(hashtags) < 10:  # Maximum 10 hashtags au total
                    hashtags.append(hashtag)
            
            # Nettoyer et limiter
            hashtags = hashtags[:10]  # Maximum 10 hashtags
            hashtags = [self._clean_hashtag(hashtag) for hashtag in hashtags]
            
            logger.info(f"Hashtags générés pour '{title}': {len(hashtags)} hashtags")
            
            return hashtags
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des hashtags: {str(e)}")
            return ["#Événement", "#Découverte"]
    
    def generate_visual_suggestions(self, category: str, title: str, description: str = None) -> Dict:
        """
        Génère des suggestions de visuels basées sur le contenu
        
        Args:
            category: Catégorie de l'événement
            title: Titre de l'événement
            description: Description de l'événement (optionnel)
            
        Returns:
            Suggestions de visuels (couleurs, thèmes, éléments)
        """
        try:
            # Obtenir les suggestions de base pour la catégorie
            base_suggestions = self.visual_suggestions.get(category, {})
            
            # Analyser le titre pour des suggestions personnalisées
            title_analysis = self._analyze_title_for_visuals(title)
            
            # Analyser la description si disponible
            desc_analysis = {}
            if description:
                desc_analysis = self._analyze_description_for_visuals(description)
            
            # Combiner toutes les suggestions
            suggestions = {
                "colors": base_suggestions.get("colors", ["#1976d2", "#42a5f5"]),
                "themes": base_suggestions.get("themes", ["moderne", "professionnel"]),
                "elements": base_suggestions.get("elements", ["icônes", "typographie"]),
                "style": base_suggestions.get("style", "moderne et élégant"),
                "personalized": {
                    "title_insights": title_analysis,
                    "description_insights": desc_analysis
                },
                "recommendations": self._generate_visual_recommendations(
                    category, title_analysis, desc_analysis
                )
            }
            
            logger.info(f"Suggestions visuelles générées pour '{title}'")
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des suggestions visuelles: {str(e)}")
            return {
                "colors": ["#1976d2", "#42a5f5"],
                "themes": ["moderne", "professionnel"],
                "elements": ["icônes", "typographie"],
                "style": "moderne et élégant",
                "personalized": {},
                "recommendations": ["Utilisez un design épuré et professionnel"]
            }
    
    def _extract_topic_from_title(self, title: str) -> str:
        """Extrait le thème principal du titre"""
        # Mots à ignorer
        stop_words = ["le", "la", "les", "un", "une", "des", "et", "ou", "avec", "pour", "sur", "dans", "à", "de"]
        
        # Nettoyer le titre
        clean_title = re.sub(r'[^\w\s]', ' ', title.lower())
        words = [word for word in clean_title.split() if word not in stop_words and len(word) > 2]
        
        # Retourner le premier mot significatif ou le titre complet
        return words[0].capitalize() if words else title[:20]
    
    def _select_random_pattern(self, patterns: List[str]) -> str:
        """Sélectionne un pattern aléatoire"""
        import random
        return random.choice(patterns)
    
    def _generate_practical_info(self, location: str, price: float, max_capacity: int) -> str:
        """Génère les informations pratiques"""
        info_parts = []
        
        if location:
            info_parts.append(f"Lieu : {location}")
        
        if price == 0:
            info_parts.append("Entrée gratuite")
        elif price > 0:
            info_parts.append(f"Prix : {price}€")
        
        if max_capacity:
            info_parts.append(f"Places limitées : {max_capacity} participants")
        
        if info_parts:
            return " ".join(info_parts) + "."
        
        return ""
    
    def _clean_and_format_description(self, description: str) -> str:
        """Nettoie et formate la description"""
        # Supprimer les espaces multiples
        description = re.sub(r'\s+', ' ', description)
        
        # Capitaliser la première lettre
        description = description.strip().capitalize()
        
        # Ajouter un point final si nécessaire
        if not description.endswith(('.', '!', '?')):
            description += "."
        
        return description
    
    def _extract_keywords_from_title(self, title: str) -> List[str]:
        """Extrait les mots-clés du titre"""
        # Nettoyer et extraire les mots significatifs
        clean_title = re.sub(r'[^\w\s]', ' ', title.lower())
        words = clean_title.split()
        
        # Filtrer les mots courts et les mots communs
        stop_words = ["le", "la", "les", "un", "une", "des", "et", "ou", "avec", "pour", "sur", "dans", "à", "de", "du"]
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return keywords[:5]  # Maximum 5 mots-clés
    
    def _generate_location_hashtags(self, title: str) -> List[str]:
        """Génère des hashtags de localisation"""
        # Mots de localisation courants
        location_words = ["montreal", "lomé", "paris", "lyon", "marseille", "london", "newyork"]
        
        hashtags = []
        title_lower = title.lower()
        
        for location in location_words:
            if location in title_lower:
                hashtags.append(f"#{location.capitalize()}")
        
        return hashtags
    
    def _extract_keywords_from_description(self, description: str) -> List[str]:
        """Extrait les mots-clés de la description"""
        # Nettoyer la description
        clean_desc = re.sub(r'[^\w\s]', ' ', description.lower())
        words = clean_desc.split()
        
        # Filtrer les mots communs
        stop_words = ["le", "la", "les", "un", "une", "des", "et", "ou", "avec", "pour", "sur", "dans", "à", "de", "du", "ce", "cette", "ces", "qui", "que", "quoi", "comment", "quand", "où", "pourquoi"]
        keywords = [word for word in words if word not in stop_words and len(word) > 3]
        
        return keywords[:3]  # Maximum 3 mots-clés
    
    def _clean_hashtag(self, hashtag: str) -> str:
        """Nettoie un hashtag"""
        # Supprimer les caractères spéciaux
        clean = re.sub(r'[^\w#]', '', hashtag)
        
        # S'assurer qu'il commence par #
        if not clean.startswith('#'):
            clean = '#' + clean
        
        return clean
    
    def _analyze_title_for_visuals(self, title: str) -> Dict:
        """Analyse le titre pour des suggestions visuelles"""
        analysis = {
            "mood": "neutre",
            "intensity": "modérée",
            "keywords": []
        }
        
        title_lower = title.lower()
        
        # Analyser l'ambiance
        if any(word in title_lower for word in ["festival", "célébration", "fête", "carnaval"]):
            analysis["mood"] = "festif"
            analysis["intensity"] = "élevée"
        elif any(word in title_lower for word in ["calme", "zen", "méditation", "relaxation"]):
            analysis["mood"] = "apaisant"
            analysis["intensity"] = "faible"
        elif any(word in title_lower for word in ["dynamique", "énergie", "puissance", "force"]):
            analysis["mood"] = "énergique"
            analysis["intensity"] = "élevée"
        
        # Extraire les mots-clés visuels
        visual_keywords = ["couleur", "lumière", "ombre", "forme", "texture", "espace"]
        analysis["keywords"] = [word for word in visual_keywords if word in title_lower]
        
        return analysis
    
    def _analyze_description_for_visuals(self, description: str) -> Dict:
        """Analyse la description pour des suggestions visuelles"""
        analysis = {
            "emotions": [],
            "concepts": [],
            "visual_elements": []
        }
        
        if not description:
            return analysis
            
        desc_lower = description.lower()
        
        # Émotions
        emotions = ["passion", "joie", "excitation", "sérénité", "mystère", "aventure"]
        analysis["emotions"] = [emotion for emotion in emotions if emotion in desc_lower]
        
        # Concepts
        concepts = ["innovation", "tradition", "modernité", "authenticité", "excellence", "créativité"]
        analysis["concepts"] = [concept for concept in concepts if concept in desc_lower]
        
        # Éléments visuels
        visual_elements = ["couleurs", "formes", "lignes", "espaces", "textures", "mouvements"]
        analysis["visual_elements"] = [element for element in visual_elements if element in desc_lower]
        
        return analysis
    
    def _generate_visual_recommendations(self, category: str, title_analysis: Dict, desc_analysis: Dict) -> List[str]:
        """Génère des recommandations visuelles personnalisées"""
        recommendations = []
        
        # Recommandations basées sur la catégorie
        if category == "Concert":
            recommendations.append("Utilisez des couleurs vives et des formes dynamiques")
            recommendations.append("Intégrez des éléments musicaux dans le design")
        elif category == "Conférence":
            recommendations.append("Privilégiez un design épuré et professionnel")
            recommendations.append("Utilisez une typographie claire et lisible")
        elif category == "Sport":
            recommendations.append("Choisissez des couleurs énergiques et motivantes")
            recommendations.append("Intégrez des éléments de mouvement et de dynamisme")
        
        # Recommandations basées sur l'analyse du titre
        if title_analysis["mood"] == "festif":
            recommendations.append("Adoptez une palette de couleurs festive et joyeuse")
        elif title_analysis["mood"] == "apaisant":
            recommendations.append("Utilisez des couleurs douces et apaisantes")
        elif title_analysis["mood"] == "énergique":
            recommendations.append("Privilégiez des contrastes forts et des couleurs vives")
        
        # Recommandations basées sur l'analyse de la description
        if desc_analysis["emotions"]:
            recommendations.append(f"Traduisez l'émotion '{desc_analysis['emotions'][0]}' dans le design")
        
        if desc_analysis["concepts"]:
            recommendations.append(f"Représentez le concept '{desc_analysis['concepts'][0]}' visuellement")
        
        return recommendations[:5]  # Maximum 5 recommandations

def get_content_generator():
    """Retourne une instance du générateur de contenu"""
    return EventContentGenerator()
