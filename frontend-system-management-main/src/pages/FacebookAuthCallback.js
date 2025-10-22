import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import api from '../services/api';
import { socialAuthUtils, SOCIAL_AUTH_MESSAGES } from '../config/socialAuth';

const FacebookAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleFacebookCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extraire le code d'autorisation de l'URL
        const authCode = socialAuthUtils.extractAuthCode(location.search);
        const state = socialAuthUtils.extractState(location.search);

        if (!authCode) {
          throw new Error('Code d\'autorisation manquant');
        }

        console.log('🔐 [FACEBOOK_CALLBACK] Code d\'autorisation reçu:', authCode);

        // Échanger le code contre un token d'accès
        const tokenResponse = await api.post('/auth/facebook/exchange/', {
          code: authCode,
          state: state
        });

        console.log('✅ [FACEBOOK_CALLBACK] Token échangé:', tokenResponse.data);

        // Traiter la réponse comme un login normal
        const loginResult = await dispatch(login({
          username: tokenResponse.data.user.username,
          password: null,
          social_auth: true,
          social_data: tokenResponse.data
        }));

        if (login.fulfilled.match(loginResult)) {
          console.log('✅ [FACEBOOK_CALLBACK] Login réussi');
          
          // Redirection intelligente selon le rôle
          const user = tokenResponse.data.user;
          if (user.profile?.role === 'super_admin') {
            navigate('/dashboard/super-admin');
          } else if (user.profile?.role === 'organizer') {
            navigate('/dashboard/organizer');
          } else {
            navigate('/');
          }
        } else {
          throw new Error('Échec de la connexion');
        }

      } catch (error) {
        console.error('❌ [FACEBOOK_CALLBACK] Erreur:', error);
        setError(error.message || 'Erreur lors de l\'authentification Facebook');
        
        // Rediriger vers la page de connexion avec l'erreur
        setTimeout(() => {
          navigate('/login?error=facebook_auth_failed');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleFacebookCallback();
  }, [location, navigate, dispatch]);

  if (loading) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Authentification en cours...
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Nous finalisons votre connexion avec Facebook.
              <br />
              Veuillez patienter un instant.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Erreur d'authentification
              </Typography>
              <Typography variant="body1">
                {error}
              </Typography>
            </Alert>
            
            <Typography variant="body2" color="text.secondary" align="center">
              Redirection vers la page de connexion dans quelques secondes...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return null;
};

export default FacebookAuthCallback;









