import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaRobot, FaTimes, FaPaperPlane, FaLightbulb, FaComments, FaBrain, FaCog } from 'react-icons/fa';
import { MdSmartToy } from 'react-icons/md';
import './AIChatbotWidget.css';
import { generateAIResponse, isAIEnabled } from '../services/aiService';
import { AI_CONFIG, validateAIConfig } from '../config/aiConfig';

const AIChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking'); // 'checking', 'enabled', 'disabled', 'error'
  const [aiConfig, setAiConfig] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 🔗 RÉCUPÉRATION DU TYPE D'UTILISATEUR DEPUIS REDUX
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // 🎯 DÉTECTION DU TYPE D'UTILISATEUR CONNECTÉ
  const getUserType = () => {
    try {
      if (!isAuthenticated || !user) {
        console.log('🎯 Utilisateur non connecté, type par défaut: participant');
        return 'participant';
      }

      // Détection basée sur le profil utilisateur
      let userType = 'participant'; // Par défaut

      if (user.is_superuser) {
        userType = 'super_admin';
      } else if (user.profile && user.profile.role) {
        userType = user.profile.role;
      } else if (user.is_staff) {
        userType = 'organizer';
      }

      console.log('🎯 Type utilisateur détecté depuis Redux:', userType);
      console.log('👤 Détails utilisateur:', {
        id: user.id,
        username: user.username,
        is_superuser: user.is_superuser,
        is_staff: user.is_staff,
        profile_role: user.profile?.role
      });

      return userType;
    } catch (error) {
      console.error('❌ Erreur détection type utilisateur:', error);
      return 'participant';
    }
  };

  // 💡 SUGGESTIONS PERSONNALISÉES SELON LE TYPE D'UTILISATEUR
  const getPersonalizedSuggestions = (userType) => {
    switch(userType) {
      case 'super_admin':
        return [
          "Gérer tous les événements",
          "Voir les statistiques globales", 
          "Modérer les utilisateurs",
          "Configuration système"
        ];
      case 'organizer':
        return [
          "Créer un nouvel événement",
          "Configurer le streaming",
          "Voir mes événements",
          "Gérer les inscriptions"
        ];
      case 'participant':
      default:
        return [
          "Comment m'inscrire à un événement ?",
          "Y a-t-il des événements gratuits ?",
          "Comment rejoindre un stream ?",
          "Support technique"
        ];
    }
  };

  // Messages d'accueil personnalisés
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userType = getUserType();
      let welcomeMessage = "Bonjour ! Je suis votre assistant IA personnalisé pour les événements. 🤖\n\nComment puis-je vous aider aujourd'hui ?";
      
      // Personnaliser le message selon le type d'utilisateur
      if (userType === 'super_admin') {
        welcomeMessage = "Bonjour Super Admin ! 👑 Je suis votre assistant IA pour la gestion globale des événements.\n\nComment puis-je vous aider aujourd'hui ?";
      } else if (userType === 'organizer') {
        welcomeMessage = "Bonjour Organisateur ! 🎯 Je suis votre assistant IA pour la création et gestion d'événements.\n\nComment puis-je vous aider aujourd'hui ?";
      } else if (userType === 'participant') {
        welcomeMessage = "Bonjour ! 👤 Je suis votre assistant IA pour vous aider avec les événements.\n\nComment puis-je vous aider aujourd'hui ?";
      }

      setMessages([
        {
          id: 1,
          type: 'ai',
          content: welcomeMessage,
          timestamp: new Date(),
          intent: 'greetings'
        }
      ]);
      loadSuggestions();
    }
  }, [isOpen, user, isAuthenticated]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Charger les suggestions personnalisées
  const loadSuggestions = async () => {
    try {
      const userType = getUserType();
      const personalizedSuggestions = getPersonalizedSuggestions(userType);
      setSuggestions(personalizedSuggestions);
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  // 🔄 RECHARGER LES SUGGESTIONS QUAND L'UTILISATEUR CHANGE
  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [user, isAuthenticated, isOpen]);
  
  // 🤖 VÉRIFIER LE STATUT DE L'IA AU CHARGEMENT
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        console.log('🔍 Vérification du statut IA...');
        
        // Vérifier la configuration
        const configValidation = validateAIConfig();
        setAiConfig(AI_CONFIG);
        
        if (configValidation.isValid && isAIEnabled()) {
          setAiStatus('enabled');
          console.log('✅ IA activée et configurée');
        } else {
          setAiStatus('disabled');
          console.log('⚠️ IA désactivée - Fallback activé');
          if (configValidation.errors.length > 0) {
            console.log('❌ Erreurs de configuration:', configValidation.errors);
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification IA:', error);
        setAiStatus('error');
      }
    };
    
    checkAIStatus();
  }, []);

  // Envoyer un message
  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 🤖 UTILISER L'IA RÉELLE AU LIEU DE LA SIMULATION !
      const aiResponse = await generateAIResponse(message, getUserType(), messages);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date(),
        intent: aiResponse.intent,
        suggestions: aiResponse.suggestions,
        isRealAI: aiResponse.isRealAI || false
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (aiResponse.suggestions) {
        setSuggestions(aiResponse.suggestions);
      }
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Désolé, je rencontre une difficulté technique. Pouvez-vous réessayer ?",
        timestamp: new Date(),
        intent: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🤖 GÉNÉRER UNE RÉPONSE INTELLIGENTE PERSONNALISÉE
  const generateMockResponse = async (message) => {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const messageLower = message.toLowerCase();
    const userType = getUserType();
    
    console.log('🤖 Message reçu:', message);
    console.log('👤 Type utilisateur:', userType);
    
    // ===============================
    // 🎉 DÉTECTION D'INTENTIONS AMÉLIORÉE
    // ===============================
    
    // SALUTATIONS PERSONNALISÉES
    if (messageLower.includes('bonjour') || messageLower.includes('salut') || messageLower.includes('hello')) {
      const personalizedGreeting = userType === 'super_admin' ? 
        "Bonjour Super Admin ! 👑 Je suis votre assistant IA pour la gestion globale des événements." :
        userType === 'organizer' ? 
        "Bonjour Organisateur ! 🎯 Je suis votre assistant IA pour la création et gestion d'événements." :
        "Bonjour ! 👤 Je suis votre assistant IA pour vous aider avec les événements.";
      
      return {
        response: `${personalizedGreeting}\n\nComment puis-je vous aider aujourd'hui ?`,
        intent: 'greetings',
        suggestions: getPersonalizedSuggestions(userType)
      };
    }
    
    // 🎯 GESTION DES SUGGESTIONS CLIQUÉES - NOUVEAU !
    // Modérer les utilisateurs
    if (messageLower.includes('modérer') || messageLower.includes('modération') || messageLower.includes('utilisateurs')) {
      if (userType === 'super_admin') {
        return {
          response: "👑 **Modération des Utilisateurs - Super Admin**\n\n🔍 **Actions disponibles :**\n• Voir tous les utilisateurs\n• Suspendre un compte\n• Changer le rôle d'un utilisateur\n• Supprimer un compte\n\n📋 **Comment procéder :**\n1. Allez dans 'Gestion Utilisateurs'\n2. Sélectionnez l'utilisateur\n3. Choisissez l'action\n4. Confirmez la modification\n\n⚠️ **Attention :** Ces actions sont irréversibles !",
          intent: 'moderation',
          suggestions: ["Voir tous les utilisateurs", "Gérer les rôles", "Statistiques utilisateurs"]
        };
      }
    }
    
    // Voir les statistiques globales
    if (messageLower.includes('statistiques') || messageLower.includes('stats') || messageLower.includes('globales')) {
      if (userType === 'super_admin') {
        return {
          response: "📊 **Statistiques Globales - Super Admin**\n\n📈 **Vue d'ensemble :**\n• Nombre total d'utilisateurs\n• Événements créés ce mois\n• Revenus générés\n• Taux de participation\n\n📅 **Périodes disponibles :**\n• Aujourd'hui\n• Cette semaine\n• Ce mois\n• Cette année\n\n📊 **Accès :**\n1. Allez dans 'Tableau de Bord'\n2. Section 'Statistiques Globales'\n3. Choisissez la période\n4. Exportez en PDF si besoin",
          intent: 'statistics',
          suggestions: ["Exporter les stats", "Comparer les périodes", "Alertes automatiques"]
        };
      }
    }
    
    // Gérer tous les événements
    if (messageLower.includes('gérer') && messageLower.includes('événements')) {
      if (userType === 'super_admin') {
        return {
          response: "🎯 **Gestion Globale des Événements - Super Admin**\n\n🌍 **Actions disponibles :**\n• Voir tous les événements\n• Modérer un événement\n• Supprimer un événement\n• Changer l'organisateur\n• Approuver/rejeter\n\n📋 **Processus de modération :**\n1. Allez dans 'Modération Événements'\n2. Filtrez par statut\n3. Examinez les détails\n4. Prenez une décision\n5. Notifiez l'organisateur\n\n⚡ **Filtres rapides :**\n• En attente d'approbation\n• Signalés\n• Contenu inapproprié",
          intent: 'event_management',
          suggestions: ["Événements en attente", "Événements signalés", "Historique des actions"]
        };
      }
    }
    
    // Configuration système
    if (messageLower.includes('configuration') || messageLower.includes('système') || messageLower.includes('config')) {
      if (userType === 'super_admin') {
        return {
          response: "⚙️ **Configuration Système - Super Admin**\n\n🔧 **Paramètres disponibles :**\n• Limites d'événements\n• Paramètres de paiement\n• Configuration email\n• Sécurité et permissions\n• Intégrations API\n\n📝 **Comment configurer :**\n1. Allez dans 'Paramètres Système'\n2. Choisissez la section\n3. Modifiez les valeurs\n4. Sauvegardez\n5. Redémarrez si nécessaire\n\n⚠️ **Important :** Certains changements nécessitent un redémarrage !",
          intent: 'system_config',
          suggestions: ["Paramètres de sécurité", "Configuration email", "Sauvegarde système"]
        };
      }
    } 
    
    // 🎉 ÉVÉNEMENTS GRATUITS - NOUVELLE DÉTECTION PERFECTIONNÉE !
    else if (messageLower.includes('gratuit') || messageLower.includes('gratuits') || 
             messageLower.includes('pas cher') || messageLower.includes('prix') ||
             messageLower.includes('cette semaine') || messageLower.includes('semaine') ||
             messageLower.includes('gratuitement') || messageLower.includes('free')) {
      return {
        response: "Oui, il y a des événements gratuits ! 🎉\n\n📅 **Cette semaine :**\n• Conférence Tech gratuite (Mercredi)\n• Atelier créatif (Samedi)\n• Meetup développeurs (Dimanche)\n\n💡 **Comment les trouver :**\n1. Allez sur la page 'Événements'\n2. Filtrez par 'Prix : Gratuit'\n3. Ou regardez les événements marqués 🆓\n\nVoulez-vous que je vous montre les événements gratuits disponibles ?",
        intent: 'events',
        suggestions: ["Voir les événements gratuits", "Comment s'inscrire", "Événements payants"]
      };
    }
    
    // INSCRIPTIONS SELON LE TYPE D'UTILISATEUR
    else if (messageLower.includes('inscrire') || messageLower.includes('inscription') || 
             messageLower.includes('participer') || messageLower.includes('rejoindre')) {
      
      let response = "Pour vous inscrire à un événement :\n\n";
      
      if (userType === 'organizer' || userType === 'super_admin') {
        response += "🔧 **En tant qu'organisateur :**\n";
        response += "• Vous pouvez créer et gérer vos propres événements\n";
        response += "• Pour participer à d'autres événements, utilisez un compte participant\n\n";
      }
      
      response += "📝 **Processus d'inscription :**\n";
      response += "1️⃣ Rendez-vous sur la page de l'événement\n";
      response += "2️⃣ Cliquez sur 'S'inscrire'\n";
      response += "3️⃣ Remplissez vos informations\n";
      response += "4️⃣ Effectuez le paiement si nécessaire\n\n";
      response += "✅ Votre inscription sera confirmée automatiquement !";
      
      return {
        response: response,
        intent: 'events',
        suggestions: ["Comment payer ?", "Événements gratuits", "Mes inscriptions"]
      };
    } 
    
    // STREAMING SELON LE TYPE D'UTILISATEUR
    else if (messageLower.includes('stream') || messageLower.includes('live') || 
             messageLower.includes('direct') || messageLower.includes('vidéo') ||
             messageLower.includes('connexion') || messageLower.includes('diffusion')) {
      
      let response = "Pour rejoindre un stream en direct :\n\n";
      
      if (userType === 'organizer') {
        response += "🎥 **En tant qu'organisateur :**\n";
        response += "• Configurez d'abord votre stream dans 'Mes Événements'\n";
        response += "• Lancez le stream quand vous êtes prêt\n\n";
      }
      
      response += "🎬 **Pour rejoindre un stream :**\n";
      response += "1️⃣ Rendez-vous sur la page de l'événement\n";
      response += "2️⃣ Cliquez sur 'Rejoindre le Live'\n";
      response += "3️⃣ Assurez-vous d'avoir une inscription confirmée\n\n";
      response += "📧 Vous recevrez les identifiants par email !";
      
      return {
        response: response,
        intent: 'streaming',
        suggestions: ["Problème de connexion", "Identifiants manquants", "Support streaming"]
      };
    } 
    
    // PAIEMENTS AVEC INFOS SUR GRATUIT
    else if (messageLower.includes('payer') || messageLower.includes('paiement') || 
             messageLower.includes('coût') || messageLower.includes('tarif')) {
      
      let response = "💳 **Informations sur les paiements :**\n\n";
      
      if (messageLower.includes('gratuit')) {
        response += "🆓 **Événements gratuits :**\n";
        response += "• Inscription sans paiement\n";
        response += "• Accès complet au contenu\n";
        response += "• Pas de carte bancaire requise\n\n";
      }
      
      response += "💳 **Événements payants :**\n";
      response += "• Paiement sécurisé SSL\n";
      response += "• Cartes bancaires acceptées\n";
      response += "• Confirmation immédiate\n";
      response += "• Remboursement possible\n\n";
      
      response += "💰 **Prix affichés :**\n";
      response += "• Sur chaque page d'événement\n";
      response += "• Avant l'inscription\n";
      response += "• Taxes incluses";
      
      return {
        response: response,
        intent: 'payment',
        suggestions: ["Événements gratuits", "Problème de paiement", "Remboursement"]
      };
    } 
    
    // PROBLÈMES TECHNIQUES PERSONNALISÉS
    else if (messageLower.includes('problème') || messageLower.includes('erreur') || 
             messageLower.includes('bug') || messageLower.includes('marche pas') ||
             messageLower.includes('fonctionne pas') || messageLower.includes('aide')) {
      
      let response = "🔧 **Support technique personnalisé :**\n\n";
      
      if (userType === 'super_admin') {
        response += "👑 **En tant que Super Admin :**\n";
        response += "• Accès complet au système\n";
        response += "• Gestion des utilisateurs\n";
        response += "• Configuration globale\n\n";
      } else if (userType === 'organizer') {
        response += "🎯 **En tant qu'organisateur :**\n";
        response += "• Gestion de vos événements\n";
        response += "• Configuration streaming\n";
        response += "• Support prioritaire\n\n";
      }
      
      response += "📋 **Décrivez votre problème :**\n";
      response += "• Sur quelle page êtes-vous ?\n";
      response += "• Quel message d'erreur voyez-vous ?\n";
      response += "• Que tentiez-vous de faire ?\n\n";
      response += "🚀 Je vais vous guider vers la solution !";
      
      return {
        response: response,
        intent: 'technical',
        suggestions: ["Problème de connexion", "Erreur de page", "Contact support"]
      };
    } 
    
    // CRÉATION D'ÉVÉNEMENTS (organisateurs uniquement)
    else if ((messageLower.includes('créer') || messageLower.includes('organiser') || 
              messageLower.includes('nouveau') || messageLower.includes('event')) &&
             (userType === 'organizer' || userType === 'super_admin')) {
      
      return {
        response: "🎉 **Création d'événement :**\n\n1️⃣ Allez dans 'Mes Événements'\n2️⃣ Cliquez sur 'Créer un événement'\n3️⃣ Remplissez les informations\n4️⃣ Configurez le streaming si nécessaire\n5️⃣ Publiez votre événement\n\n💡 **Conseils :**\n• Ajoutez des images attrayantes\n• Décrivez clairement votre événement\n• Fixez un prix compétitif\n\nBesoin d'aide pour une étape spécifique ?",
        intent: 'events',
        suggestions: ["Configuration streaming", "Gestion des inscriptions", "Mes événements"]
      };
    }
    
    // 🎯 GESTION DES SUGGESTIONS POUR ORGANISATEURS
    // Configurer le streaming
    else if (messageLower.includes('streaming') || messageLower.includes('stream') || messageLower.includes('diffusion')) {
      if (userType === 'organizer' || userType === 'super_admin') {
        return {
          response: "🎥 **Configuration du Streaming - Organisateur**\n\n🔧 **Options disponibles :**\n• Streaming en direct (Zoom, YouTube)\n• Enregistrement automatique\n• Chat en temps réel\n• Partage d'écran\n\n📋 **Configuration :**\n1. Allez dans 'Mes Événements'\n2. Sélectionnez votre événement\n3. Onglet 'Streaming'\n4. Choisissez la plateforme\n5. Configurez les paramètres\n\n💡 **Conseils :**\n• Testez avant l'événement\n• Préparez un plan B\n• Vérifiez votre connexion",
          intent: 'streaming_config',
          suggestions: ["Tester le stream", "Gérer les participants", "Enregistrements"]
        };
      }
    }
    
    // Voir mes événements
    else if (messageLower.includes('mes événements') || messageLower.includes('voir mes') || messageLower.includes('événements')) {
      if (userType === 'organizer' || userType === 'super_admin') {
        return {
          response: "📅 **Mes Événements - Organisateur**\n\n📊 **Vue d'ensemble :**\n• Événements à venir\n• Événements passés\n• Statistiques de participation\n• Revenus générés\n\n🔍 **Actions disponibles :**\n• Modifier un événement\n• Voir les inscriptions\n• Gérer le streaming\n• Analyser les performances\n\n📱 **Accès rapide :**\n1. Menu principal → 'Mes Événements'\n2. Filtrez par statut\n3. Cliquez sur un événement\n4. Gestion complète",
          intent: 'my_events',
          suggestions: ["Créer un événement", "Analyser les stats", "Gérer les inscriptions"]
        };
      }
    }
    
    // Gérer les inscriptions
    else if (messageLower.includes('inscriptions') || messageLower.includes('gérer') || messageLower.includes('participants')) {
      if (userType === 'organizer' || userType === 'super_admin') {
        return {
          response: "👥 **Gestion des Inscriptions - Organisateur**\n\n📝 **Actions disponibles :**\n• Voir toutes les inscriptions\n• Approuver/rejeter\n• Gérer la liste d'attente\n• Envoyer des notifications\n• Exporter la liste\n\n📋 **Processus :**\n1. Allez dans votre événement\n2. Onglet 'Inscriptions'\n3. Filtrez par statut\n4. Prenez les actions\n5. Notifiez les participants\n\n💡 **Fonctionnalités :**\n• Validation automatique\n• Gestion des remboursements\n• Communication en masse",
          intent: 'registration_management',
          suggestions: ["Approuver en attente", "Gérer la liste d'attente", "Exporter la liste"]
        };
      }
    }
    
    // RÉPONSE PAR DÉFAUT PERSONNALISÉE
    else {
      let response = "Je ne suis pas sûr de comprendre votre question. Pouvez-vous la reformuler ?\n\n";
      
      if (userType === 'super_admin') {
        response += "👑 **En tant que Super Admin, je peux vous aider avec :**\n";
        response += "• La gestion globale du système\n";
        response += "• Les statistiques et rapports\n";
        response += "• La modération des utilisateurs\n";
        response += "• La configuration système";
      } else if (userType === 'organizer') {
        response += "🎯 **En tant qu'organisateur, je peux vous aider avec :**\n";
        response += "• La création d'événements\n";
        response += "• La configuration du streaming\n";
        response += "• La gestion des inscriptions\n";
        response += "• L'analyse de vos événements";
      } else {
        response += "👤 **Je peux vous aider avec :**\n";
        response += "• Les inscriptions aux événements\n";
        response += "• L'accès aux streams\n";
        response += "• Les paiements et tarifs\n";
        response += "• Le support technique";
      }
      
      return {
        response: response,
        intent: 'unknown',
        suggestions: getPersonalizedSuggestions(userType)
      };
    }
    
    // 🎯 GESTION DES SUGGESTIONS POUR PARTICIPANTS
    // Comment s'inscrire
    if (messageLower.includes('inscrire') || messageLower.includes('inscription') || messageLower.includes('participer')) {
      if (userType === 'participant') {
        return {
          response: "📝 **Comment s'inscrire à un événement - Participant**\n\n🎯 **Étapes simples :**\n1. Parcourez la liste des événements\n2. Cliquez sur l'événement qui vous intéresse\n3. Lisez les détails et le prix\n4. Cliquez sur 'S'inscrire'\n5. Remplissez vos informations\n6. Effectuez le paiement (si payant)\n7. Confirmation immédiate !\n\n💡 **Conseils :**\n• Vérifiez la date et l'heure\n• Lisez les conditions\n• Gardez votre confirmation\n\n❓ **Besoin d'aide ?** Contactez l'organisateur directement !",
          intent: 'registration_help',
          suggestions: ["Événements gratuits", "Mes inscriptions", "Support technique"]
        };
      }
    }
    
    // Événements gratuits
    if (messageLower.includes('gratuits') || messageLower.includes('gratuit') || messageLower.includes('pas cher')) {
      if (userType === 'participant') {
        return {
          response: "🆓 **Événements Gratuits - Participant**\n\n🎉 **Cette semaine :**\n• Conférence Tech gratuite (Mercredi 14h)\n• Atelier créatif (Samedi 10h)\n• Meetup développeurs (Dimanche 16h)\n\n🔍 **Comment les trouver :**\n1. Page 'Événements'\n2. Filtre 'Prix : Gratuit'\n3. Ou regardez le badge 🆓\n\n💡 **Avantages :**\n• Inscription sans paiement\n• Accès complet au contenu\n• Pas de carte bancaire\n• Confirmation immédiate\n\n📅 **Prochain événement gratuit :** Mercredi à 14h !",
          intent: 'free_events',
          suggestions: ["Comment s'inscrire", "Mes inscriptions", "Voir tous les événements"]
        };
      }
    }
    
    // Rejoindre un stream
    if (messageLower.includes('rejoindre') || messageLower.includes('stream') || messageLower.includes('live')) {
      if (userType === 'participant') {
        return {
          response: "🎬 **Rejoindre un Stream - Participant**\n\n📺 **Comment procéder :**\n1. Assurez-vous d'être inscrit à l'événement\n2. Rendez-vous sur la page de l'événement\n3. Cliquez sur 'Rejoindre le Live'\n4. Entrez le code d'accès (envoyé par email)\n5. Profitez du stream !\n\n📧 **Codes d'accès :**\n• Envoyés 1h avant l'événement\n• Vérifiez vos spams\n• Contactez l'organisateur si problème\n\n💡 **Conseils :**\n• Testez votre connexion\n• Préparez vos questions\n• Respectez les règles du chat\n\n❓ **Problème ?** L'organisateur peut vous aider !",
          intent: 'join_stream',
          suggestions: ["Mes inscriptions", "Support technique", "Voir tous les événements"]
        };
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleWidget = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
    setShowSuggestions(false);
  };

  if (!isOpen) {
    return (
      <div className="ai-chatbot-trigger" onClick={toggleWidget}>
        <MdSmartToy className="ai-icon" />
        <span className="ai-tooltip">Assistant IA</span>
      </div>
    );
  }

  return (
    <>
      <div className={`ai-chatbot-widget ${isMinimized ? 'minimized' : ''}`}>
        <div className="ai-chatbot-header">
          <div className="ai-header-info">
            <FaRobot className="ai-header-icon" />
            <div>
              <h4>Assistant IA</h4>
              <span className="ai-status">En ligne</span>
                             {/* 🔍 INDICATEUR DE DEBUG DU TYPE D'UTILISATEUR */}
               {process.env.NODE_ENV === 'development' && (
                 <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                   👤 {getUserType()} | {isAuthenticated ? 'Connecté' : 'Non connecté'}
                 </div>
               )}
               
               {/* 🤖 INDICATEUR DU STATUT IA */}
               <div style={{ 
                 fontSize: '10px', 
                 opacity: 0.8, 
                 marginTop: '2px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}>
                 {aiStatus === 'enabled' && (
                   <>
                     <FaBrain style={{ color: '#00ff00' }} />
                     <span style={{ color: '#00ff00' }}>IA Réelle</span>
                   </>
                 )}
                 {aiStatus === 'disabled' && (
                   <>
                     <FaCog style={{ color: '#ffaa00' }} />
                     <span style={{ color: '#ffaa00' }}>Mode Fallback</span>
                   </>
                 )}
                 {aiStatus === 'error' && (
                   <>
                     <FaCog style={{ color: '#ff0000' }} />
                     <span style={{ color: '#ff0000' }}>Erreur IA</span>
                   </>
                 )}
                 {aiStatus === 'checking' && (
                   <>
                     <FaCog style={{ color: '#888888' }} />
                     <span style={{ color: '#888888' }}>Vérification...</span>
                   </>
                 )}
               </div>
            </div>
          </div>
          <div className="ai-header-actions">
            <button 
              className="ai-minimize-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title="Réduire"
            >
              <FaTimes />
            </button>
            <button 
              className="ai-close-btn"
              onClick={closeWidget}
              title="Fermer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="ai-chatbot-content">
          <div className="ai-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`ai-message ${message.type}`}
              >
                <div className="ai-message-content">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                <div className="ai-message-time">
                  {message.timestamp.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="ai-message ai">
                <div className="ai-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="ai-suggestions">
              <div className="ai-suggestions-header">
                <FaLightbulb className="ai-suggestions-icon" />
                <span>Suggestions</span>
              </div>
              <div className="ai-suggestions-list">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    className="ai-suggestion-btn"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="ai-input"
              rows="1"
              disabled={isLoading}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="ai-chatbot-overlay" onClick={closeWidget} />
      )}
    </>
  );
};

export default AIChatbotWidget;