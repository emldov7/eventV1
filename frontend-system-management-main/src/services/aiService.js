// 🤖 SERVICE IA RÉELLE - Remplace la simulation par de vraies réponses intelligentes

// Configuration de l'API IA
const AI_CONFIG = {
  // 🌐 API gratuite et puissante (OpenAI compatible)
  baseURL: 'https://api.openai.com/v1/chat/completions',
  // 🔑 Remplacez par votre vraie clé API
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || 'your-api-key-here',
  
  // 🎯 Modèle IA à utiliser
  model: 'gpt-3.5-turbo',
  
  // ⚙️ Paramètres de génération
  maxTokens: 1000,
  temperature: 0.7,
  
  // 🔄 Fallback vers simulation si erreur
  fallbackToMock: true
};

// 🎭 PROMPTS PERSONNALISÉS PAR TYPE D'UTILISATEUR
const getSystemPrompt = (userType) => {
  const basePrompt = `Tu es un assistant IA expert en gestion d'événements, très amical et serviable. 
  
  Règles importantes :
  - Réponds TOUJOURS en français
  - Utilise des emojis et du formatage markdown
  - Sois précis et pratique
  - Donne des exemples concrets
  - Propose des suggestions utiles
  
  Contexte utilisateur : ${userType}`;

  switch (userType) {
    case 'super_admin':
      return `${basePrompt}
      
      Tu es un Super Admin avec accès complet au système :
      - Gestion globale des événements
      - Modération des utilisateurs
      - Statistiques et rapports
      - Configuration système
      
      Réponds comme un expert en administration système.`;
      
    case 'organizer':
      return `${basePrompt}
      
      Tu es un organisateur d'événements expérimenté :
      - Création et gestion d'événements
      - Configuration du streaming
      - Gestion des inscriptions
      - Marketing et promotion
      
      Réponds comme un professionnel de l'événementiel.`;
      
    case 'participant':
      return `${basePrompt}
      
      Tu aides les participants à :
      - S'inscrire aux événements
      - Trouver des événements gratuits
      - Rejoindre des streams
      - Résoudre des problèmes
      
      Réponds comme un guide bienveillant.`;
      
    default:
      return basePrompt;
  }
};

// 🚀 FONCTION PRINCIPALE - Génère une vraie réponse IA
export const generateAIResponse = async (message, userType, conversationHistory = []) => {
  try {
    console.log('🤖 Génération IA réelle pour:', message);
    console.log('👤 Type utilisateur:', userType);
    
    // 🔄 Si pas de clé API, utiliser le fallback
    if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your-api-key-here') {
      console.log('⚠️ Pas de clé API, utilisation du fallback');
      return await generateFallbackResponse(message, userType);
    }
    
    // 📝 Préparation du prompt avec contexte
    const systemPrompt = getSystemPrompt(userType);
    
    // 📚 Construction du contexte de conversation
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // 🌐 Appel à l'API IA réelle
    const response = await fetch(AI_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Réponse IA vide ou invalide');
    }
    
    console.log('✅ Réponse IA générée avec succès');
    
    // 🎯 Génération de suggestions contextuelles
    const suggestions = await generateContextualSuggestions(aiResponse, userType);
    
    return {
      response: aiResponse,
      intent: 'ai_response',
      suggestions: suggestions,
      isRealAI: true
    };
    
  } catch (error) {
    console.error('❌ Erreur génération IA:', error);
    
    // 🔄 Fallback vers la simulation si erreur
    if (AI_CONFIG.fallbackToMock) {
      console.log('🔄 Utilisation du fallback (simulation)');
      return await generateFallbackResponse(message, userType);
    }
    
    // 💥 Erreur fatale si pas de fallback
    throw error;
  }
};

