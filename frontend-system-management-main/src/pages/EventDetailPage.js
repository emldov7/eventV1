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
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Skeleton,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  EventSeat as SeatIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Map as MapIcon,
  Directions as DirectionsIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchEventById, 
  cancelRegistration,
  fetchMyRegistrations
} from '../store/slices/eventSlice';
import { showSnackbar } from '../store/slices/uiSlice';
import { getImageUrl } from '../services/api';
import { useLocale } from '../hooks/useLocale';
import RegistrationModal from '../components/RegistrationModal';
import WaitlistManagement from '../components/WaitlistManagement';
import RefundManagement from '../components/RefundManagement';
import VirtualEventRecordingManager from '../components/VirtualEventRecordingManager';
import { eventAPI } from '../services/api';
import api from '../services/api';

const EventDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { id } = useParams();
  const { formatDate, formatPrice } = useLocale();
  const { 
    currentEvent, 
    loading, 
    myRegistrations, 
    registrationLoading, 
    registrationError 
  } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  // Vérifier si l'utilisateur est inscrit à cet événement
  const userRegistration = Array.isArray(myRegistrations)
    ? myRegistrations.find(reg => (Number(reg.event) === Number(id) || Number(reg.event?.id) === Number(id)))
    : null;
  const canCancel = !!(userRegistration && ['pending', 'confirmed', 'waitlisted', 'attended'].includes(userRegistration.status));
  
  // Vérifier si on peut annuler (plus de 12h avant l'événement)
  const canCancelRegistration = canCancel && (() => {
    if (!currentEvent?.start_date) return false;
    const eventStart = new Date(currentEvent.start_date);
    const now = new Date();
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
    return hoursUntilEvent > 12;
  })();
  const isConfirmed = !!(userRegistration && ['confirmed', 'attended'].includes(userRegistration.status));
  const isPending = !!(userRegistration && userRegistration.status === 'pending');
  const isWaitlisted = !!(userRegistration && userRegistration.status === 'waitlisted');
  const isCancelled = !!(userRegistration && userRegistration.status === 'cancelled');
  
  // État pour le modal d'inscription
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  // Charger les inscriptions de l'utilisateur si connecté
  useEffect(() => {
    if (user) {
      dispatch(fetchMyRegistrations());
    }
  }, [dispatch, user]);

  // Fonction pour ouvrir le modal d'inscription
  const handleRegisterClick = () => {
    // 🎯 NOUVELLE LOGIQUE : Permettre aux visiteurs de s'inscrire sans compte
    // Plus besoin de rediriger vers /login - on ouvre directement le modal
    
    // Vérifier si l'événement est complet et que la liste d'attente est désactivée
    if (currentEvent.place_type === 'limited' && 
        currentEvent.max_capacity && 
        (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) <= 0 && 
        !currentEvent.enable_waitlist) {
      dispatch(showSnackbar({ 
        message: 'Événement complet - Inscriptions fermées', 
        severity: 'error' 
      }));
      return;
    }
    
    setRegistrationModalOpen(true);
  };

  // Fonction pour fermer le modal d'inscription
  const handleRegistrationModalClose = () => {
    setRegistrationModalOpen(false);
    // Recharger l'événement et les inscriptions pour mettre à jour les informations
    dispatch(fetchEventById(id));
    if (user) {
      dispatch(fetchMyRegistrations());
    }
  };

  // Fonction pour rejoindre le stream avec vérification de paiement
  const handleJoinStream = async () => {
    try {
      // Appeler d'abord l'API sécurisée pour vérifier le paiement
      const response = await eventAPI.post(`/streaming/${currentEvent.id}/join/`);
      if (response.data.success) {
        // Rediriger vers l'URL sécurisée
        window.open(response.data.stream_info.meeting_url, '_blank');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Paiement non confirmé
        alert('Accès refusé - Vous devez avoir un billet payé et confirmé pour accéder à ce stream');
      } else {
        // Autre erreur
        alert('Erreur lors de l\'accès au stream: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // Charger la liste des participants si l'utilisateur est l'organisateur
  useEffect(() => {
    const loadParticipants = async () => {
      if (!currentEvent || !user) return;
      if (currentEvent.organizer?.id !== user.id && !user.is_staff) return;
      setLoadingParticipants(true);
      try {
        const res = await eventAPI.getEventParticipants(currentEvent.id);
        setParticipants(res.data || []);
      } catch (_) {}
      setLoadingParticipants(false);
    };
    loadParticipants();
  }, [currentEvent, user]);

  const handleExport = async (type) => {
    if (!currentEvent) return;
    try {
      let res;
      if (type === 'csv') {
        res = await eventAPI.exportRegistrationsCSV(currentEvent.id);
      } else if (type === 'excel') {
        res = await eventAPI.exportRegistrationsExcel(currentEvent.id);
      } else {
        throw new Error('Type d\'export non supporté');
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${currentEvent.title}_${type}.${type === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(showSnackbar({ message: `Export ${type.toUpperCase()} réussi`, severity: 'success' }));
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      dispatch(showSnackbar({ message: 'Erreur lors de l\'export', severity: 'error' }));
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    try {
      await dispatch(cancelRegistration(userRegistration.id)).unwrap();
      dispatch(showSnackbar({ message: 'Inscription annulée avec succès', severity: 'success' }));
      // Recharger les données
      dispatch(fetchEventById(id));
      dispatch(fetchMyRegistrations());
    } catch (error) {
      dispatch(showSnackbar({ message: 'Erreur lors de l\'annulation', severity: 'error' }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentEvent.title,
        text: currentEvent.short_description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      dispatch(showSnackbar({ message: 'Lien copié dans le presse-papiers', severity: 'success' }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 3 }} />
            <Skeleton variant="text" height={48} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={24} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!currentEvent) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="text.secondary">
          Événement non trouvé
        </Typography>
      </Container>
    );
  }

  const renderEventInfo = () => (
    <Paper elevation={1} sx={{ 
      p: 3, 
      mb: 3,
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: 2,
    }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDate(currentEvent.start_date)}
            </Typography>
          </Box>
          {currentEvent.end_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimeIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Fin: {formatDate(currentEvent.end_date)}
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {currentEvent.location}
              </Typography>
              </Box>
          {currentEvent.venue && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              {currentEvent.venue}
              </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MoneyIcon sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
              {currentEvent.price_range_display || (currentEvent.is_free ? 'Gratuit' : formatPrice(currentEvent.price))}
                </Typography>
          </Box>
          {currentEvent.place_type === 'limited' && currentEvent.max_capacity && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SeatIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                {currentEvent.current_registrations || 0} / {currentEvent.max_capacity} places
                </Typography>
              </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {currentEvent.registration_count || 0} inscrits
            </Typography>
          </Box>
          {currentEvent.category && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CategoryIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                {currentEvent.category.name}
                  </Typography>
                </Box>
              )}
        </Grid>
      </Grid>
    </Paper>
  );

  const renderOrganizerInfo = () => (
    <Paper elevation={1} sx={{ 
      p: 3, 
      mb: 3,
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: 2,
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Organisateur
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          src={currentEvent.organizer?.avatar} 
          sx={{ width: 56, height: 56, mr: 2 }}
        >
          {currentEvent.organizer?.first_name?.[0]}{currentEvent.organizer?.last_name?.[0]}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {currentEvent.organizer?.first_name} {currentEvent.organizer?.last_name}
                    </Typography>
          {currentEvent.organizer?.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {currentEvent.organizer.email}
                    </Typography>
            </Box>
                  )}
                </Box>
      </Box>
      
      {currentEvent.organizer?.bio && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentEvent.organizer.bio}
                </Typography>
              )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {currentEvent.organizer?.website && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<WebsiteIcon />}
            href={currentEvent.organizer.website}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: 1.5 }}
          >
            Site web
          </Button>
        )}
        {currentEvent.organizer?.phone && (
                <Button
                  variant="outlined"
            size="small"
            startIcon={<PhoneIcon />}
            href={`tel:${currentEvent.organizer.phone}`}
            sx={{ borderRadius: 1.5 }}
          >
            Téléphone
                </Button>
              )}
      </Box>
    </Paper>
  );

  const renderTags = () => (
    currentEvent.tags && currentEvent.tags.length > 0 && (
      <Paper elevation={1} sx={{ 
        p: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 2,
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Tags
              </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {currentEvent.tags.map((tag) => (
            <Chip
              key={tag.id}
              icon={<TagIcon />}
              label={tag.name}
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(79,70,229,0.3)',
                color: 'primary.main',
                fontWeight: 500,
              }}
            />
          ))}
        </Box>
      </Paper>
    )
  );

  const renderParticipants = () => (
    <Paper elevation={1} sx={{ 
      p: 3, 
      mb: 3,
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: 2,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Participants ({participants.length})
                </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleExport('csv')}
            sx={{ borderRadius: 1.5 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleExport('excel')}
            sx={{ borderRadius: 1.5 }}
          >
            Export Excel
          </Button>
        </Box>
                </Box>
      
                {loadingParticipants ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Chargement des participants...</Typography>
                      </Box>
      ) : participants.length > 0 ? (
        <List>
          {participants.map((participant, index) => (
            <React.Fragment key={participant.id}>
              <ListItem>
                <ListItemIcon>
                  <Avatar src={participant.user?.avatar}>
                    {participant.guest_display_name?.[0] || participant.user?.first_name?.[0] || '?'}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={participant.guest_display_name || `${participant.user?.first_name} ${participant.user?.last_name}`}
                  secondary={`${participant.guest_display_email || participant.user?.email} • ${participant.ticket_type_name || 'Par défaut'} • ${formatPrice(participant.price_paid || 0)}${participant.session_type_name ? ` • Session: ${participant.session_type_name}` : ''}`}
                />
                <Chip
                  label={participant.status}
                  size="small"
                  color={participant.status === 'confirmed' ? 'success' : 'default'}
                />
              </ListItem>
              {index < participants.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Aucun participant inscrit pour le moment
          </Typography>
                  </Box>
                )}
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête de l'événement */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}>
            {currentEvent.title}
              </Typography>
              
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleShare} sx={{ color: 'primary.main' }}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={() => setIsBookmarked(!isBookmarked)} sx={{ color: 'primary.main' }}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
            <IconButton onClick={() => setIsLiked(!isLiked)} sx={{ color: 'error.main' }}>
              {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>
              </Box>

        {currentEvent.short_description && (
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, fontWeight: 400 }}>
            {currentEvent.short_description}
                  </Typography>
        )}

        {/* Statut de l'événement */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            label={currentEvent.status}
            color={currentEvent.status === 'published' ? 'success' : 'default'}
            sx={{ fontWeight: 500 }}
          />
          {currentEvent.is_free && (
            <Chip
              label="Gratuit"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Colonne principale */}
        <Grid item xs={12} md={8}>
          {/* Image principale */}
          {currentEvent.poster ? (
            <CardMedia
              component="img"
              height="400"
              image={getImageUrl(currentEvent.poster)}
              alt={currentEvent.title}
              sx={{ 
                borderRadius: 2, 
                mb: 3,
                objectFit: 'cover',
                width: '100%'
              }}
            />
          ) : (
            <Box
              sx={{
                height: 400,
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                mb: 3,
              }}
            >
              <ImageIcon sx={{ fontSize: 56, opacity: 0.8 }} />
                </Box>
              )}

          {/* Informations de base */}
          {renderEventInfo()}

          {/* Description détaillée */}
          {currentEvent.description && (
            <Paper elevation={1} sx={{ 
              p: 3, 
              mb: 3,
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Description
                  </Typography>
                </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {currentEvent.description}
              </Typography>
            </Paper>
          )}

          {/* Tags */}
          {renderTags()}

          {/* Informations sur l'organisateur */}
          {renderOrganizerInfo()}

          {/* Participants (si organisateur) */}
          {(currentEvent.organizer?.id === user?.id || user?.is_staff) && renderParticipants()}

          {/* Gestionnaire de streaming pour événements virtuels */}
          {currentEvent.event_type === 'virtual' && (
            <Paper elevation={1} sx={{ 
              p: 3, 
              mb: 3,
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 2,
            }}>
              {/* L'AUTEUR de l'événement OU le SUPERADMIN peut gérer le streaming */}
              {user && (user.id === currentEvent.organizer?.id || user.is_superuser) ? (
                <VirtualEventRecordingManager 
                  event={currentEvent} 
                  onUpdate={() => {
                    // Rafraîchir les données de l'événement si nécessaire
                    dispatch(fetchEventById(id));
                  }}
                />
              ) : (
                /* Les autres utilisateurs voient les infos de streaming */
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    🎥 Informations de Streaming
                  </Typography>
                  
                  {currentEvent.virtual_details?.meeting_url ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Cliquez sur le bouton ci-dessous pour rejoindre l'événement virtuel
                      </Typography>
                      
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        startIcon={<VideoIcon />}
                        onClick={handleJoinStream}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        Rejoindre le Live
                      </Button>
                      
                      {currentEvent.virtual_details?.access_instructions && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Instructions d'accès :
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            {currentEvent.virtual_details.access_instructions}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Le lien de connexion sera disponible bientôt
                      </Typography>
                      <Chip 
                        label="En attente" 
                        color="warning" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* Colonne latérale */}
        <Grid item xs={12} md={4}>
          {/* Carte d'inscription */}
          <Paper elevation={2} sx={{ 
            p: 3, 
            mb: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 2,
            position: 'sticky',
            top: 24,
          }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
              {currentEvent.ticket_types && currentEvent.ticket_types.length > 0 ? 
                'Types de billets disponibles' : 
                (currentEvent.is_free ? 'Inscription gratuite' : `Prix: ${formatPrice(currentEvent.price)}`)
              }
            </Typography>

            {userRegistration ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert 
                  severity={
                    isConfirmed ? 'success' : 
                    isPending ? 'info' : 
                    isCancelled ? 'error' : 
                    'warning'
                  } 
                  sx={{ mb: 2 }}
                >
                  {isConfirmed ? 'Inscription confirmée !' : 
                   isPending ? 'Inscription en attente de confirmation' : 
                   isWaitlisted ? 'Vous êtes sur liste d\'attente' : 
                   isCancelled ? 'Votre inscription est annulée' :
                   'Inscription en cours de traitement'}
                </Alert>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Statut: {userRegistration.status}
              </Typography>
              
                {canCancel && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={handleCancelRegistration}
                      disabled={!canCancelRegistration}
                      sx={{ mb: 1 }}
                    >
                      Annuler l'inscription
                    </Button>
                    {!canCancelRegistration && (
                      <Typography variant="caption" color="warning.main" sx={{ display: 'block', textAlign: 'center', fontStyle: 'italic' }}>
                        Annulation impossible moins de 12h avant l'événement
                      </Typography>
                    )}
                  </Box>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/my-registrations')}
                >
                  Voir mes inscriptions
                </Button>

                {/* Boutons de gestion pour l'organisateur (même inscrit) */}
                {user && user.id === currentEvent.organizer?.id && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => setWaitlistModalOpen(true)}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          backgroundColor: 'warning.light',
                          color: 'warning.dark',
                        },
                      }}
                    >
                      Gérer les listes d'attente
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => setRefundModalOpen(true)}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderColor: 'error.main',
                        color: 'error.main',
                        '&:hover': {
                          borderColor: 'error.dark',
                          backgroundColor: 'error.light',
                          color: 'error.dark',
                        },
                      }}
                    >
                      💰 Gérer les remboursements
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {currentEvent.ticket_types && currentEvent.ticket_types.length > 0 ? (
                    // 🎯 NOUVEAU : Afficher les places des types de billets personnalisés
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {currentEvent.ticket_types.map((ticketType, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" component="span">
                            {ticketType.name} - {formatPrice(ticketType.price)}
                          </Typography>
                          <Typography variant="body2" component="span" color={ticketType.available_quantity > 0 ? 'success.main' : 'warning.main'}>
                            {ticketType.quantity ? `${ticketType.available_quantity}/${ticketType.quantity} places` : 'Illimité'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : currentEvent.place_type === 'limited' && currentEvent.max_capacity ? (
                    // 🎯 LOGIQUE EXISTANTE : Billets par défaut
                    (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) > 0 ? (
                      `${currentEvent.max_capacity - (currentEvent.current_registrations || 0)} places disponibles`
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" component="span" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                            {currentEvent.max_capacity} places
                          </Typography>
                          <Typography variant="body2" component="span" color="warning.main" sx={{ fontWeight: 500 }}>
                            (Complet)
                          </Typography>
                        </Box>
                        {currentEvent.enable_waitlist ? (
                          <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                            Vous pouvez vous inscrire et serez placé sur liste d'attente
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                            Événement complet - Inscriptions fermées
                          </Typography>
                        )}
                      </Box>
                    )
                  ) : (
                    'Places illimitées'
                  )}
                </Typography>

                {/* 🎯 NOUVEAU MESSAGE : Information pour les visiteurs */}
                {!user && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    👋 <strong>Visiteur ?</strong> Vous pouvez vous inscrire sans créer de compte ! 
                    Remplissez simplement le formulaire avec vos informations.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleRegisterClick}
                  disabled={
                    currentEvent.status !== 'published' || 
                    new Date(currentEvent.end_date) < new Date() ||
                    // 🎯 LOGIQUE UNIFIÉE : Désactiver si l'événement est complet et que la liste d'attente est désactivée
                    (currentEvent.place_type === 'limited' && 
                     currentEvent.max_capacity && 
                     (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) <= 0 && 
                     !currentEvent.enable_waitlist)
                  }
                  sx={{
                    background: (() => {
                      if (currentEvent.status !== 'published' || new Date(currentEvent.end_date) < new Date()) {
                        return '#ccc';
                      }
                      if (currentEvent.place_type === 'limited' && 
                          currentEvent.max_capacity && 
                          (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) <= 0 && 
                          !currentEvent.enable_waitlist) {
                        return '#f44336'; // Rouge pour SOLD OUT
                      }
                      return 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)';
                    })(),
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': {
                      background: (() => {
                        if (currentEvent.status !== 'published' || new Date(currentEvent.end_date) < new Date()) {
                          return '#ccc';
                        }
                        if (currentEvent.place_type === 'limited' && 
                            currentEvent.max_capacity && 
                            (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) <= 0 && 
                            !currentEvent.enable_waitlist) {
                          return '#d32f2f'; // Rouge foncé pour SOLD OUT
                        }
                        return 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)';
                      })(),
                    },
                    transform: 'translateY(-2px)',
                  }}
                >
                  {(() => {
                    if (currentEvent.status !== 'published') return 'Inscriptions fermées';
                    if (new Date(currentEvent.end_date) < new Date()) return 'Événement terminé';
                    if (currentEvent.place_type === 'limited' && 
                        currentEvent.max_capacity && 
                        (currentEvent.max_capacity - (currentEvent.current_registrations || 0)) <= 0 && 
                        !currentEvent.enable_waitlist) {
                      return 'SOLD OUT';
                    }
                    // 🎯 NOUVEAU TEXTE : Plus clair pour les visiteurs
                    if (!user) {
                      return 'S\'inscrire (Visiteur)';
                    }
                    return 'S\'inscrire';
                  })()}
                </Button>

                {/* Boutons de gestion pour l'organisateur (quand pas inscrit) */}
                {user && user.id === currentEvent.organizer?.id && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => setWaitlistModalOpen(true)}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          backgroundColor: 'warning.light',
                          color: 'warning.dark',
                        },
                      }}
                    >
                      Gérer les listes d'attente
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => setRefundModalOpen(true)}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderColor: 'error.main',
                        color: 'error.main',
                        '&:hover': {
                          borderColor: 'error.dark',
                          backgroundColor: 'error.light',
                          color: 'error.dark',
                        },
                      }}
                    >
                      💰 Gérer les remboursements
                    </Button>
                  </Box>
                )}

                {currentEvent.status !== 'published' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Cet événement n'est pas encore ouvert aux inscriptions
                  </Typography>
                )}
                </Box>
            )}
          </Paper>

          {/* Section pour rejoindre le live (événements virtuels) */}
          {currentEvent.event_type === 'virtual' && userRegistration && isConfirmed && (
            <Paper elevation={2} sx={{ 
              p: 3, 
              mb: 3,
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%)',
              border: '2px solid #4caf50',
              borderRadius: 2,
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                🎥 Rejoindre le Live
              </Typography>
              
              {currentEvent.virtual_details?.meeting_url ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Cliquez sur le bouton ci-dessous pour rejoindre l'événement virtuel
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    startIcon={<VideoIcon />}
                    onClick={async () => {
                      try {
                        // Appeler d'abord l'API sécurisée pour vérifier le paiement
                        const response = await api.post(`/streaming/${currentEvent.id}/join/`);
                        if (response.data.success) {
                          // Rediriger vers l'URL sécurisée
                          window.open(response.data.stream_info.meeting_url, '_blank');
                        }
                      } catch (error) {
                        if (error.response?.status === 403) {
                          // Paiement non confirmé
                          alert('Accès refusé - Vous devez avoir un billet payé et confirmé pour accéder à ce stream');
                        } else {
                          // Autre erreur
                          alert('Erreur lors de l\'accès au stream: ' + (error.response?.data?.error || error.message));
                        }
                      }
                    }}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    Rejoindre le Live
                  </Button>
                  
                  {currentEvent.virtual_details?.access_instructions && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                        Instructions d'accès :
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {currentEvent.virtual_details.access_instructions}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Le lien de connexion sera disponible bientôt
                  </Typography>
                  <Chip 
                    label="En attente" 
                    color="warning" 
                    variant="outlined"
                  />
                </Box>
              )}
            </Paper>
          )}

          {/* Carte de localisation */}
          <Paper elevation={1} sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 2,
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Localisation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {currentEvent.location}
                </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DirectionsIcon />}
              href={`https://maps.google.com/?q=${encodeURIComponent(currentEvent.location)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir sur la carte
            </Button>
          </Paper>
          </Grid>
      </Grid>

      {/* Modal d'inscription */}
      <RegistrationModal
        open={registrationModalOpen}
        onClose={handleRegistrationModalClose}
        event={currentEvent}
      />

      {/* Modal de gestion des listes d'attente */}
      <WaitlistManagement
        open={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        event={currentEvent}
      />

      {/* Modal de gestion des remboursements */}
      <RefundManagement
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        event={currentEvent}
      />
    </Container>
  );
};

export default EventDetailPage; 