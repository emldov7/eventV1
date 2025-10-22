import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
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
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Star as StarIcon,
  PlayArrow as PlayIcon,
  Link as LinkIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  VideoLibrary as VideoIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const VirtualEventDisplay = ({ event, onEventUpdate }) => {
  const [timeUntilEvent, setTimeUntilEvent] = useState('');
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interactionDialog, setInteractionDialog] = useState(false);
  const [interactionType, setInteractionType] = useState('');
  const [interactionContent, setInteractionContent] = useState('');
  const [rating, setRating] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [accessInfo, setAccessInfo] = useState(null);
  const [showAccessInfo, setShowAccessInfo] = useState(false);

  useEffect(() => {
    const timer = setInterval(updateTimeUntilEvent, 1000);
    loadInteractions();
    return () => clearInterval(timer);
  }, [event]);

  const updateTimeUntilEvent = () => {
    const now = new Date();
    const eventStart = new Date(event.start_date);
    const timeDiff = eventStart - now;

    if (timeDiff > 0) {
      setTimeUntilEvent(formatDistanceToNow(eventStart, { locale: fr, addSuffix: true }));
    } else if (new Date(event.end_date) > now) {
      setTimeUntilEvent("En cours");
    } else {
      setTimeUntilEvent("Terminé");
    }
  };

  const loadInteractions = async () => {
    try {
      const response = await api.get(`/events/${event.id}/interactions/`);
      setInteractions(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des interactions:', error);
    }
  };

  const handleInteraction = (type) => {
    setInteractionType(type);
    setInteractionDialog(true);
  };

  const submitInteraction = async () => {
    if (!interactionContent.trim() && interactionType !== 'like') {
      showSnackbar('Veuillez saisir un contenu', 'error');
      return;
    }

    if (interactionType === 'rating' && rating === 0) {
      showSnackbar('Veuillez donner une note', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        event: event.id,
        interaction_type: interactionType,
        content: interactionContent,
        rating: interactionType === 'rating' ? rating : null
      };

      await api.post('/virtual-interactions/', payload);
      
      showSnackbar('Interaction ajoutée avec succès !', 'success');
      setInteractionDialog(false);
      setInteractionContent('');
      setRating(0);
      setInteractionType('');
      
      // Recharger les interactions
      loadInteractions();
      
      if (onEventUpdate) {
        onEventUpdate();
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'interaction:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'ajout de l\'interaction';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAccessInfo = async () => {
    try {
      const response = await api.get(`/virtual-events/${event.virtual_details?.id}/access_info/`);
      setAccessInfo(response.data);
      setShowAccessInfo(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations d\'accès:', error);
      showSnackbar('Erreur lors de la récupération des informations d\'accès', 'error');
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      zoom: '🔵',
      youtube_live: '🔴',
      teams: '🔵',
      meet: '🟢',
      webex: '🔵',
      custom: '⚙️'
    };
    return icons[platform] || '🎥';
  };

  const getPlatformName = (platform) => {
    const names = {
      zoom: 'Zoom',
      youtube_live: 'YouTube Live',
      teams: 'Microsoft Teams',
      meet: 'Google Meet',
      webex: 'Cisco Webex',
      custom: 'Plateforme personnalisée'
    };
    return names[platform] || platform;
  };

  const getInteractionCount = (type) => {
    return interactions.filter(i => i.interaction_type === type).length;
  };

  const getAverageRating = () => {
    const ratings = interactions.filter(i => i.interaction_type === 'rating');
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isEventUpcoming = new Date(event.start_date) > new Date();
  const isEventOngoing = new Date(event.start_date) <= new Date() && new Date(event.end_date) >= new Date();
  const isEventPast = new Date(event.end_date) < new Date();

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

  const renderStreamingInfo = () => {
    if (!event.virtual_details) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoIcon /> Informations de Streaming
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="action" />
              <Typography variant="body2">
                <strong>Plateforme:</strong> {event.virtual_details.platform === 'youtube_live' ? 'YouTube Live' : 'Zoom'}
              </Typography>
            </Box>
            
            {event.virtual_details.meeting_url && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LinkIcon color="action" />
                <Typography variant="body2">
                  <strong>Lien:</strong> 
                  <a 
                    href={event.virtual_details.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'primary.main', textDecoration: 'underline', marginLeft: '4px' }}
                  >
                    Rejoindre
                  </a>
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {event.virtual_details.meeting_id && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon color="action" />
                <Typography variant="body2">
                  <strong>ID:</strong> {event.virtual_details.meeting_id}
                </Typography>
              </Box>
            )}
            
            {event.virtual_details.meeting_password && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon color="action" />
                <Typography variant="body2">
                  <strong>Mot de passe:</strong> {event.virtual_details.meeting_password}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {event.virtual_details.access_instructions && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              Instructions d'accès :
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
              {event.virtual_details.access_instructions}
            </Typography>
          </Box>
        )}

        {event.virtual_details.technical_requirements && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              ⚙️ Exigences techniques :
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
              {event.virtual_details.technical_requirements}
            </Typography>
          </Box>
        )}

        {/* Bouton pour rejoindre le stream */}
        {event.virtual_details.meeting_url && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<PlayIcon />}
              onClick={() => handleJoinStream(event)}
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              Rejoindre le Live
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <VideoCallIcon />
            </Avatar>
          }
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5">{event.title}</Typography>
              <Chip 
                label="Virtuel" 
                color="primary" 
                size="small"
                icon={<VideoCallIcon />}
              />
            </Box>
          }
          subheader={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {new Date(event.start_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(event.end_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {timeUntilEvent}
                </Typography>
              </Box>
            </Box>
          }
        />
        
        <CardContent>
          <Typography variant="body1" paragraph>
            {event.description}
          </Typography>
          
          {/* Informations de streaming */}
          {renderStreamingInfo()}
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon color="action" />
                <Typography variant="body2">
                  {event.registration_count || 0} participants inscrits
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1}>
                {getPlatformIcon(event.virtual_details?.platform)}
                <Typography variant="body2">
                  {getPlatformName(event.virtual_details?.platform)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Barre de progression pour le décompte */}
          {isEventUpcoming && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progression vers l'événement
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, Math.max(0, 
                  ((new Date() - new Date(event.created_at)) / (new Date(event.start_date) - new Date(event.created_at))) * 100
                ))}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Statistiques des interactions */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              icon={<FavoriteIcon />} 
              label={`${getInteractionCount('like')} j'aime`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              icon={<CommentIcon />} 
              label={`${getInteractionCount('comment')} commentaires`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              icon={<ShareIcon />} 
              label={`${getInteractionCount('share')} partages`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              icon={<StarIcon />} 
              label={`${getAverageRating()}/5 (${getInteractionCount('rating')} avis)`} 
              variant="outlined" 
              size="small"
            />
          </Box>
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={getAccessInfo}
            disabled={!isEventUpcoming && !isEventOngoing}
          >
            {isEventUpcoming ? 'Préparer l\'accès' : isEventOngoing ? 'Rejoindre maintenant' : 'Événement terminé'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => setInteractionDialog(true)}
          >
            Voir les interactions
          </Button>
        </CardActions>
      </Card>

      {/* Boutons d'interaction flottants */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Tooltip title="J'aime">
          <Fab
            color="primary"
            size="small"
            onClick={() => handleInteraction('like')}
          >
            <Badge badgeContent={getInteractionCount('like')} color="secondary">
              <FavoriteIcon />
            </Badge>
          </Fab>
        </Tooltip>
        
        <Tooltip title="Commenter">
          <Fab
            color="secondary"
            size="small"
            onClick={() => handleInteraction('comment')}
          >
            <Badge badgeContent={getInteractionCount('comment')} color="primary">
              <CommentIcon />
            </Badge>
          </Fab>
        </Tooltip>
        
        <Tooltip title="Partager">
          <Fab
            color="default"
            size="small"
            onClick={() => handleInteraction('share')}
          >
            <Badge badgeContent={getInteractionCount('share')} color="primary">
              <ShareIcon />
            </Badge>
          </Fab>
        </Tooltip>
        
        <Tooltip title="Évaluer">
          <Fab
            color="warning"
            size="small"
            onClick={() => handleInteraction('rating')}
          >
            <Badge badgeContent={getInteractionCount('rating')} color="primary">
              <StarIcon />
            </Badge>
          </Fab>
        </Tooltip>
      </Box>

      {/* Dialog des interactions */}
      <Dialog open={interactionDialog} onClose={() => setInteractionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {interactionType === 'like' && <FavoriteIcon color="primary" />}
            {interactionType === 'comment' && <CommentIcon color="primary" />}
            {interactionType === 'share' && <ShareIcon color="primary" />}
            {interactionType === 'rating' && <StarIcon color="primary" />}
            <Typography>
              {interactionType === 'like' && 'Ajouter un j\'aime'}
              {interactionType === 'comment' && 'Ajouter un commentaire'}
              {interactionType === 'share' && 'Partager l\'événement'}
              {interactionType === 'rating' && 'Évaluer l\'événement'}
            </Typography>
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setInteractionDialog(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {interactionType === 'comment' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Votre commentaire"
              value={interactionContent}
              onChange={(e) => setInteractionContent(e.target.value)}
              placeholder="Partagez votre expérience ou vos impressions..."
              sx={{ mb: 2 }}
            />
          )}
          
          {interactionType === 'rating' && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>Votre note</Typography>
              <Rating
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
                size="large"
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                {rating === 1 && 'Très mauvais'}
                {rating === 2 && 'Mauvais'}
                {rating === 3 && 'Moyen'}
                {rating === 4 && 'Bon'}
                {rating === 5 && 'Excellent'}
              </Typography>
            </Box>
          )}
          
          {interactionType === 'share' && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body1" paragraph>
                Partagez cet événement avec vos amis et collègues !
              </Typography>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showSnackbar('Lien copié dans le presse-papiers !', 'success');
                }}
              >
                Copier le lien
              </Button>
            </Box>
          )}

          {/* Liste des interactions existantes */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Interactions récentes</Typography>
          
          {interactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Aucune interaction pour le moment. Soyez le premier !
            </Typography>
          ) : (
            <List>
              {interactions.slice(0, 5).map((interaction) => (
                <ListItem key={interaction.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{interaction.user?.first_name?.[0] || 'U'}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {interaction.user?.first_name} {interaction.user?.last_name}
                        </Typography>
                        {interaction.interaction_type === 'rating' && (
                          <Rating value={interaction.rating} size="small" readOnly />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {interaction.content && (
                          <Typography variant="body2" component="span">
                            {interaction.content}
                          </Typography>
                        )}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(interaction.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setInteractionDialog(false)}>Annuler</Button>
          <Button
            onClick={submitInteraction}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog des informations d'accès */}
      <Dialog open={showAccessInfo} onClose={() => setShowAccessInfo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VideoCallIcon color="primary" />
            Informations d'accès
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {accessInfo ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Événement :</strong> {accessInfo.event_title}
                </Typography>
                <Typography variant="body2">
                  <strong>Début :</strong> {new Date(accessInfo.start_date).toLocaleString('fr-FR')}
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>🔑 Votre code d'accès</Typography>
                <Chip 
                  label={accessInfo.access_code} 
                  color="success" 
                  size="large"
                  sx={{ fontSize: '1.2rem', p: 2 }}
                />
              </Box>
              
              {accessInfo.meeting_id && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>📋 Informations de connexion</Typography>
                  <Typography variant="body2">
                    <strong>ID de réunion :</strong> {accessInfo.meeting_id}
                  </Typography>
                  {accessInfo.meeting_password && (
                    <Typography variant="body2">
                      <strong>Mot de passe :</strong> {accessInfo.meeting_password}
                    </Typography>
                  )}
                </Box>
              )}
              
              {accessInfo.meeting_url && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayIcon />}
                    href={accessInfo.meeting_url}
                    target="_blank"
                    sx={{ mb: 1 }}
                  >
                    Rejoindre la réunion
                  </Button>
                </Box>
              )}
              
              {accessInfo.access_instructions && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>📖 Instructions d'accès</Typography>
                  <Typography variant="body2">
                    {accessInfo.access_instructions}
                  </Typography>
                </Box>
              )}
              
              {accessInfo.technical_requirements && (
                <Box>
                  <Typography variant="h6" gutterBottom>💻 Exigences techniques</Typography>
                  <Typography variant="body2">
                    {accessInfo.technical_requirements}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAccessInfo(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VirtualEventDisplay;
