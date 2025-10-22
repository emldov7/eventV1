// 🔐 Configuration de l'authentification sociale côté frontend

export const SOCIAL_AUTH_CONFIG = {
  // Google OAuth2
  GOOGLE: {
    CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
    REDIRECT_URI: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    SCOPE: 'openid email profile',
    RESPONSE_TYPE: 'code',
    AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    USER_INFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },
  
  // Facebook OAuth2
  FACEBOOK: {
    APP_ID: process.env.REACT_APP_FACEBOOK_APP_ID || 'your-facebook-app-id',
    REDIRECT_URI: process.env.REACT_APP_FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
    SCOPE: 'email,public_profile',
    RESPONSE_TYPE: 'code',
    AUTH_URL: 'https://www.facebook.com/v12.0/dialog/oauth',
    TOKEN_URL: 'https://graph.facebook.com/v12.0/oauth/access_token',
    USER_INFO_URL: 'https://graph.facebook.com/me'
  },
  
  // Configuration générale
  GENERAL: {
    SUCCESS_URL: process.env.REACT_APP_SOCIAL_AUTH_SUCCESS_URL || '/dashboard',
    FAILURE_URL: process.env.REACT_APP_SOCIAL_AUTH_FAILURE_URL || '/login?error=social_auth_failed',
    ENABLED: process.env.REACT_APP_SOCIAL_AUTH_ENABLED !== 'false'
  }
};

// Fonctions utilitaires pour l'authentification sociale
export const socialAuthUtils = {
  // Construire l'URL d'authentification Google
  buildGoogleAuthUrl: () => {
    const { CLIENT_ID, REDIRECT_URI, SCOPE, RESPONSE_TYPE, AUTH_URL } = SOCIAL_AUTH_CONFIG.GOOGLE;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      response_type: RESPONSE_TYPE,
      state: Math.random().toString(36).substring(7) // Anti-CSRF
    });
    return `${AUTH_URL}?${params.toString()}`;
  },
  
  // Construire l'URL d'authentification Facebook
  buildFacebookAuthUrl: () => {
    const { APP_ID, REDIRECT_URI, SCOPE, RESPONSE_TYPE, AUTH_URL } = SOCIAL_AUTH_CONFIG.FACEBOOK;
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      response_type: RESPONSE_TYPE,
      state: Math.random().toString(36).substring(7) // Anti-CSRF
    });
    return `${AUTH_URL}?${params.toString()}`;
  },
  
  // Extraire le code d'autorisation de l'URL de callback
  extractAuthCode: (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('code');
  },
  
  // Extraire l'état de l'URL de callback (anti-CSRF)
  extractState: (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('state');
  },
  
  // Vérifier si l'URL est un callback d'authentification sociale
  isSocialAuthCallback: (url) => {
    return url.includes('/auth/google/callback') || url.includes('/auth/facebook/callback');
  },
  
  // Obtenir le provider à partir de l'URL de callback
  getProviderFromCallback: (url) => {
    if (url.includes('/auth/google/callback')) return 'google';
    if (url.includes('/auth/facebook/callback')) return 'facebook';
    return null;
  }
};

// Messages d'erreur personnalisés
export const SOCIAL_AUTH_MESSAGES = {
  GOOGLE: {
    SUCCESS: 'Connexion avec Google réussie !',
    ERROR: 'Erreur lors de la connexion avec Google',
    CANCELLED: 'Connexion avec Google annulée',
    NETWORK_ERROR: 'Erreur de connexion avec Google. Vérifiez votre connexion internet.'
  },
  FACEBOOK: {
    SUCCESS: 'Connexion avec Facebook réussie !',
    ERROR: 'Erreur lors de la connexion avec Facebook',
    CANCELLED: 'Connexion avec Facebook annulée',
    NETWORK_ERROR: 'Erreur de connexion avec Facebook. Vérifiez votre connexion internet.'
  },
  GENERAL: {
    ACCOUNT_LINKED: 'Compte social lié avec succès !',
    ACCOUNT_UNLINKED: 'Compte social délié avec succès !',
    ALREADY_LINKED: 'Ce compte social est déjà lié à un autre utilisateur.',
    INVALID_TOKEN: 'Token d\'authentification invalide.',
    EXPIRED_TOKEN: 'Token d\'authentification expiré.',
    PERMISSION_DENIED: 'Permission refusée par le fournisseur social.'
  }
};

// Configuration des icônes et couleurs
export const SOCIAL_AUTH_STYLES = {
  GOOGLE: {
    color: '#db4437',
    hoverColor: '#c23321',
    backgroundColor: 'rgba(219, 68, 55, 0.04)',
    icon: '🔴'
  },
  FACEBOOK: {
    color: '#1877f2',
    hoverColor: '#166fe5',
    backgroundColor: 'rgba(24, 119, 242, 0.04)',
    icon: '🔵'
  }
};

export default SOCIAL_AUTH_CONFIG;









