import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import { AdminPanelSettings, Event as EventIcon } from '@mui/icons-material';

const OrganizerRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Afficher le loader pendant le chargement
  if (loading) {
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
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur est organisateur ou super admin
  const isOrganizer = user.is_staff || user.is_superuser || 
                     (user.profile && user.profile.role === 'organizer') ||
                     (user.profile && user.profile.role === 'super_admin');
  
  const isSuperAdmin = user.is_superuser || 
                      (user.profile && user.profile.role === 'super_admin');

  // Si pas organisateur ni super admin, afficher un message d'accès refusé
  if (!isOrganizer) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
        textAlign="center"
      >
        <AdminPanelSettings sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="error.main">
          Accès Refusé
        </Typography>
        <Typography variant="h6" gutterBottom>
          🤖 Générateur de Contenu IA
        </Typography>
        <Alert severity="warning" sx={{ maxWidth: 600, mb: 2 }}>
          <Typography variant="body1">
            <strong>Accès restreint :</strong> Seuls les <strong>organisateurs d'événements</strong> et 
            les <strong>super administrateurs</strong> peuvent accéder au générateur de contenu IA.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default OrganizerRoute;

















