import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchMyRegistrations, 
  cancelRegistration,
  fetchUpcomingRegistrations 
} from '../store/slices/eventSlice';
import { getImageUrl } from '../services/api';
import { useLocale } from '../hooks/useLocale';

const MyRegistrationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatDate, formatPrice } = useLocale();
  const { user } = useSelector((state) => state.auth);
  const { 
    myRegistrations, 
    upcomingRegistrations,
    registrationLoading, 
    registrationError 
  } = useSelector((state) => state.events);
  
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyRegistrations());
      dispatch(fetchUpcomingRegistrations());
    }
  }, [dispatch, user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelRegistration = async (registrationId) => {
    try {
      await dispatch(cancelRegistration(registrationId)).unwrap();
      // Recharger les inscriptions
      dispatch(fetchMyRegistrations());
      dispatch(fetchUpcomingRegistrations());
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'success',
      cancelled: 'error',
      attended: 'info',
      no_show: 'error',
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      cancelled: 'Annulée',
      attended: 'Présent',
      no_show: 'Absent',
    };
    return statusLabels[status] || status;
  };

  const renderRegistrationCard = (registration) => {
    const event = registration.event_details || registration.event;
    
    return (
      <Grid item xs={12} md={6} lg={4} key={registration.id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {event?.poster && (
            <CardMedia
              component="img"
              height="200"
                  image={getImageUrl(event.poster)}
                  alt={event.title}
              sx={{ objectFit: 'cover' }}
            />
          )}
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
             <Typography variant="h6" gutterBottom>
               {event?.title}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip
                label={getStatusLabel(registration.status)}
                color={getStatusColor(registration.status)}
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={formatPrice(event.price)}
                color={event.is_free ? 'success' : 'primary'}
                size="small"
              />
            </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
               📅 {formatDate(event?.start_date)}
            </Typography>
            
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
               📍 {event?.location}
            </Typography>

            {registration.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                📝 {registration.notes}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Inscrit le: {formatDate(registration.registered_at)}
            </Typography>

            <Box sx={{ mt: 'auto' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/events/${event.id}`)}
                sx={{ mb: 1 }}
              >
                Voir l'événement
              </Button>
              
              {['pending', 'confirmed', 'waitlisted'].includes(registration.status) && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => handleCancelRegistration(registration.id)}
                  disabled={registrationLoading}
                >
                  {registrationLoading ? 'Annulation...' : 'Annuler l\'inscription'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="info">
            Vous devez être connecté pour voir vos inscriptions.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mes Inscriptions
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={`Toutes mes inscriptions (${myRegistrations.length})`} />
          <Tab label={`Événements à venir (${upcomingRegistrations.length})`} />
        </Tabs>

        {registrationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {registrationError}
          </Alert>
        )}

        {registrationLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tabValue === 0 && (
              <>
                {myRegistrations.length === 0 ? (
                  <Alert severity="info">
                    Vous n'avez pas encore d'inscriptions aux événements.
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {myRegistrations.map(renderRegistrationCard)}
                  </Grid>
                )}
              </>
            )}

            {tabValue === 1 && (
              <>
                {upcomingRegistrations.length === 0 ? (
                  <Alert severity="info">
                    Vous n'avez pas d'inscriptions aux événements à venir.
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {upcomingRegistrations.map(renderRegistrationCard)}
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default MyRegistrationsPage; 