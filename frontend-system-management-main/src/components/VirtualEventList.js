import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow,
  ThumbUp,
  Comment,
  Share,
  Star,
  VideoLibrary,
  AccessTime,
  Group,
  LocationOn,
  CalendarToday,
  PlayCircle,
  RecordVoiceOver,
  ScreenShare,
  Chat,
  Schedule,
  Add,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const VirtualEventList = ({ showMyEvents = false, onEventClick }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [interactionDialog, setInteractionDialog] = useState({ open: false, event: null });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Interaction form states
  const [interactionType, setInteractionType] = useState('like');
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchVirtualEvents();
  }, [showMyEvents]);

  const fetchVirtualEvents = async () => {
    try {
      setLoading(true);
      const endpoint = showMyEvents ? '/events/my_events/' : '/events/virtual_events/';
      const response = await api.get(endpoint, {
        params: { event_type: 'virtual' }
      });
      setEvents(response.data.results || response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      showSnackbar('Erreur lors de la récupération des événements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (eventId, type, content = '', ratingValue = null) => {
    try {
      const interactionData = {
        event: eventId,
        interaction_type: type,
        content: content,
        rating: ratingValue
      };

      const response = await api.post('/virtual-interactions/', interactionData);
      
      if (response.data) {
        showSnackbar('Interaction ajoutée avec succès', 'success');
        setInteractionDialog({ open: false, event: null });
        setCommentText('');
        setRating(0);
        fetchVirtualEvents(); // Rafraîchir pour mettre à jour les statistiques
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'interaction:', error);
      showSnackbar('Erreur lors de l\'ajout de l\'interaction', 'error');
    }
  };

  const handleQuickInteraction = (eventId, type) => {
    if (type === 'like') {
      handleInteraction(eventId, 'like');
    } else {
      setInteractionDialog({ open: true, event: events.find(e => e.id === eventId) });
      setInteractionType(type);
    }
  };

  const submitInteraction = () => {
    const { event } = interactionDialog;
    if (!event) return;

    let content = '';
    let ratingValue = null;

    if (interactionType === 'comment') {
      content = commentText;
      if (!content.trim()) {
        showSnackbar('Veuillez saisir un commentaire', 'error');
        return;
      }
    } else if (interactionType === 'rating') {
      ratingValue = rating;
      if (ratingValue === 0) {
        showSnackbar('Veuillez donner une note', 'error');
        return;
      }
    }

    handleInteraction(event.id, interactionType, content, ratingValue);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (now < startDate) {
      const timeUntil = formatDistanceToNow(startDate, { locale: fr });
      return { status: 'upcoming', text: `Commence dans ${timeUntil}`, color: 'primary' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', text: 'En cours', color: 'success' };
    } else {
      return { status: 'ended', text: 'Terminé', color: 'default' };
    }
  };

  const getInteractionStats = (event) => {
    if (!event.interaction_count) return { likes: 0, comments: 0, shares: 0, ratings: 0 };
    
    return {
      likes: event.interaction_count.likes || 0,
      comments: event.interaction_count.comments || 0,
      shares: event.interaction_count.shares || 0,
      ratings: event.interaction_count.ratings || 0
    };
  };

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      navigate(`/events/${event.id}`);
    }
  };

  const handleStartStream = async (event) => {
    try {
      // Ici vous pouvez ajouter la logique pour lancer le streaming
      console.log(`🎥 Lancement du stream pour l'événement: ${event.title}`);
      
      // Rediriger vers la page de streaming ou ouvrir le lien
      if (event.virtual_details?.meeting_url) {
        window.open(event.virtual_details.meeting_url, '_blank');
      } else {
        showSnackbar('Lien de streaming non disponible', 'warning');
      }
    } catch (error) {
      console.error('Erreur lors du lancement du stream:', error);
      showSnackbar('Erreur lors du lancement du stream', 'error');
    }
  };

  const handleJoinStream = async (event) => {
    try {
      // Appeler d'abord l'API sécurisée pour vérifier le paiement
      const response = await api.post(`/api/streaming/${event.id}/join/`);
      if (response.data.success) {
        // Rediriger vers l'URL sécurisée
        window.open(response.data.stream_info.meeting_url, '_blank');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Paiement non confirmé
        showSnackbar('Accès refusé - Vous devez avoir un billet payé et confirmé pour accéder à ce stream', 'error');
      } else {
        // Autre erreur
        showSnackbar('Erreur lors de l\'accès au stream: ' + (error.response?.data?.error || error.message), 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Chargement des événements virtuels...
        </Typography>
      </Box>
    );
  }

  const filteredEvents = events.filter(event => {
    if (selectedTab === 0) return true; // Tous
    if (selectedTab === 1) return getEventStatus(event).status === 'upcoming';
    if (selectedTab === 2) return getEventStatus(event).status === 'ongoing';
    if (selectedTab === 3) return getEventStatus(event).status === 'ended';
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibrary /> Événements Virtuels
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/virtual-events/analytics')}
            startIcon={<AnalyticsIcon />}
          >
            Analytics
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/virtual-events/create')}
            startIcon={<Add />}
          >
            Créer un événement virtuel
          </Button>
        </Box>
      </Box>

      {/* Onglets de filtrage */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`Tous (${events.length})`} />
          <Tab label="À venir" />
          <Tab label="En cours" />
          <Tab label="Terminés" />
        </Tabs>
      </Box>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucun événement virtuel trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTab === 0 ? 'Il n\'y a pas encore d\'événements virtuels.' : 
               'Aucun événement dans cette catégorie.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const stats = getInteractionStats(event);
            const isVirtual = event.is_virtual;
            const hasRecording = event.virtual_details?.recording_available;

            return (
              <Grid item xs={12} md={6} lg={4} key={event.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  {/* Image de l'événement */}
                  {event.image && (
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${event.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      {/* Badge de statut */}
                      <Chip
                        label={status.text}
                        color={status.color}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8
                        }}
                      />
                      
                      {/* Badge d'enregistrement */}
                      {hasRecording && (
                        <Chip
                          icon={<PlayCircle />}
                          label="Rediffusion"
                          color="success"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8
                          }}
                        />
                      )}
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Titre et type */}
                    <Typography variant="h6" gutterBottom noWrap>
                      {event.title}
                    </Typography>
                    
                    <Chip
                      label={event.event_type === 'virtual' ? 'Virtuel' : 'Physique'}
                      color={event.event_type === 'virtual' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    {/* Informations de base */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(event.start_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDistanceToNow(new Date(event.start_date), { locale: fr })}
                        </Typography>
                      </Box>

                      {isVirtual && event.virtual_details && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.virtual_details.platform}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Group sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {event.current_registrations || 0} participants
                          {event.max_participants && ` / ${event.max_participants}`}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    {event.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {event.description}
                      </Typography>
                    )}

                    {/* Statistiques d'interaction */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Interactions :
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`👍 ${stats.likes}`} />
                        <Chip size="small" label={`💬 ${stats.comments}`} />
                        <Chip size="small" label={`📤 ${stats.shares}`} />
                        <Chip size="small" label={`⭐ ${stats.ratings}`} />
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    {/* Boutons d'action */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="J'aime">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickInteraction(event.id, 'like')}
                        >
                          <ThumbUp />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Commenter">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickInteraction(event.id, 'comment')}
                        >
                          <Comment />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Partager">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickInteraction(event.id, 'share')}
                        >
                          <Share />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Évaluer">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickInteraction(event.id, 'rating')}
                        >
                          <Star />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Boutons de streaming */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isVirtual && event.virtual_details?.meeting_url && (
                        <>
                          {/* Bouton pour l'organisateur - Lancer le stream */}
                          {(event.organizer === event.current_user_id || event.is_organizer) && (
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => handleStartStream(event)}
                            >
                              Lancer le stream
                            </Button>
                          )}
                          
                          {/* Bouton pour les participants - Rejoindre le stream */}
                          {(!event.organizer || event.organizer !== event.current_user_id) && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => handleJoinStream(event)}
                            >
                              Rejoindre le live
                            </Button>
                          )}
                        </>
                      )}
                      
                      {/* Bouton principal */}
                      <Button
                        variant="contained"
                        startIcon={hasRecording ? <PlayCircle /> : <PlayArrow />}
                        onClick={() => handleEventClick(event)}
                      >
                        {hasRecording ? 'Voir la rediffusion' : 'Voir les détails'}
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog d'interaction */}
      <Dialog 
        open={interactionDialog.open} 
        onClose={() => setInteractionDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {interactionType === 'comment' && 'Ajouter un commentaire'}
          {interactionType === 'rating' && 'Évaluer l\'événement'}
          {interactionType === 'share' && 'Partager l\'événement'}
        </DialogTitle>
        <DialogContent>
          {interactionType === 'comment' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Votre commentaire"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Partagez votre expérience..."
              sx={{ mt: 1 }}
            />
          )}
          
          {interactionType === 'rating' && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Donnez une note à cet événement
              </Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                size="large"
                sx={{ fontSize: 48 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {rating === 1 && 'Très mauvais'}
                {rating === 2 && 'Mauvais'}
                {rating === 3 && 'Moyen'}
                {rating === 4 && 'Bon'}
                {rating === 5 && 'Excellent'}
              </Typography>
            </Box>
          )}
          
          {interactionType === 'share' && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Partager cet événement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                L'événement sera marqué comme partagé dans vos statistiques.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractionDialog({ open: false, event: null })}>
            Annuler
          </Button>
          <Button onClick={submitInteraction} variant="contained">
            {interactionType === 'comment' && 'Commenter'}
            {interactionType === 'rating' && 'Évaluer'}
            {interactionType === 'share' && 'Partager'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VirtualEventList;
