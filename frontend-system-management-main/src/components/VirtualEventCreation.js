import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const VirtualEventCreation = ({ onEventCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [helpDialog, setHelpDialog] = useState(false);
  
  // Données de l'événement
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    short_description: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2h par défaut
    location: 'Événement virtuel',
    address: '',
    place_type: 'unlimited',
    max_capacity: '',
    price: '0',
    is_free: true,
    category: '',
    tags: [],
    access_type: 'public',
    contact_email: '',
    contact_phone: '',
    website: ''
  });

  // Données spécifiques à l'événement virtuel
  const [virtualData, setVirtualData] = useState({
    platform: 'zoom',
    meeting_id: '',
    meeting_password: '',
    meeting_url: '',
    auto_record: false,
    allow_chat: true,
    allow_screen_sharing: true,
    waiting_room: true,
    access_instructions: '',
    technical_requirements: ''
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        api.get('/categories/'),
        api.get('/tags/')
      ]);
      setCategories(categoriesResponse.data);
      setTags(tagsResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories/tags:', error);
    }
  };

  const handleEventDataChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVirtualDataChange = (field, value) => {
    setVirtualData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        event_data: {
          ...eventData,
          event_type: 'virtual',
          price: eventData.is_free ? '0' : eventData.price,
          max_capacity: eventData.place_type === 'limited' ? eventData.max_capacity : null,
          enable_waitlist: eventData.place_type === 'limited' ? eventData.enable_waitlist : true
        },
        ...virtualData
      };

      const response = await api.post('/virtual-events/', payload);
      
      showSnackbar('Événement virtuel créé avec succès !', 'success');
      
      if (onEventCreated) {
        onEventCreated(response.data);
      }
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de l\'événement';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!eventData.title.trim()) {
      showSnackbar('Le titre est requis', 'error');
      return false;
    }
    
    if (!eventData.description.trim()) {
      showSnackbar('La description est requise', 'error');
      return false;
    }
    
    if (eventData.start_date >= eventData.end_date) {
      showSnackbar('La date de fin doit être après la date de début', 'error');
      return false;
    }
    
    if (eventData.place_type === 'limited' && (!eventData.max_capacity || eventData.max_capacity <= 0)) {
      showSnackbar('La capacité maximale est requise pour les événements avec places limitées', 'error');
      return false;
    }
    
    if (!eventData.is_free && (!eventData.price || parseFloat(eventData.price) <= 0)) {
      showSnackbar('Le prix est requis pour les événements payants', 'error');
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setEventData({
      title: '',
      description: '',
      short_description: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: 'Événement virtuel',
      address: '',
      place_type: 'unlimited',
      max_capacity: '',
      enable_waitlist: true,
      price: '0',
      is_free: true,
      category: '',
      tags: [],
      access_type: 'public',
      contact_email: '',
      contact_phone: '',
      website: ''
    });
    
    setVirtualData({
      platform: 'zoom',
      meeting_id: '',
      meeting_password: '',
      meeting_url: '',
      auto_record: false,
      allow_chat: true,
      allow_screen_sharing: true,
      waiting_room: true,
      access_instructions: '',
      technical_requirements: ''
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Card>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" gap={1}>
                <VideoCallIcon color="primary" />
                <Typography variant="h5">Créer un événement virtuel</Typography>
                <Tooltip title="Aide">
                  <IconButton onClick={() => setHelpDialog(true)} size="small">
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            subheader="Configurez votre événement virtuel avec tous les détails nécessaires"
          />
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Informations de base */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                    📝 Informations de base
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Titre de l'événement *"
                    value={eventData.title}
                    onChange={(e) => handleEventDataChange('title', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description courte"
                    value={eventData.short_description}
                    onChange={(e) => handleEventDataChange('short_description', e.target.value)}
                    helperText="Description résumée (max 300 caractères)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description complète *"
                    value={eventData.description}
                    onChange={(e) => handleEventDataChange('description', e.target.value)}
                    required
                  />
                </Grid>

                {/* Dates et lieu */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    📅 Dates et lieu
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Date et heure de début *"
                    value={eventData.start_date}
                    onChange={(newValue) => handleEventDataChange('start_date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={new Date()}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Date et heure de fin *"
                    value={eventData.end_date}
                    onChange={(newValue) => handleEventDataChange('end_date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={eventData.start_date}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Lieu"
                    value={eventData.location}
                    onChange={(e) => handleEventDataChange('location', e.target.value)}
                    defaultValue="Événement virtuel"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type d'accès</InputLabel>
                    <Select
                      value={eventData.access_type}
                      onChange={(e) => handleEventDataChange('access_type', e.target.value)}
                      label="Type d'accès"
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Privé</MenuItem>
                      <MenuItem value="invite">Sur invitation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Capacité et prix */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    💰 Capacité et prix
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type de places</InputLabel>
                    <Select
                      value={eventData.place_type}
                      onChange={(e) => handleEventDataChange('place_type', e.target.value)}
                      label="Type de places"
                    >
                      <MenuItem value="limited">Places limitées</MenuItem>
                      <MenuItem value="unlimited">Places illimitées</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Capacité maximale"
                    type="number"
                    value={eventData.max_capacity}
                    onChange={(e) => handleEventDataChange('max_capacity', e.target.value)}
                    disabled={eventData.place_type === 'unlimited'}
                    helperText={eventData.place_type === 'unlimited' ? 'Illimité' : 'Nombre maximum de participants'}
                  />
                </Grid>
                
                {eventData.place_type === 'limited' && (
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={eventData.enable_waitlist}
                          onChange={(e) => handleEventDataChange('enable_waitlist', e.target.checked)}
                        />
                      }
                      label="Activer la liste d'attente"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={eventData.is_free}
                        onChange={(e) => handleEventDataChange('is_free', e.target.checked)}
                      />
                    }
                    label="Événement gratuit"
                  />
                </Grid>
                
                {!eventData.is_free && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prix ($)"
                      type="number"
                      value={eventData.price}
                      onChange={(e) => handleEventDataChange('price', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                )}

                {/* Configuration virtuelle */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    🎥 Configuration virtuelle
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Plateforme *</InputLabel>
                    <Select
                      value={virtualData.platform}
                      onChange={(e) => handleVirtualDataChange('platform', e.target.value)}
                      label="Plateforme *"
                    >
                      <MenuItem value="zoom">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('zoom')} Zoom
                        </Box>
                      </MenuItem>
                      <MenuItem value="youtube_live">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('youtube_live')} YouTube Live
                        </Box>
                      </MenuItem>
                      <MenuItem value="teams">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('teams')} Microsoft Teams
                        </Box>
                      </MenuItem>
                      <MenuItem value="meet">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('meet')} Google Meet
                        </Box>
                      </MenuItem>
                      <MenuItem value="webex">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('webex')} Cisco Webex
                        </Box>
                      </MenuItem>
                      <MenuItem value="custom">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon('custom')} Plateforme personnalisée
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ID de réunion"
                    value={virtualData.meeting_id}
                    onChange={(e) => handleVirtualDataChange('meeting_id', e.target.value)}
                    helperText="ID de la réunion (optionnel)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mot de passe de réunion"
                    value={virtualData.meeting_password}
                    onChange={(e) => handleVirtualDataChange('meeting_password', e.target.value)}
                    helperText="Mot de passe de la réunion (optionnel)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="URL de la réunion"
                    value={virtualData.meeting_url}
                    onChange={(e) => handleVirtualDataChange('meeting_url', e.target.value)}
                    helperText="Lien direct vers la réunion"
                    InputProps={{
                      startAdornment: <LinkIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>

                {/* Paramètres de la réunion */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    ⚙️ Paramètres de la réunion
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={virtualData.auto_record}
                        onChange={(e) => handleVirtualDataChange('auto_record', e.target.checked)}
                      />
                    }
                    label="Enregistrement automatique"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={virtualData.allow_chat}
                        onChange={(e) => handleVirtualDataChange('allow_chat', e.target.checked)}
                      />
                    }
                    label="Autoriser le chat"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={virtualData.allow_screen_sharing}
                        onChange={(e) => handleVirtualDataChange('allow_screen_sharing', e.target.checked)}
                      />
                    }
                    label="Partage d'écran"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={virtualData.waiting_room}
                        onChange={(e) => handleVirtualDataChange('waiting_room', e.target.checked)}
                      />
                    }
                    label="Salle d'attente"
                  />
                </Grid>

                {/* Instructions et exigences */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    📖 Instructions et exigences
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Instructions d'accès"
                    value={virtualData.access_instructions}
                    onChange={(e) => handleVirtualDataChange('access_instructions', e.target.value)}
                    helperText="Instructions spécifiques pour rejoindre l'événement"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Exigences techniques"
                    value={virtualData.technical_requirements}
                    onChange={(e) => handleVirtualDataChange('technical_requirements', e.target.value)}
                    helperText="Exigences techniques pour les participants"
                  />
                </Grid>

                {/* Catégorie et tags */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    🏷️ Catégorie et tags
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={eventData.category}
                      onChange={(e) => handleEventDataChange('category', e.target.value)}
                      label="Catégorie"
                    >
                      <MenuItem value="">Aucune catégorie</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {category.icon && <span>{category.icon}</span>}
                            {category.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tags</InputLabel>
                    <Select
                      multiple
                      value={eventData.tags}
                      onChange={(e) => handleEventDataChange('tags', e.target.value)}
                      label="Tags"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((tagId) => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <Chip key={tag.id} label={tag.name} size="small" />
                            ) : null;
                          })}
                        </Box>
                      )}
                    >
                      {tags.map((tag) => (
                        <MenuItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Informations de contact */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid', pb: 1, mt: 2 }}>
                    📞 Informations de contact
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email de contact"
                    type="email"
                    value={eventData.contact_email}
                    onChange={(e) => handleEventDataChange('contact_email', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Téléphone de contact"
                    value={eventData.contact_phone}
                    onChange={(e) => handleEventDataChange('contact_phone', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Site web"
                    value={eventData.website}
                    onChange={(e) => handleEventDataChange('website', e.target.value)}
                  />
                </Grid>

                {/* Boutons d'action */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                    <Button
                      variant="outlined"
                      onClick={onCancel || resetForm}
                      startIcon={<ClearIcon />}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {loading ? 'Création...' : 'Créer l\'événement virtuel'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* Dialog d'aide */}
        <Dialog open={helpDialog} onClose={() => setHelpDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <HelpIcon color="primary" />
              Aide à la création d'événements virtuels
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              <strong>Événements virtuels :</strong> Créez des événements en ligne accessibles depuis n'importe où dans le monde.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Plateformes supportées :</Typography>
            <ul>
              <li><strong>Zoom :</strong> Réunions vidéo professionnelles avec fonctionnalités avancées</li>
              <li><strong>YouTube Live :</strong> Diffusion en direct publique ou privée</li>
              <li><strong>Microsoft Teams :</strong> Collaboration d'équipe et réunions</li>
              <li><strong>Google Meet :</strong> Réunions simples et accessibles</li>
              <li><strong>Cisco Webex :</strong> Solutions d'entreprise sécurisées</li>
              <li><strong>Plateforme personnalisée :</strong> Votre propre solution de streaming</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Fonctionnalités :</Typography>
            <ul>
              <li><strong>Codes d'accès uniques :</strong> Chaque participant reçoit un code personnel</li>
              <li><strong>Notifications automatiques :</strong> Rappels et codes d'accès envoyés par email</li>
              <li><strong>Gestion des interactions :</strong> Likes, commentaires et évaluations</li>
              <li><strong>Rediffusions :</strong> Partage des enregistrements après l'événement</li>
            </ul>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpDialog(false)}>Fermer</Button>
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
    </LocalizationProvider>
  );
};

export default VirtualEventCreation;