// 🔄 FALLBACK - Simulation intelligente (votre code actuel amélioré)
const generateFallbackResponse = async (message, userType) => {
  console.log('🎭 Génération fallback (simulation)');
  
  // Simulation d'un délai réseau
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const messageLower = message.toLowerCase();
  
  // 🎯 Détection d'intentions améliorée
  if (messageLower.includes('modérer') || messageLower.includes('utilisateurs')) {
    if (userType === 'super_admin') {
      return {
        response: "👑 **Modération des Utilisateurs - Super Admin**\n\n🔍 **Actions disponibles :**\n• Voir tous les utilisateurs\n• Suspendre un compte\n• Changer le rôle d'un utilisateur\n• Supprimer un compte\n\n📋 **Comment procéder :**\n1. Allez dans 'Gestion Utilisateurs'\n2. Sélectionnez l'utilisateur\n3. Choisissez l'action\n4. Confirmez la modification\n\n⚠️ **Attention :** Ces actions sont irréversibles !",
        intent: 'moderation',
        suggestions: ["Voir tous les utilisateurs", "Gérer les rôles", "Statistiques utilisateurs"],
        isRealAI: false
      };
    }
  }
  
  // 🎯 Gérer tous les événements (Super Admin)
  if (messageLower.includes('gérer') && messageLower.includes('événements')) {
    if (userType === 'super_admin') {
      return {
        response: "🎯 **Gestion Globale des Événements - Super Admin**\n\n🌍 **Actions disponibles :**\n• Voir tous les événements\n• Modérer un événement\n• Supprimer un événement\n• Changer l'organisateur\n• Approuver/rejeter\n\n📋 **Processus de modération :**\n1. Allez dans 'Modération Événements'\n2. Filtrez par statut\n3. Examinez les détails\n4. Prenez une décision\n5. Notifiez l'organisateur\n\n⚡ **Filtres rapides :**\n• En attente d'approbation\n• Signalés\n• Contenu inapproprié",
        intent: 'event_management',
        suggestions: ["Événements en attente", "Événements signalés", "Historique des actions"],
        isRealAI: false
      };
    }
  }
  
  // 📊 Statistiques globales (Super Admin)
  if (messageLower.includes('statistiques') || messageLower.includes('stats') || messageLower.includes('globales')) {
    if (userType === 'super_admin') {
      return {
        response: "📊 **Statistiques Globales - Super Admin**\n\n📈 **Vue d'ensemble :**\n• Nombre total d'utilisateurs\n• Événements créés ce mois\n• Revenus générés\n• Taux de participation\n\n📅 **Périodes disponibles :**\n• Aujourd'hui\n• Cette semaine\n• Ce mois\n• Cette année\n\n📊 **Accès :**\n1. Allez dans 'Tableau de Bord'\n2. Section 'Statistiques Globales'\n3. Choisissez la période\n4. Exportez en PDF si besoin",
        intent: 'statistics',
        suggestions: ["Exporter les stats", "Comparer les périodes", "Alertes automatiques"],
        isRealAI: false
      };
    }
  }
  
  // ⚙️ Configuration système (Super Admin)
  if (messageLower.includes('configuration') || messageLower.includes('système') || messageLower.includes('config')) {
    if (userType === 'super_admin') {
      return {
        response: "⚙️ **Configuration Système - Super Admin**\n\n🔧 **Paramètres disponibles :**\n• Limites d'événements\n• Paramètres de paiement\n• Configuration email\n• Sécurité et permissions\n• Intégrations API\n\n📝 **Comment configurer :**\n1. Allez dans 'Paramètres Système'\n2. Choisissez la section\n3. Modifiez les valeurs\n4. Sauvegardez\n5. Redémarrez si nécessaire\n\n⚠️ **Important :** Certains changements nécessitent un redémarrage !",
        intent: 'system_config',
        suggestions: ["Paramètres de sécurité", "Configuration email", "Sauvegarde système"],
        isRealAI: false
      };
    }
  }
  
  // 👋 Salutations personnalisées
  if (messageLower.includes('bonjour') || messageLower.includes('salut') || messageLower.includes('hello') || messageLower.includes('sa va') || messageLower.includes('comment ça va')) {
    let greetingResponse = "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?\n\n";
    
    if (userType === 'super_admin') {
      greetingResponse += "👑 **En tant que Super Admin, je peux vous aider avec :**\n• La gestion globale du système\n• Les statistiques et rapports\n• La modération des utilisateurs\n• La configuration système";
    } else if (userType === 'organizer') {
      greetingResponse += "🎯 **En tant qu'organisateur, je peux vous aider avec :**\n• La création d'événements\n• La configuration du streaming\n• La gestion des inscriptions\n• L'analyse de vos événements";
    } else {
      greetingResponse += "👤 **Je peux vous aider avec :**\n• Les inscriptions aux événements\n• L'accès aux streams\n• Les paiements et tarifs\n• Le support technique";
    }
    
    return {
      response: greetingResponse,
      intent: 'greetings',
      suggestions: getDefaultSuggestions(userType),
      isRealAI: false
    };
  }
  
  // 🎉 Événements gratuits
  if (messageLower.includes('gratuit') || messageLower.includes('gratuits')) {
    return {
      response: "🆓 **Événements Gratuits Disponibles !**\n\n📅 **Cette semaine :**\n• Conférence Tech gratuite (Mercredi 14h)\n• Atelier créatif (Samedi 10h)\n• Meetup développeurs (Dimanche 16h)\n\n💡 **Comment les trouver :**\n1. Page 'Événements'\n2. Filtre 'Prix : Gratuit'\n3. Badge 🆓 visible\n\n🎯 **Avantages :**\n• Inscription sans paiement\n• Accès complet au contenu\n• Pas de carte bancaire requise",
      intent: 'free_events',
      suggestions: ["Comment s'inscrire", "Voir tous les événements", "Mes inscriptions"],
      isRealAI: false
    };
  }
  
  // 📝 Inscriptions
  if (messageLower.includes('inscrire') || messageLower.includes('inscription')) {
    return {
      response: "📝 **Comment s'inscrire à un événement :**\n\n🎯 **Étapes simples :**\n1️⃣ Parcourez la liste des événements\n2️⃣ Cliquez sur l'événement qui vous intéresse\n3️⃣ Lisez les détails et le prix\n4️⃣ Cliquez sur 'S'inscrire'\n5️⃣ Remplissez vos informations\n6️⃣ Effectuez le paiement si nécessaire\n7️⃣ Confirmation immédiate !\n\n💡 **Conseils :**\n• Vérifiez la date et l'heure\n• Lisez les conditions\n• Gardez votre confirmation",
      intent: 'registration',
      suggestions: ["Événements gratuits", "Mes inscriptions", "Support technique"],
      isRealAI: false
    };
  }
  
  // 🎬 Streaming
  if (messageLower.includes('stream') || messageLower.includes('live')) {
    return {
      response: "🎬 **Rejoindre un Stream en Direct :**\n\n📺 **Comment procéder :**\n1. Assurez-vous d'être inscrit à l'événement\n2. Rendez-vous sur la page de l'événement\n3. Cliquez sur 'Rejoindre le Live'\n4. Entrez le code d'accès (envoyé par email)\n5. Profitez du stream !\n\n📧 **Codes d'accès :**\n• Envoyés 1h avant l'événement\n• Vérifiez vos spams\n• Contactez l'organisateur si problème",
      intent: 'streaming',
      suggestions: ["Mes inscriptions", "Support technique", "Voir les événements"],
      isRealAI: false
    };
  }
  
  // 🔧 Support technique
  if (messageLower.includes('problème') || messageLower.includes('aide') || messageLower.includes('erreur')) {
    return {
      response: "🔧 **Support Technique Personnalisé :**\n\n📋 **Décrivez votre problème :**\n• Sur quelle page êtes-vous ?\n• Quel message d'erreur voyez-vous ?\n• Que tentiez-vous de faire ?\n\n🚀 **Je vais vous guider vers la solution !**\n\n💡 **Solutions rapides :**\n• Rafraîchissez la page\n• Vérifiez votre connexion\n• Videz le cache du navigateur\n• Contactez le support si persistant",
      intent: 'technical_support',
      suggestions: ["Problème de connexion", "Erreur de page", "Contact support"],
      isRealAI: false
    };
  }
  
  // 🎯 Questions complexes et avancées
  if (messageLower.includes('roi') || messageLower.includes('retour sur investissement') || messageLower.includes('optimiser') || messageLower.includes('1000 personnes')) {
    if (userType === 'super_admin') {
      return {
        response: "🎯 **Optimisation ROI - Événement de 1000 Personnes**\n\n💰 **Stratégies de maximisation :**\n• **Pricing dynamique** : Prix variables selon la date\n• **Packages premium** : VIP, backstage, networking exclusif\n• **Sponsoring** : Partenariats avec entreprises locales\n• **Merchandising** : Vente de produits dérivés\n\n⚠️ **Gestion des risques :**\n• **Assurance événement** : Couverture annulation, météo\n• **Plan B** : Version hybride en cas de problème\n• **Sécurité** : Vigiles, premiers secours, évacuation\n• **Conformité** : Permis, normes sanitaires\n\n📊 **ROI attendu :** 150-300% avec bonne gestion",
        intent: 'roi_optimization',
        suggestions: ["Calcul ROI détaillé", "Plan de gestion des risques", "Stratégies de pricing"],
        isRealAI: false
      };
    }
  }

  // 🌐 Tendances événementiel hybride
  if (messageLower.includes('tendances') || messageLower.includes('hybride') || messageLower.includes('événementiel') || messageLower.includes('plateforme')) {
    if (userType === 'super_admin') {
      return {
        response: "🌐 **Tendances Événementiel Hybride 2024**\n\n🚀 **Innovations clés :**\n• **Réalité augmentée** : Expériences immersives\n• **IA et personnalisation** : Contenu adaptatif\n• **Gamification** : Challenges, récompenses\n• **Networking virtuel** : Salles de discussion intelligentes\n\n💻 **Technologies émergentes :**\n• **Web3** : NFTs, métavers\n• **5G** : Streaming ultra-rapide\n• **IoT** : Capteurs de présence, analytics\n• **Blockchain** : Billets sécurisés, micropaiements\n\n🎯 **Application à votre plateforme :**\n• Intégrer des outils hybrides\n• Offrir des expériences mixtes\n• Analyser les préférences utilisateurs\n• Adapter le pricing selon le format",
        intent: 'hybrid_trends',
        suggestions: ["Implémentation hybride", "Technologies à adopter", "ROI des innovations"],
        isRealAI: false
      };
    }
  }

  // 📈 Questions business et stratégiques
  if (messageLower.includes('business') || messageLower.includes('stratégie') || messageLower.includes('marché') || messageLower.includes('concurrence')) {
    if (userType === 'super_admin') {
      return {
        response: "📈 **Analyse Business & Stratégique**\n\n🎯 **Positionnement marché :**\n• **Analyse concurrentielle** : Étudier les leaders du secteur\n• **Différenciation** : Services uniques, UX exceptionnelle\n• **Segmentation** : Cibler des niches spécifiques\n\n💡 **Stratégies de croissance :**\n• **Expansion géographique** : Nouveaux marchés\n• **Diversification** : Nouveaux types d'événements\n• **Partnerships** : Alliances stratégiques\n• **Acquisitions** : Intégration de startups innovantes\n\n📊 **Métriques clés :**\n• Chiffre d'affaires par utilisateur\n• Taux de rétention\n• Coût d'acquisition client\n• Lifetime value",
        intent: 'business_strategy',
        suggestions: ["Analyse concurrentielle", "Plan de croissance", "Métriques de performance"],
        isRealAI: false
      };
    }
  }

  // 🎯 Réponse par défaut personnalisée (améliorée)
  let defaultResponse = "Je comprends votre question, mais elle nécessite une analyse plus approfondie.\n\n";
  
  if (userType === 'super_admin') {
    defaultResponse += "👑 **En tant que Super Admin, je peux vous aider avec :**\n• La gestion globale du système\n• Les statistiques et rapports\n• La modération des utilisateurs\n• La configuration système\n\n💡 **Pour des questions complexes :**\n• Attendez que l'IA réelle soit disponible\n• Ou reformulez avec des mots-clés spécifiques\n• Utilisez les suggestions ci-dessous";
  } else if (userType === 'organizer') {
    defaultResponse += "🎯 **En tant qu'organisateur, je peux vous aider avec :**\n• La création d'événements\n• La configuration du streaming\n• La gestion des inscriptions\n• L'analyse de vos événements";
  } else {
    defaultResponse += "👤 **Je peux vous aider avec :**\n• Les inscriptions aux événements\n• L'accès aux streams\n• Les paiements et tarifs\n• Le support technique";
  }
  
  return {
    response: defaultResponse,
    intent: 'unknown',
    suggestions: getDefaultSuggestions(userType),
    isRealAI: false
  };
};

