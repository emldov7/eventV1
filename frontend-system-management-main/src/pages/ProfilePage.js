import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';
import { setDarkMode, setLocale } from '../store/slices/uiSlice';
import api, { authAPI } from '../services/api';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const { darkMode, locale } = useSelector((state) => state.ui);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    country: user?.profile?.country || 'FR',
    address: user?.address || '',
    bio: user?.bio || '',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    language: 'fr',
    timezone: 'Europe/Paris',
  });

  // Charger les paramètres sauvegardés (hors mode sombre qui est géré globalement)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('profile_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (_) {}
  }, []);

  // 🎯 NOUVEAU: Synchroniser le formulaire avec les données utilisateur
  useEffect(() => {
    console.log('🔍 [PROFILE_SYNC] Synchronisation du formulaire avec user:', user);
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone: user.profile?.phone || prev.phone,
        country: user.profile?.country || prev.country,
        address: user.address || prev.address,
        bio: user.bio || prev.bio,
      }));
      console.log('🔍 [PROFILE_SYNC] Formulaire synchronisé:', {
        phone: user.profile?.phone,
        country: user.profile?.country
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => {
      const next = { ...prev, [setting]: value };
      try { localStorage.setItem('profile_settings', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const handleSave = async () => {
    console.log('🔍 [PROFILE_SAVE] Début de la sauvegarde...');
    console.log('🔍 [PROFILE_SAVE] Données à envoyer:', {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      country: formData.country
    });
    
    try {
      const response = await api.put('/auth/update_profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        country: formData.country
      });
      
      console.log('🔍 [PROFILE_SAVE] Réponse reçue:', response);
      console.log('🔍 [PROFILE_SAVE] Status:', response.status);
      console.log('🔍 [PROFILE_SAVE] Données reçues:', response.data);
      
      if (response.status === 200) {
        console.log('🔍 [PROFILE_SAVE] ✅ Succès - Mise à jour Redux...');
        console.log('🔍 [PROFILE_SAVE] User data avant dispatch:', response.data.user);
        
        // Mettre à jour l'état utilisateur dans Redux
        dispatch({ type: 'auth/updateUser', payload: response.data.user });
        
        // 🎯 FORCER LA MISE À JOUR DU FORMULAIRE
        setFormData(prev => ({
          ...prev,
          phone: response.data.user.profile?.phone || prev.phone,
          country: response.data.user.profile?.country || prev.country
        }));
        
        console.log('🔍 [PROFILE_SAVE] ✅ Dispatch effectué');
        setIsEditing(false);
        console.log('🔍 [PROFILE_SAVE] ✅ Mode édition désactivé');
      }
    } catch (error) {
      console.error('❌ [PROFILE_SAVE] Erreur lors de la mise à jour du profil:', error);
      console.error('❌ [PROFILE_SAVE] Détails de l\'erreur:', error.response?.data);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      country: user?.profile?.country || 'FR',
      address: user?.address || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  // 🎯 LOGS DÉTAILLÉS POUR DÉBOGUER
  console.log('🔍 [PROFILE_RENDER] Rendu du composant ProfilePage');
  console.log('🔍 [PROFILE_RENDER] État user:', user);
  console.log('🔍 [PROFILE_RENDER] État formData:', formData);
  console.log('🔍 [PROFILE_RENDER] État isEditing:', isEditing);
  console.log('🔍 [PROFILE_RENDER] User profile country:', user?.profile?.country);
  console.log('🔍 [PROFILE_RENDER] FormData country:', formData.country);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mon profil
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : error.detail || error.message || 'Une erreur est survenue'}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informations personnelles */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Informations personnelles
              </Typography>
              <Button
                variant={isEditing ? "outlined" : "contained"}
                startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                onClick={isEditing ? handleCancel : () => setIsEditing(true)}
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Pays</InputLabel>
                  <Select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    label="Pays"
                  >
                    <MenuItem value="FR">🇫🇷 France (+33)</MenuItem>
                    <MenuItem value="US">🇺🇸 États-Unis (+1)</MenuItem>
                    <MenuItem value="CA">🇨🇦 Canada (+1)</MenuItem>
                    <MenuItem value="BE">🇧🇪 Belgique (+32)</MenuItem>
                    <MenuItem value="CH">🇨🇭 Suisse (+41)</MenuItem>
                    <MenuItem value="LU">🇱🇺 Luxembourg (+352)</MenuItem>
                    <MenuItem value="DE">🇩🇪 Allemagne (+49)</MenuItem>
                    <MenuItem value="IT">🇮🇹 Italie (+39)</MenuItem>
                    <MenuItem value="ES">🇪🇸 Espagne (+34)</MenuItem>
                    <MenuItem value="GB">🇬🇧 Royaume-Uni (+44)</MenuItem>
                    <MenuItem value="NL">🇳🇱 Pays-Bas (+31)</MenuItem>
                    <MenuItem value="PT">🇵🇹 Portugal (+351)</MenuItem>
                    <MenuItem value="IE">🇮🇪 Irlande (+353)</MenuItem>
                    <MenuItem value="AT">🇦🇹 Autriche (+43)</MenuItem>
                    <MenuItem value="SE">🇸🇪 Suède (+46)</MenuItem>
                    <MenuItem value="NO">🇳🇴 Norvège (+47)</MenuItem>
                    <MenuItem value="DK">🇩🇰 Danemark (+45)</MenuItem>
                    <MenuItem value="FI">🇫🇮 Finlande (+358)</MenuItem>
                    <MenuItem value="PL">🇵🇱 Pologne (+48)</MenuItem>
                    <MenuItem value="CZ">🇨🇿 République tchèque (+420)</MenuItem>
                    <MenuItem value="HU">🇭🇺 Hongrie (+36)</MenuItem>
                    <MenuItem value="RO">🇷🇴 Roumanie (+40)</MenuItem>
                    <MenuItem value="BG">🇧🇬 Bulgarie (+359)</MenuItem>
                    <MenuItem value="HR">🇭🇷 Croatie (+385)</MenuItem>
                    <MenuItem value="SI">🇸🇮 Slovénie (+386)</MenuItem>
                    <MenuItem value="SK">🇸🇰 Slovaquie (+421)</MenuItem>
                    <MenuItem value="LT">🇱🇹 Lituanie (+370)</MenuItem>
                    <MenuItem value="LV">🇱🇻 Lettonie (+371)</MenuItem>
                    <MenuItem value="EE">🇪🇪 Estonie (+372)</MenuItem>
                    <MenuItem value="CY">🇨🇾 Chypre (+357)</MenuItem>
                    <MenuItem value="MT">🇲🇹 Malte (+356)</MenuItem>
                    <MenuItem value="GR">🇬🇷 Grèce (+30)</MenuItem>
                    <MenuItem value="TG">🇹🇬 Togo (+228)</MenuItem>
                    <MenuItem value="CI">🇨🇮 Côte d'Ivoire (+225)</MenuItem>
                    <MenuItem value="SN">🇸🇳 Sénégal (+221)</MenuItem>
                    <MenuItem value="ML">🇲🇱 Mali (+223)</MenuItem>
                    <MenuItem value="BF">🇧🇫 Burkina Faso (+226)</MenuItem>
                    <MenuItem value="NE">🇳🇪 Niger (+227)</MenuItem>
                    <MenuItem value="TD">🇹🇩 Tchad (+235)</MenuItem>
                    <MenuItem value="CM">🇨🇲 Cameroun (+237)</MenuItem>
                    <MenuItem value="CF">🇨🇫 République centrafricaine (+236)</MenuItem>
                    <MenuItem value="CG">🇨🇬 Congo (+242)</MenuItem>
                    <MenuItem value="CD">🇨🇩 République démocratique du Congo (+243)</MenuItem>
                    <MenuItem value="GA">🇬🇦 Gabon (+241)</MenuItem>
                    <MenuItem value="GQ">🇬🇶 Guinée équatoriale (+240)</MenuItem>
                    <MenuItem value="ST">🇸🇹 Sao Tomé-et-Principe (+239)</MenuItem>
                    <MenuItem value="AO">🇦🇴 Angola (+244)</MenuItem>
                    <MenuItem value="NA">🇳🇦 Namibie (+264)</MenuItem>
                    <MenuItem value="ZA">🇿🇦 Afrique du Sud (+27)</MenuItem>
                    <MenuItem value="BW">🇧🇼 Botswana (+267)</MenuItem>
                    <MenuItem value="ZW">🇿🇼 Zimbabwe (+263)</MenuItem>
                    <MenuItem value="ZM">🇿🇲 Zambie (+260)</MenuItem>
                    <MenuItem value="MW">🇲🇼 Malawi (+265)</MenuItem>
                    <MenuItem value="MZ">🇲🇿 Mozambique (+258)</MenuItem>
                    <MenuItem value="MG">🇲🇬 Madagascar (+261)</MenuItem>
                    <MenuItem value="MU">🇲🇺 Maurice (+230)</MenuItem>
                    <MenuItem value="SC">🇸🇨 Seychelles (+248)</MenuItem>
                    <MenuItem value="KM">🇰🇲 Comores (+269)</MenuItem>
                    <MenuItem value="DJ">🇩🇯 Djibouti (+253)</MenuItem>
                    <MenuItem value="SO">🇸🇴 Somalie (+252)</MenuItem>
                    <MenuItem value="ET">🇪🇹 Éthiopie (+251)</MenuItem>
                    <MenuItem value="ER">🇪🇷 Érythrée (+291)</MenuItem>
                    <MenuItem value="SD">🇸🇩 Soudan (+249)</MenuItem>
                    <MenuItem value="SS">🇸🇸 Soudan du Sud (+211)</MenuItem>
                    <MenuItem value="EG">🇪🇬 Égypte (+20)</MenuItem>
                    <MenuItem value="LY">🇱🇾 Libye (+218)</MenuItem>
                    <MenuItem value="TN">🇹🇳 Tunisie (+216)</MenuItem>
                    <MenuItem value="DZ">🇩🇿 Algérie (+213)</MenuItem>
                    <MenuItem value="MA">🇲🇦 Maroc (+212)</MenuItem>
                    <MenuItem value="EH">🇪🇭 Sahara occidental (+212)</MenuItem>
                    <MenuItem value="MR">🇲🇷 Mauritanie (+222)</MenuItem>
                    <MenuItem value="GM">🇬🇲 Gambie (+220)</MenuItem>
                    <MenuItem value="GN">🇬🇳 Guinée (+224)</MenuItem>
                    <MenuItem value="GW">🇬🇼 Guinée-Bissau (+245)</MenuItem>
                    <MenuItem value="SL">🇸🇱 Sierra Leone (+232)</MenuItem>
                    <MenuItem value="LR">🇱🇷 Liberia (+231)</MenuItem>
                    <MenuItem value="GH">🇬🇭 Ghana (+233)</MenuItem>
                    <MenuItem value="BJ">🇧🇯 Bénin (+229)</MenuItem>
                    <MenuItem value="NG">🇳🇬 Nigeria (+234)</MenuItem>
                    <MenuItem value="RW">🇷🇼 Rwanda (+250)</MenuItem>
                    <MenuItem value="KE">🇰🇪 Kenya (+254)</MenuItem>
                    <MenuItem value="TZ">🇹🇿 Tanzanie (+255)</MenuItem>
                    <MenuItem value="UG">🇺🇬 Ouganda (+256)</MenuItem>
                    <MenuItem value="BI">🇧🇮 Burundi (+257)</MenuItem>
                    <MenuItem value="RE">🇷🇪 La Réunion (+262)</MenuItem>
                    <MenuItem value="LS">🇱🇸 Lesotho (+266)</MenuItem>
                    <MenuItem value="SZ">🇸🇿 Eswatini (+268)</MenuItem>
                    <MenuItem value="YT">🇾🇹 Mayotte (+262)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Parlez-nous un peu de vous..."
                />
              </Grid>
            </Grid>

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Sauvegarder
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Avatar et informations de base */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              src={user?.avatar}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            
            <Typography variant="h6" gutterBottom>
              {user?.first_name} {user?.last_name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user?.username}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Membre depuis"
                  secondary={user?.date_joined ? format(new Date(user.date_joined), 'dd MMM yyyy', { locale: dateFnsLocale }) : 'N/A'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Paramètres */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Paramètres
            </Typography>

            <Grid container spacing={3}>
              {/* Notifications */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Notifications
                      </Typography>
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Notifications par email"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.pushNotifications}
                          onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        />
                      }
                      label="Notifications push"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Apparence */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PaletteIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Apparence
                      </Typography>
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!darkMode}
                          onChange={(e) => dispatch(setDarkMode(e.target.checked))}
                        />
                      }
                      label="Mode sombre"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Langue et fuseau horaire */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Langue et région
                      </Typography>
                    </Box>
                    
                     <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Langue</InputLabel>
                      <Select
                         value={locale || 'fr-FR'}
                         onChange={(e) => {
                           const value = e.target.value;
                           console.log('ProfilePage - Changing locale to:', value);
                           dispatch(setLocale(value));
                           handleSettingChange('language', value.startsWith('fr') ? 'fr' : value.startsWith('en') ? 'en' : 'es');
                           // Plus besoin de recharger - la locale est maintenant réactive
                         }}
                        label="Langue"
                      >
                         <MenuItem value="fr-FR">Français</MenuItem>
                         <MenuItem value="en-US">English</MenuItem>
                         <MenuItem value="es-ES">Español</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Fuseau horaire</InputLabel>
                      <Select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        label="Fuseau horaire"
                      >
                        <MenuItem value="Europe/Paris">Europe/Paris</MenuItem>
                        <MenuItem value="Europe/London">Europe/London</MenuItem>
                        <MenuItem value="America/New_York">America/New_York</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sécurité */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Sécurité
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 1 }}
                      onClick={async () => {
                        const old_password = window.prompt('Ancien mot de passe');
                        if (old_password === null) return;
                        const new_password = window.prompt('Nouveau mot de passe');
                        if (new_password === null) return;
                        try {
                          await authAPI.changePassword(old_password, new_password);
                          alert('Mot de passe modifié avec succès. Veuillez vous reconnecter.');
                          // Forcer la reconnexion
                          localStorage.removeItem('access_token');
                          localStorage.removeItem('refresh_token');
                          window.location.href = '/login';
                        } catch (e) {
                          const msg = e?.response?.data?.error || 'Échec du changement de mot de passe';
                          const details = e?.response?.data?.details;
                          alert(Array.isArray(details) ? `${msg}:\n- ${details.join('\n- ')}` : msg);
                        }
                      }}
                    >
                      Changer le mot de passe
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Authentification à deux facteurs
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      color="error"
                      onClick={async () => {
                        const ok = window.confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.");
                        if (!ok) return;
                        try {
                          // Appelle DELETE /auth/user/
                          await api.delete('/auth/user/');
                          // Nettoyage côté client
                          localStorage.removeItem('access_token');
                          localStorage.removeItem('refresh_token');
                          window.location.href = '/login';
                        } catch (e) {
                          console.error('Suppression de compte échouée', e);
                          alert("Suppression impossible pour le moment.");
                        }
                      }}
                    >
                      Supprimer le compte
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage; 