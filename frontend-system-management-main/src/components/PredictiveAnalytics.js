import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon,
  Psychology as AIIcon,
  AutoGraph as PredictIcon,
  MonetizationOn as PriceIcon,
  Insights as InsightsIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as TrainIcon,
  Visibility as ViewIcon,
  TrendingDown as TrendDownIcon,
  TrendingUp as TrendUpIcon,
  Assessment as AnalyticsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import api from '../services/api';

const PredictiveAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [daysBack, setDaysBack] = useState(90);

  useEffect(() => {
    // 🔥 AMÉLIORATION: Vérifier les permissions avant de charger
    const checkPermissions = async () => {
      try {
        // Essayer de charger les analytics pour vérifier les permissions
        await loadPredictiveAnalytics();
        await loadEvents();
      } catch (error) {
        // Les erreurs sont déjà gérées dans les fonctions individuelles
        console.log('Vérification des permissions terminée');
      }
    };
    
    checkPermissions();
  }, [daysBack]);

  const loadPredictiveAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/admin/predictive_analytics/`, {
        params: { days_back: daysBack }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics prédictifs:', error);
      
      // 🔥 AMÉLIORATION: Gestion d'erreur plus détaillée
      if (error.response?.status === 401) {
        setError('❌ Accès refusé. Vous devez être connecté en tant que Super Admin pour accéder aux analytics prédictifs.');
      } else if (error.response?.status === 403) {
        setError('❌ Permissions insuffisantes. Seuls les Super Admins peuvent accéder aux analytics prédictifs.');
      } else if (error.response?.status === 500) {
        setError('❌ Erreur serveur. L\'IA de prédiction rencontre des difficultés techniques.');
      } else if (error.message === 'Network Error') {
        setError('❌ Erreur de connexion. Vérifiez que le serveur backend est démarré.');
      } else {
        setError(`❌ Erreur lors du chargement des analytics prédictifs: ${error.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      console.log('🔍 DEBUG: Chargement des événements...');
      const response = await api.get('/events/');
      console.log('🔍 DEBUG: Réponse API événements:', response.data);
      
      // 🔥 CORRECTION: L'API retourne une liste directement, pas un objet avec 'results'
      const eventsList = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('🔍 DEBUG: Nombre d\'événements reçus:', eventsList.length);
      
      setEvents(eventsList);
      
      console.log('🔍 DEBUG: Événements chargés dans l\'état:', eventsList.length);
      console.log('🔍 DEBUG: Premier événement:', eventsList[0]);
      
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      // 🔥 AMÉLIORATION: Afficher l'erreur pour les événements aussi
      if (error.response?.status === 401) {
        setError('❌ Impossible de charger les événements. Vérifiez votre connexion.');
      } else if (error.message === 'Network Error') {
        setError('❌ Erreur de connexion. Vérifiez que le serveur backend est démarré.');
      }
    }
  };

  // Filtrer les événements basé sur la recherche
  const filteredEvents = events.filter(event => {
    const matchesTitle = event.title?.toLowerCase().includes(eventSearchTerm.toLowerCase());
    const matchesLocation = event.location?.toLowerCase().includes(eventSearchTerm.toLowerCase());
    const matchesCategory = event.category?.name?.toLowerCase().includes(eventSearchTerm.toLowerCase());
    
    console.log(`🔍 DEBUG: Filtrage événement "${event.title}":`, {
      searchTerm: eventSearchTerm,
      matchesTitle,
      matchesLocation,
      matchesCategory,
      event: { title: event.title, location: event.location, category: event.category?.name }
    });
    
    return matchesTitle || matchesLocation || matchesCategory;
  });
  
  console.log('🔍 DEBUG: Filtrage terminé:', {
    totalEvents: events.length,
    searchTerm: eventSearchTerm,
    filteredCount: filteredEvents.length,
    filteredEvents: filteredEvents.map(e => e.title)
  });

  // Charger les analytics spécifiques à un événement
  const loadEventSpecificAnalytics = async (eventId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/predictive_analytics/`, {
        params: { event_id: eventId, days_back: daysBack }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics spécifiques:', error);
      setError('Erreur lors du chargement des analytics spécifiques');
    } finally {
      setLoading(false);
    }
  };

  const trainModels = async () => {
    try {
      setTrainingStatus('training');
      const response = await api.post('/admin/train_ml_models/', {
        force_retrain: true
      });
      
      if (response.data.status === 'success') {
        setTrainingStatus('success');
        setTimeout(() => setTrainingStatus('idle'), 3000);
        loadPredictiveAnalytics(); // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors de l\'entraînement:', error);
      setTrainingStatus('error');
      setTimeout(() => setTrainingStatus('idle'), 3000);
    }
  };

  const predictFillRate = async (eventId) => {
    try {
      const response = await api.post('/admin/predict_fill_rate/', {
        event_id: eventId
      });
      
      if (response.data.status === 'success') {
        // Mettre à jour les insights avec la prédiction
        setAnalytics(prev => ({
          ...prev,
          insights: {
            ...prev.insights,
            event_specific_insights: response.data.prediction.message ? 
              [...(prev.insights.event_specific_insights || []), response.data.prediction.message] :
              prev.insights.event_specific_insights
          }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la prédiction:', error);
    }
  };

  const optimizePricing = async (eventId) => {
    try {
      const response = await api.post('/admin/optimize_pricing/', {
        event_id: eventId,
        target_fill_rate: 0.8
      });
      
      if (response.data.status === 'success') {
        // Mettre à jour les insights avec l'optimisation
        setAnalytics(prev => ({
          ...prev,
          insights: {
            ...prev.insights,
            recommendations: [
              ...(prev.insights.recommendations || []),
              ...(response.data.optimization.recommendations || [])
            ]
          }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'not_trained': return 'warning';
      case 'training': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <TrendingUpIcon color="success" />;
      case 'not_trained': return <TrendingDownIcon color="warning" />;
      case 'training': return <CircularProgress size={20} />;
      case 'error': return <TrendingDownIcon color="error" />;
      default: return <TrendingDownIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AIIcon color="primary" />
          Analytics Prédictifs Avancés
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPredictiveAnalytics}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<TrainIcon />}
            onClick={trainModels}
            disabled={trainingStatus === 'training'}
            color={trainingStatus === 'success' ? 'success' : 'primary'}
          >
            {trainingStatus === 'training' ? 'Entraînement...' : 
             trainingStatus === 'success' ? 'Entraîné !' : 'Entraîner les modèles'}
          </Button>
        </Box>
      </Box>

      {/* Statut des modèles ML */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Statut des Modèles de Machine Learning"
          avatar={<AIIcon color="primary" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(analytics?.model_status?.fill_rate_predictor)}
                <Box>
                  <Typography variant="subtitle1">Prédicteur de Remplissage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analytics?.model_status?.fill_rate_predictor === 'available' ? 
                      'Modèle disponible' : 'Modèle non entraîné'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Dernier entraînement: {analytics?.model_status?.last_training !== null ? 
                  `Il y a ${analytics?.model_status?.last_training} jours` : 'Jamais'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Insights Prédictifs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Insights Globaux"
              avatar={<InsightsIcon color="primary" />}
            />
            <CardContent>
              {analytics?.insights?.global_insights?.length > 0 ? (
                <Box>
                  {analytics.insights.global_insights.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      {insight}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun insight global disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Recommandations"
              avatar={<TrendingIcon color="primary" />}
            />
            <CardContent>
              {analytics?.insights?.recommendations?.length > 0 ? (
                <Box>
                  {analytics.insights.recommendations.map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      {rec}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune recommandation disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tendances Émergentes */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Tendances Émergentes"
          avatar={<TimelineIcon color="primary" />}
          action={
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Période</InputLabel>
              <Select
                value={daysBack}
                label="Période"
                onChange={(e) => setDaysBack(e.target.value)}
              >
                <MenuItem value={30}>30 jours</MenuItem>
                <MenuItem value={60}>60 jours</MenuItem>
                <MenuItem value={90}>90 jours</MenuItem>
                <MenuItem value={180}>180 jours</MenuItem>
              </Select>
            </FormControl>
          }
        />
        <CardContent>
          {analytics?.trends?.emerging_trends?.length > 0 ? (
            <Grid container spacing={2}>
              {analytics.trends.emerging_trends.map((trend, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {trend.type === 'category_growth' ? <TrendingUpIcon color="success" /> : <TrendingUpIcon color="info" />}
                      <Typography variant="subtitle2" color="primary">
                        {trend.type === 'category_growth' ? 'Catégorie' : 'Tag'}
                      </Typography>
                    </Box>
                    <Typography variant="h6">{trend.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Croissance: {trend.growth_rate}%
                    </Typography>
                    {trend.type === 'category_growth' && (
                      <Typography variant="body2" color="text.secondary">
                        Prix moyen: {trend.avg_price}€ | Remplissage: {(trend.avg_fill_rate * 100).toFixed(1)}%
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune tendance émergente détectée
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Analyse par Catégorie */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Analyse par Catégorie"
          avatar={<AnalyticsIcon color="primary" />}
        />
        <CardContent>
          {analytics?.trends?.category_trends?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Catégorie</TableCell>
                    <TableCell align="right">Événements Récents</TableCell>
                    <TableCell align="right">Total Événements</TableCell>
                    <TableCell align="right">Croissance</TableCell>
                    <TableCell align="right">Prix Moyen</TableCell>
                    <TableCell align="right">Taux de Remplissage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.trends.category_trends.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="subtitle2">{category.name}</Typography>
                      </TableCell>
                      <TableCell align="right">{category.recent_events}</TableCell>
                      <TableCell align="right">{category.total_events}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${category.growth_rate}%`}
                          color={category.growth_rate > 20 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{category.avg_price}€</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={category.avg_fill_rate * 100}
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {(category.avg_fill_rate * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune donnée de catégorie disponible
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Sélecteur d'événement pour analyses spécifiques */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Analyses Spécifiques à un Événement"
          avatar={<ViewIcon color="primary" />}
          action={
            <Button
              variant="outlined"
              onClick={() => setShowEventSelector(true)}
            >
              Sélectionner un Événement
            </Button>
          }
        />
        <CardContent>
          {selectedEvent ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Événement: {selectedEvent.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PredictIcon />}
                  onClick={() => predictFillRate(selectedEvent.id)}
                >
                  Prédire le Taux de Remplissage
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PriceIcon />}
                  onClick={() => optimizePricing(selectedEvent.id)}
                >
                  Optimiser les Prix
                </Button>
              </Box>
              
              {/* Insights spécifiques à l'événement */}
              {analytics?.insights?.event_specific_insights?.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Insights de l'Événement</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {analytics.insights.event_specific_insights.map((insight, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        {insight}
                      </Typography>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sélectionnez un événement pour obtenir des analyses spécifiques
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Résumé des Analytics */}
      <Card>
        <CardHeader
          title="Résumé des Analytics Prédictifs"
          avatar={<ChartIcon color="primary" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {analytics?.summary?.total_insights || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Insights Générés
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {analytics?.summary?.emerging_trends || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tendances Émergentes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {analytics?.summary?.categories_analyzed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Catégories Analysées
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {analytics?.summary?.tags_analyzed || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tags Analysés
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dialog de sélection d'événement */}
      <Dialog
        open={showEventSelector}
        onClose={() => setShowEventSelector(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sélectionner un Événement</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rechercher un événement"
            variant="outlined"
            sx={{ mb: 2, mt: 1 }}
            placeholder="Tapez pour rechercher..."
            value={eventSearchTerm}
            onChange={(e) => setEventSearchTerm(e.target.value)}
          />
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventSelector(false);
                    loadEventSpecificAnalytics(event.id);
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    📅 {new Date(event.start_date).toLocaleDateString('fr-FR')} | 
                    📍 {event.location || 'Lieu non spécifié'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    💰 Prix: {event.price}€ | 
                    👥 Capacité: {event.max_capacity || 'Non définie'}
                  </Typography>
                  {event.category && (
                    <Chip 
                      label={event.category.name} 
                      size="small" 
                      color="primary" 
                      sx={{ mr: 1, mt: 1 }}
                    />
                  )}
                  {event.tags && event.tags.length > 0 && (
                    event.tags.slice(0, 3).map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag.name} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1, mt: 1 }}
                      />
                    ))
                  )}
                </Paper>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {eventSearchTerm ? 'Aucun événement trouvé pour cette recherche' : 'Aucun événement disponible'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventSelector(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictiveAnalytics;
