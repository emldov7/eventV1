import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  RecordVoiceOver as RecordIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  LiveTv as LiveIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const VirtualEventRecordingManager = ({ event, onUpdate }) => {
  const [streamStatus, setStreamStatus] = useState('idle'); // idle, starting, live, paused, stopped
  const [recordingStatus, setRecordingStatus] = useState('not_recording'); // not_recording, recording, paused, completed
  const [viewerCount, setViewerCount] = useState(0);
  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    quality: '1080p',
    frameRate: '30fps',
    enableChat: true,
    enableRecording: true,
    enableAnalytics: true
  });

  useEffect(() => {
    console.log('🔍 LOG CRITIQUE: useEffect appelé');
    console.log('🔍 LOG CRITIQUE: Event:', event);
    
    if (event) {
      console.log('🔍 LOG CRITIQUE: loadStreamStatus() appelé depuis useEffect');
      loadStreamStatus();
      // Polling pour mettre à jour le statut en temps réel
      const interval = setInterval(() => {
        console.log('🔍 LOG CRITIQUE: Polling loadStreamStatus() appelé');
        loadStreamStatus();
      }, 10000); // Toutes les 10 secondes
      return () => clearInterval(interval);
    }
  }, [event]);

  const loadStreamStatus = async () => {
    console.log('🔍 LOG CRITIQUE: loadStreamStatus() appelé');
    console.log('🔍 LOG CRITIQUE: Event ID:', event?.id);
    
    try {
      const response = await api.get(`/streaming/${event.id}/status/`);
      console.log('🔍 LOG CRITIQUE: API response:', response.data);
      if (response.data.success) {
        setStreamStatus(response.data.status);
        setStreamInfo(response.data.stream_info);
        setViewerCount(response.data.viewer_count || 0);
        
        // Logs pour debug
        console.log('✅ Statut du stream chargé:', response.data);
      } else {
        console.warn('⚠️ Statut du stream non disponible:', response.data);
        // Si pas de statut, essayer de déterminer l'état
        if (response.data.stream_info?.meeting_id) {
          // Si le stream a un meeting_id mais n'est pas en direct, c'est qu'il est configuré
          setStreamStatus('configured');
          setStreamInfo(response.data.stream_info);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du statut du stream:', error);
      // En cas d'erreur, essayer de récupérer les infos de base
      if (event.virtual_details?.meeting_id) {
        setStreamStatus('configured');
        setStreamInfo({
          meeting_id: event.virtual_details.meeting_id,
          meeting_url: event.virtual_details.meeting_url,
          watch_url: event.virtual_details.meeting_url,
          stream_key: event.virtual_details.meeting_id
        });
      }
    }
  };

  const configureStream = async () => {
    console.log('🔍 LOG CRITIQUE: configureStream() appelé');
    console.log('🔍 LOG CRITIQUE: Event ID:', event?.id);
    console.log('🔍 LOG CRITIQUE: User:', 'N/A'); // À remplacer par l'utilisateur connecté si disponible
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/streaming/${event.id}/configure/`);
      
      if (response.data.success) {
        setStreamStatus('configured');
        setStreamInfo(response.data.stream_info);
        showSnackbar('Stream configuré avec succès ! Les participants recevront un email avec les identifiants.', 'success');
        onUpdate && onUpdate();
      } else {
        setError(response.data.error || 'Erreur lors de la configuration du stream');
        showSnackbar('Erreur lors de la configuration du stream', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la configuration du stream:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Erreur lors de la configuration du stream';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } else if (error.request) {
        setError('Erreur de connexion au serveur');
        showSnackbar('Erreur de connexion au serveur', 'error');
      } else {
        setError('Erreur inattendue');
        showSnackbar('Erreur inattendue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const startStream = async () => {
    console.log('🔍 LOG CRITIQUE: startStream() appelé');
    console.log('🔍 LOG CRITIQUE: Event ID:', event?.id);
    console.log('🔍 LOG CRITIQUE: User:', 'N/A'); // À remplacer par l'utilisateur connecté si disponible
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/streaming/${event.id}/start/`);
      
      if (response.data.success) {
        setStreamStatus('live');
        setStreamInfo(response.data.stream_info);
        showSnackbar('Stream lancé avec succès !', 'success');
        onUpdate && onUpdate();
      } else if (response.data.warning) {
        // Stream déjà lancé - pas une erreur !
        setStreamStatus('live');
        setStreamInfo(response.data.stream_info);
        showSnackbar(response.data.message, 'info');
        onUpdate && onUpdate();
      } else {
        setError(response.data.error || 'Erreur lors du lancement du stream');
        showSnackbar('Erreur lors du lancement du stream', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du lancement du stream:', error);
      
      // Gestion détaillée des erreurs
      if (error.response) {
        // Erreur de réponse du serveur
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Erreur lors du lancement du stream';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } else if (error.request) {
        // Erreur de connexion
        setError('Erreur de connexion au serveur');
        showSnackbar('Erreur de connexion au serveur', 'error');
      } else {
        // Erreur générale
        setError('Erreur lors du lancement du stream');
        showSnackbar('Erreur lors du lancement du stream', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      setLoading(true);
      
      const response = await api.post(`/streaming/${event.id}/stop/`);
      
      if (response.data.success) {
        setStreamStatus('stopped');
        showSnackbar('Stream arrêté avec succès', 'success');
        onUpdate && onUpdate();
      } else {
        showSnackbar('Erreur lors de l\'arrêt du stream', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du stream:', error);
      showSnackbar('Erreur lors de l\'arrêt du stream', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pauseStream = async () => {
    try {
      setLoading(true);
      
      const response = await api.post(`/streaming/${event.id}/pause/`);
      
      if (response.data.success) {
        setStreamStatus('paused');
        showSnackbar('Stream mis en pause', 'success');
        onUpdate && onUpdate();
      } else if (response.data.warning) {
        // Gestion des avertissements
        showSnackbar(response.data.message, 'warning');
        onUpdate && onUpdate();
      } else {
        showSnackbar('Erreur lors de la mise en pause', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise en pause:', error);
      showSnackbar('Erreur lors de la mise en pause', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setLoading(true);
      
      const response = await api.post(`/streaming/${event.id}/start_recording/`);
      
      if (response.data.success) {
        setRecordingStatus('recording');
        showSnackbar('Enregistrement démarré', 'success');
        onUpdate && onUpdate();
      } else {
        showSnackbar('Erreur lors du démarrage de l\'enregistrement', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      showSnackbar('Erreur lors du démarrage de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      setLoading(true);
      
      const response = await api.post(`/streaming/${event.id}/stop_recording/`);
      
      if (response.data.success) {
        setRecordingStatus('completed');
        showSnackbar('Enregistrement terminé', 'success');
        onUpdate && onUpdate();
      } else {
        showSnackbar('Erreur lors de l\'arrêt de l\'enregistrement', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
      showSnackbar('Erreur lors de l\'arrêt de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'success';
      case 'paused': return 'warning';
      case 'stopped': return 'error';
      case 'starting': return 'info';
      case 'configured': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return <LiveIcon />;
      case 'paused': return <PauseIcon />;
      case 'stopped': return <StopIcon />;
      case 'starting': return <CircularProgress size={20} />;
      case 'configured': return <SettingsIcon />;
      default: return <InfoIcon />;
    }
  };

  const getRecordingStatusColor = (status) => {
    switch (status) {
      case 'recording': return 'error';
      case 'paused': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (!event) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Aucun événement sélectionné
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideoIcon /> Gestion du Streaming - {event.title}
      </Typography>

      <Grid container spacing={3}>
        {/* Statut du stream */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut du Stream
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  icon={getStatusIcon(streamStatus)}
                  label={streamStatus === 'live' ? 'EN DIRECT' : 
                         streamStatus === 'paused' ? 'EN PAUSE' :
                         streamStatus === 'stopped' ? 'ARRÊTÉ' :
                         streamStatus === 'starting' ? 'DÉMARRAGE...' :
                         streamStatus === 'configured' ? 'CONFIGURÉ' : 'ARRÊTÉ'}
                  color={getStatusColor(streamStatus)}
                  size="large"
                />
                
                {streamStatus === 'live' && (
                  <Chip
                    icon={<GroupIcon />}
                    label={`${viewerCount} spectateurs`}
                    color="info"
                    size="medium"
                  />
                )}
              </Box>

              {streamInfo && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Informations du stream:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><LinkIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Lien de diffusion"
                        secondary={
                          <a href={streamInfo.watch_url} target="_blank" rel="noopener noreferrer">
                            {streamInfo.watch_url}
                          </a>
                        }
                      />
                    </ListItem>
                    {streamInfo.stream_key && (
                      <ListItem>
                        <ListItemIcon><SettingsIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Clé de stream"
                          secondary={streamInfo.stream_key}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              <CardActions>
                {/* Vérifier si le stream est configuré */}
                {(!streamInfo || !streamInfo.meeting_id) ? (
                  // Stream non configuré - afficher le bouton de configuration
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SettingsIcon />}
                    onClick={configureStream}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Configuration...' : '⚙️ Configurer le Stream'}
                  </Button>
                ) : streamStatus === 'configured' ? (
                  // Stream configuré mais pas encore lancé - afficher le bouton de lancement
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayIcon />}
                    onClick={startStream}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Démarrage...' : '► Lancer le Stream'}
                  </Button>
                ) : streamStatus === 'idle' || streamStatus === 'stopped' ? (
                  // Stream configuré mais arrêté - afficher le bouton de lancement
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayIcon />}
                    onClick={startStream}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Démarrage...' : '► Lancer le Stream'}
                  </Button>
                ) : streamStatus === 'live' ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<PauseIcon />}
                      onClick={pauseStream}
                      disabled={loading}
                    >
                      Pause
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={stopStream}
                      disabled={loading}
                    >
                      Arrêter
                    </Button>
                  </Box>
                ) : streamStatus === 'paused' ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayIcon />}
                      onClick={startStream}
                      disabled={loading}
                    >
                      Reprendre
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={stopStream}
                      disabled={loading}
                    >
                      Arrêter
                    </Button>
                  </Box>
                ) : null}
              </CardActions>
            </CardContent>
          </Card>
        </Grid>

        {/* Gestion de l'enregistrement */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enregistrement
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  icon={<RecordIcon />}
                  label={recordingStatus === 'recording' ? 'EN COURS' :
                         recordingStatus === 'paused' ? 'EN PAUSE' :
                         recordingStatus === 'completed' ? 'TERMINÉ' : 'ARRÊTÉ'}
                  color={getRecordingStatusColor(recordingStatus)}
                  size="large"
                />
              </Box>

              <CardActions>
                {recordingStatus === 'not_recording' || recordingStatus === 'completed' ? (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<RecordIcon />}
                    onClick={startRecording}
                    disabled={loading || streamStatus !== 'live'}
                    fullWidth
                  >
                    Démarrer l'enregistrement
                  </Button>
                ) : recordingStatus === 'recording' ? (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={stopRecording}
                    disabled={loading}
                    fullWidth
                  >
                    Arrêter l'enregistrement
                  </Button>
                ) : null}
              </CardActions>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations de l'événement */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations de l'événement
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimeIcon color="action" />
                    <Typography variant="body2">
                      <strong>Début:</strong> {format(new Date(event.start_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TimeIcon color="action" />
                    <Typography variant="body2">
                      <strong>Fin:</strong> {format(new Date(event.end_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <GroupIcon color="action" />
                    <Typography variant="body2">
                      <strong>Participants:</strong> {event.current_registrations || 0}
                      {event.max_participants && ` / ${event.max_participants}`}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VideoIcon color="action" />
                    <Typography variant="body2">
                      <strong>Plateforme:</strong> {event.virtual_details?.platform || 'Non configuré'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog des paramètres */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Paramètres du Stream</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Qualité"
                select
                value={streamSettings.quality}
                onChange={(e) => setStreamSettings({...streamSettings, quality: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Frame Rate"
                select
                value={streamSettings.frameRate}
                onChange={(e) => setStreamSettings({...streamSettings, frameRate: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="24fps">24fps</option>
                <option value="30fps">30fps</option>
                <option value="60fps">60fps</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={() => setSettingsDialog(false)}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VirtualEventRecordingManager;
