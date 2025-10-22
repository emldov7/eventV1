// 🔑 CONFIGURATION API IA - Remplacez par vos vraies clés

export const AI_CONFIG = {
  // 🌐 OpenAI API (recommandé)
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key-here',
  
  // 🔄 Alternatives gratuites (OpenAI compatible)
  // OPENAI_API_KEY: 'your-free-api-key-here',
  // BASE_URL: 'https://api.free-ai-provider.com/v1',
  
  // 🎯 Configuration IA
  MODEL: process.env.REACT_APP_AI_MODEL || 'gpt-3.5-turbo',
  MAX_TOKENS: parseInt(process.env.REACT_APP_AI_MAX_TOKENS) || 1000,
  TEMPERATURE: parseFloat(process.env.REACT_APP_AI_TEMPERATURE) || 0.7,
  
  // 🚀 Mode développement
  FALLBACK: process.env.REACT_APP_AI_FALLBACK !== 'false',
  DEBUG: process.env.REACT_APP_AI_DEBUG === 'true',
  
  // 📝 URLs par défaut
  DEFAULT_BASE_URL: 'https://api.openai.com/v1/chat/completions',
  
  // 🔧 Configuration avancée
  TIMEOUT: 30000, // 30 secondes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 seconde
};

// 🎭 PROMPTS PRÉDÉFINIS POUR DIFFÉRENTS CONTEXTES
export const AI_PROMPTS = {
  // 🎯 Gestion d'événements
  EVENT_MANAGEMENT: `
    Tu es un expert en gestion d'événements avec 10+ ans d'expérience.
    Tu connais parfaitement :
    - La planification et organisation d'événements
    - La gestion des inscriptions et participants
    - Le streaming et la diffusion en direct
    - Le marketing événementiel
    - La gestion des budgets et ROI
    - Les tendances actuelles du secteur
    
    Réponds toujours de manière pratique et actionable.
  `,
  
  // 👑 Administration système
  SYSTEM_ADMIN: `
    Tu es un administrateur système senior avec expertise en :
    - Gestion des utilisateurs et permissions
    - Monitoring et analytics
    - Sécurité et conformité
    - Performance et scalabilité
    - Intégrations API et webhooks
    - Sauvegarde et récupération
    
    Donne des conseils techniques précis et sécurisés.
  `,
  
  // 🎯 Organisation d'événements
  EVENT_ORGANIZER: `
    Tu es un organisateur d'événements professionnel spécialisé dans :
    - Création de concepts événementiels innovants
    - Gestion des fournisseurs et prestataires
    - Planification logistique détaillée
    - Communication et marketing événementiel
    - Gestion des risques et planification d'urgence
    - Analyse post-événement et amélioration continue
    
    Propose des solutions créatives et pratiques.
  `,
  
  // 👥 Support participant
  PARTICIPANT_SUPPORT: `
    Tu es un expert en support client événementiel avec :
    - Excellentes compétences en communication
    - Connaissance approfondie des plateformes événementielles
    - Capacité à résoudre des problèmes complexes
    - Empathie et patience avec les utilisateurs
    - Connaissance des meilleures pratiques UX/UI
    - Expérience en formation et documentation
    
    Aide les participants avec bienveillance et efficacité.
  `,
};

// 🚀 FONCTIONS DE CONFIGURATION
export const configureAI = (config) => {
  Object.assign(AI_CONFIG, config);
  console.log('⚙️ Configuration IA mise à jour:', AI_CONFIG);
};

export const isAIEnabled = () => {
  return AI_CONFIG.OPENAI_API_KEY && AI_CONFIG.OPENAI_API_KEY !== 'your-openai-api-key-here';
};

export const getAIConfig = () => {
  return { ...AI_CONFIG };
};

export const validateAIConfig = () => {
  const errors = [];
  
  if (!isAIEnabled()) {
    errors.push('❌ Clé API IA manquante ou invalide');
  }
  
  if (AI_CONFIG.MAX_TOKENS < 100 || AI_CONFIG.MAX_TOKENS > 4000) {
    errors.push('❌ MAX_TOKENS doit être entre 100 et 4000');
  }
  
  if (AI_CONFIG.TEMPERATURE < 0 || AI_CONFIG.TEMPERATURE > 2) {
    errors.push('❌ TEMPERATURE doit être entre 0 et 2');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// 📋 INSTRUCTIONS D'INSTALLATION
export const getInstallationInstructions = () => {
  return `
🔑 INSTALLATION API IA :

1. 🌐 Obtenez une clé API :
   - OpenAI : https://platform.openai.com/api-keys
   - Alternatives gratuites : Hugging Face, LocalAI, etc.

2. 📝 Créez un fichier .env dans le dossier frontend :
   REACT_APP_OPENAI_API_KEY=votre-vraie-cle-api-ici

3. 🚀 Redémarrez l'application :
   npm start

4. ✅ Vérifiez la configuration :
   - Ouvrez la console (F12)
   - Regardez les logs de configuration IA

5. 🧪 Testez l'IA :
   - Ouvrez le chatbot
   - Posez une question complexe
   - Vérifiez que la réponse vient de l'IA réelle

💡 Conseil : Commencez avec OpenAI (gratuit pour les tests) !
  `;
};



