// 💡 Suggestions contextuelles intelligentes
const generateContextualSuggestions = async (aiResponse, userType) => {
  // 🎯 Suggestions basées sur le contenu de la réponse
  const responseLower = aiResponse.toLowerCase();
  
  if (responseLower.includes('événement') || responseLower.includes('event')) {
    return ["Créer un événement", "Voir mes événements", "Gérer les inscriptions"];
  }
  
  if (responseLower.includes('stream') || responseLower.includes('diffusion')) {
    return ["Configurer le streaming", "Rejoindre un stream", "Support streaming"];
  }
  
  if (responseLower.includes('inscription') || responseLower.includes('inscrire')) {
    return ["Comment s'inscrire", "Événements gratuits", "Mes inscriptions"];
  }
  
  if (responseLower.includes('problème') || responseLower.includes('erreur')) {
    return ["Support technique", "FAQ", "Contact support"];
  }
  
  // 🎭 Suggestions par défaut selon le type d'utilisateur
  return getDefaultSuggestions(userType);
};

// 🎭 Suggestions par défaut selon le type d'utilisateur
const getDefaultSuggestions = (userType) => {
  switch (userType) {
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

// 🔧 Configuration et utilitaires
export const configureAI = (config) => {
  Object.assign(AI_CONFIG, config);
  console.log('⚙️ Configuration IA mise à jour:', AI_CONFIG);
};

export const isAIEnabled = () => {
  return AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'your-api-key-here';
};

export const getAIConfig = () => {
  return { ...AI_CONFIG };
};
