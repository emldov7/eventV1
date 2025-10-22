import React from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import api from '../../services/api';

const SocialAuthButtons = ({ onSuccess, onError, loading, setLoading }) => {
  const dispatch = useDispatch();

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      console.log('🔐 [SOCIAL_AUTH] Google auth success:', response);
      
      // Envoyer le token ID à notre API
      const apiResponse = await api.post('/auth/google/', {
        id_token: response.tokenId
      });
      
      console.log('✅ [SOCIAL_AUTH] Google API response:', apiResponse.data);
      
      // Traiter la réponse comme un login normal
      const loginResult = await dispatch(login({
        username: apiResponse.data.user.username,
        password: null, // Pas de mot de passe pour les comptes sociaux
        social_auth: true,
        social_data: apiResponse.data
      }));
      
      if (login.fulfilled.match(loginResult)) {
        onSuccess && onSuccess(apiResponse.data);
      } else {
        onError && onError('Erreur lors de la connexion avec Google');
      }
      
    } catch (error) {
      console.error('❌ [SOCIAL_AUTH] Google auth error:', error);
      onError && onError('Erreur lors de l\'authentification Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error('❌ [SOCIAL_AUTH] Google auth failure:', error);
    onError && onError('Échec de l\'authentification Google');
  };

  const handleFacebookSuccess = async (response) => {
    try {
      setLoading(true);
      console.log('🔐 [SOCIAL_AUTH] Facebook auth success:', response);
      
      // Envoyer le token d'accès à notre API
      const apiResponse = await api.post('/auth/facebook/', {
        access_token: response.accessToken
      });
      
      console.log('✅ [SOCIAL_AUTH] Facebook API response:', apiResponse.data);
      
      // Traiter la réponse comme un login normal
      const loginResult = await dispatch(login({
        username: apiResponse.data.user.username,
        password: null, // Pas de mot de passe pour les comptes sociaux
        social_auth: true,
        social_data: apiResponse.data
      }));
      
      if (login.fulfilled.match(loginResult)) {
        onSuccess && onSuccess(apiResponse.data);
      } else {
        onError && onError('Erreur lors de la connexion avec Facebook');
      }
      
    } catch (error) {
      console.error('❌ [SOCIAL_AUTH] Facebook auth error:', error);
      onError && onError('Erreur lors de l\'authentification Facebook');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookFailure = (error) => {
    console.error('❌ [SOCIAL_AUTH] Facebook auth failure:', error);
    onError && onError('Échec de l\'authentification Facebook');
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ou continuer avec
        </Typography>
      </Divider>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Bouton Google */}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={() => {
            // Intégration avec Google OAuth2
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&response_type=code`;
            window.location.href = googleAuthUrl;
          }}
          disabled={loading}
          sx={{
            borderColor: '#db4437',
            color: '#db4437',
            '&:hover': {
              borderColor: '#c23321',
              backgroundColor: 'rgba(219, 68, 55, 0.04)'
            }
          }}
        >
          {loading ? <CircularProgress size={20} /> : 'Continuer avec Google'}
        </Button>
        
        {/* Bouton Facebook */}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<FacebookIcon />}
          onClick={() => {
            // Intégration avec Facebook OAuth2
            const facebookAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${process.env.REACT_APP_FACEBOOK_APP_ID}&redirect_uri=${process.env.REACT_APP_FACEBOOK_REDIRECT_URI}&scope=email,public_profile&response_type=code`;
            window.location.href = facebookAuthUrl;
          }}
          disabled={loading}
          sx={{
            borderColor: '#1877f2',
            color: '#1877f2',
            '&:hover': {
              borderColor: '#166fe5',
              backgroundColor: 'rgba(24, 119, 242, 0.04)'
            }
          }}
        >
          {loading ? <CircularProgress size={20} /> : 'Continuer avec Facebook'}
        </Button>
      </Box>
      
      {/* Informations sur la sécurité */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>🔒 Sécurisé :</strong> Nous n'avons jamais accès à vos mots de passe. 
          L'authentification se fait directement via {process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Google' : ''} {process.env.REACT_APP_FACEBOOK_APP_ID ? 'et Facebook' : ''}.
        </Typography>
      </Alert>
    </Box>
  );
};

export default SocialAuthButtons;









