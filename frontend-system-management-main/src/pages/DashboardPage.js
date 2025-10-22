import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Scanner as ScannerIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';
import { fetchEventStatistics, fetchMyEvents, fetchUpcomingEvents } from '../store/slices/eventSlice';
import { formatPrice } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const DashboardPage = () => {
  const { locale } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { statistics, myEvents, upcomingEvents, loading, error } = useSelector((state) => state.events);

  // 🔍 Vérifier le rôle de l'utilisateur et rediriger si nécessaire
  useEffect(() => {
    if (user && user.profile) {
      const userRole = user.profile.role;
      console.log('🔍 DEBUG: DashboardPage - User role:', userRole);
      
      // Rediriger les super admins vers leur tableau de bord
      if (userRole === 'super_admin' || user.is_superuser) {
        console.log('🚀 Redirection vers Super Admin Dashboard');
        navigate('/dashboard/super-admin');
        return;
      }
      
      // Les organisateurs et participants restent sur cette page
      console.log('✅ Utilisateur autorisé sur cette page:', userRole);
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchEventStatistics());
    dispatch(fetchMyEvents());
    dispatch(fetchUpcomingEvents());
  }, [dispatch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'published':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      case 'postponed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <EditIcon />;
      case 'published':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <ErrorIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'postponed':
        return <WarningIcon />;
      default:
        return <EventIcon />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publié';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      case 'postponed':
        return 'Reporté';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Vérifier si les données sont disponibles
  const hasStatistics = statistics && Object.keys(statistics).length > 0;
  const hasMyEvents = myEvents && myEvents.length > 0;
  const hasUpcomingEvents = upcomingEvents && upcomingEvents.length > 0;

  // Déterminer le titre selon le rôle
  const getDashboardTitle = () => {
    if (!user || !user.profile) return 'Tableau de bord';
    
    const userRole = user.profile.role;
    switch (userRole) {
      case 'organizer':
        return 'Tableau de bord Organisateur';
      case 'participant':
        return 'Tableau de bord Participant';
      case 'super_admin':
        return 'Tableau de bord Super Admin';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        fontWeight: 700, 
        color: 'text.primary',
        mb: 3 
      }}>
        {getDashboardTitle()}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : error.detail || error.message || 'Une erreur est survenue'}
        </Alert>
      )}

      {/* Message si pas de données */}
      {!hasStatistics && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucune donnée de statistiques disponible. Créez votre premier événement pour commencer !
        </Alert>
      )}

      {/* Statistiques générales - Différentes selon le rôle */}
      {hasStatistics && (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          {/* Interface pour PARTICIPANTS */}
          {user?.profile?.role === 'participant' ? (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  border: '1px solid rgba(108,99,255,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(108,99,255,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <EventIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.total_events || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Événements disponibles
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid rgba(34,197,94,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(34,197,94,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <PeopleIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.total_registrations || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Mes inscriptions
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(59,130,246,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <TrendingUpIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.upcoming_events || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Événements à venir
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(245,158,11,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <CalendarIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    Gratuit
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Accès participant
                  </Typography>
                </Paper>
              </Grid>
            </>
          ) : (
            /* Interface pour ORGANISATEURS (comme avant) */
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  border: '1px solid rgba(108,99,255,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(108,99,255,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <EventIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.total_events || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Total événements
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid rgba(34,197,94,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(34,197,94,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <PeopleIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.total_registrations || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Total inscriptions
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(59,130,246,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <TrendingUpIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {statistics.upcoming_events || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Événements à venir
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ 
                  p: { xs: 2, md: 3 }, 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(245,158,11,0.15)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}>
                  <MoneyIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ 
                    fontWeight: '700', 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', md: '2.125rem' }
                  }}>
                    {formatPrice(statistics.total_revenue || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Revenus totaux
                  </Typography>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* Section des événements - Différente selon le rôle */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Pour les PARTICIPANTS - Section simple */}
        {user?.profile?.role === 'participant' ? (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ 
              p: { xs: 2, md: 3 },
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid rgba(108,99,255,0.1)',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(108,99,255,0.1)',
              },
              transition: 'all 0.3s ease-in-out',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}>
                  Découvrir les événements
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<EventIcon />} 
                  onClick={() => navigate('/dashboard/events')}
                  variant="contained"
                  sx={{ fontWeight: 600 }}
                >
                  Voir tous les événements
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Explorez les événements disponibles et inscrivez-vous à ceux qui vous intéressent !
              </Typography>
            </Paper>
          </Grid>
        ) : (
          /* Pour les ORGANISATEURS - Section complète */
          <>
            {/* Mes événements récents */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={2} sx={{ 
                p: { xs: 2, md: 3 },
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid rgba(108,99,255,0.1)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(108,99,255,0.1)',
                },
                transition: 'all 0.3s ease-in-out',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary',
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    Mes événements récents
                  </Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />} 
                    onClick={() => navigate('/create-event')}
                    variant="contained"
                    sx={{ fontWeight: 600 }}
                  >
                    Créer
                  </Button>
                </Box>

                {hasMyEvents ? (
                  <List>
                    {Array.isArray(myEvents) && myEvents.slice(0, 5).map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem sx={{ 
                          borderRadius: 2, 
                          mb: 1,
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          '&:hover': {
                            backgroundColor: 'rgba(108,99,255,0.05)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}>
                          <ListItemIcon sx={{ minWidth: { xs: 40, sm: 48 } }}>
                            {getStatusIcon(event.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ 
                                fontWeight: 600, 
                                color: 'text.primary',
                                fontSize: { xs: '0.875rem', md: '1rem' }
                              }}>
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {format(new Date(event.start_date), 'dd MMM yyyy à HH:mm', { locale: dateFnsLocale })}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={getStatusLabel(event.status)}
                                    color={getStatusColor(event.status)}
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                  {event.place_type === 'limited' && (
                                    <Chip
                                      label={`${event.current_registrations}/${event.max_capacity}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontWeight: 500 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => navigate(`/dashboard/events/${event.id}`)}
                              sx={{ 
                                fontWeight: 600,
                                borderColor: 'rgba(108,99,255,0.3)',
                                color: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  backgroundColor: 'rgba(108,99,255,0.05)',
                                }
                              }}
                            >
                              Voir
                            </Button>
                          </Box>
                        </ListItem>
                        {index < myEvents.slice(0, 5).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Aucun événement créé pour le moment
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/create-event')}
                      sx={{ fontWeight: 600 }}
                    >
                      Créer votre premier événement
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Événements à venir */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={2} sx={{ 
                p: { xs: 2, md: 3 },
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid rgba(34,197,94,0.1)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(34,197,94,0.1)',
                },
                transition: 'all 0.3s ease-in-out',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary',
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    Événements à venir
                  </Typography>
                  <Button 
                    size="small" 
                    startIcon={<CalendarIcon />} 
                    onClick={() => navigate('/dashboard/events')}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  >
                    Voir tout
                  </Button>
                </Box>

                {hasUpcomingEvents ? (
                  <List>
                    {Array.isArray(upcomingEvents) && upcomingEvents.slice(0, 5).map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem sx={{ 
                          borderRadius: 2, 
                          mb: 1,
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          '&:hover': {
                            backgroundColor: 'rgba(34,197,94,0.05)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}>
                          <ListItemIcon sx={{ minWidth: { xs: 40, sm: 48 } }}>
                            <CalendarIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ 
                                fontWeight: 600, 
                                color: 'text.primary',
                                fontSize: { xs: '0.875rem', md: '1rem' }
                              }}>
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {format(new Date(event.start_date), 'dd MMM yyyy à HH:mm', { locale: dateFnsLocale })}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={event.location}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                  />
                                  {event.place_type === 'limited' && (
                                    <Chip
                                      label={`${event.current_registrations}/${event.max_capacity}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontWeight: 500 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => navigate(`/dashboard/events/${event.id}`)}
                              sx={{ 
                                fontWeight: 600,
                                borderColor: 'rgba(34,197,94,0.3)',
                                color: 'success.main',
                                '&:hover': {
                                  borderColor: 'success.main',
                                  backgroundColor: 'rgba(34,197,94,0.05)',
                                }
                              }}
                            >
                              Voir
                            </Button>
                          </Box>
                        </ListItem>
                        {index < upcomingEvents.slice(0, 5).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Aucun événement à venir pour le moment
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* Section des actions rapides - Seulement pour organisateurs */}
      {user?.profile?.role !== 'participant' && (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              mb: 2,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}>
              Actions rapides
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ 
              p: { xs: 2, md: 2.5 },
              background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
              border: '1px solid rgba(245,158,11,0.1)',
              borderRadius: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(245,158,11,0.2)',
                borderColor: 'rgba(245,158,11,0.3)',
              },
              transition: 'all 0.3s ease-in-out',
            }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}>
                <ScannerIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 1,
                fontSize: { xs: '1rem', md: '1.125rem' }
              }}>
                Scanner billets
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Vérifiez les participants
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<ScannerIcon />} 
                onClick={() => navigate('/scan')}
                fullWidth
                sx={{ 
                  fontWeight: 600,
                  borderColor: 'rgba(245,158,11,0.3)',
                  color: 'warning.main',
                  '&:hover': {
                    borderColor: 'warning.main',
                    backgroundColor: 'rgba(245,158,11,0.05)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Scanner
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ 
              p: { xs: 2, md: 2.5 },
              background: 'linear-gradient(135deg, #ffffff 0%, #fce7f3 100%)',
              border: '1px solid rgba(236,72,153,0.1)',
              borderRadius: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(236,72,153,0.2)',
                borderColor: 'rgba(236,72,153,0.3)',
              },
              transition: 'all 0.3s ease-in-out',
            }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 12px rgba(236,72,153,0.3)',
              }}>
                <CalendarIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 1,
                fontSize: { xs: '1rem', md: '1.125rem' }
              }}>
                Tous les événements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Découvrez les événements
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                onClick={() => navigate('/events')}
                fullWidth
                sx={{ 
                  fontWeight: 600,
                  borderColor: 'rgba(236,72,153,0.3)',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    backgroundColor: 'rgba(236,72,153,0.05)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Découvrir
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardPage; 