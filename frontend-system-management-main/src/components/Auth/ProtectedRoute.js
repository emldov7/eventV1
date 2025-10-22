import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { getCurrentUser } from '../../store/slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const hasAttemptedFetch = useRef(false);

  // Si on a un token mais pas d'utilisateur, essayer de récupérer l'utilisateur
  useEffect(() => {
    if (token && !user && !hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      // Éviter les appels répétés en cas d'échec
      const fetchUser = async () => {
        try {
          await dispatch(getCurrentUser());
        } catch (error) {
          console.log('Failed to get current user in ProtectedRoute:', error);
          // En cas d'échec, nettoyer le token pour éviter les boucles
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      };
      fetchUser();
    }
  }, [dispatch, token, user]); // ✅ Supprimé 'loading' des dépendances

  // Afficher le loader pendant le chargement
  if (loading || (token && !user)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Rediriger vers login si pas authentifié
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 