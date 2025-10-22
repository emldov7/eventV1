import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  VideoLibrary as VideoLibraryIcon,
  People as PeopleIcon,
  ThumbUp as ThumbUpIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const VirtualEventAnalytics = ({ eventId = null, isSuperAdmin = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterDialog, setFilterDialog] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (eventId) {
      fetchEventAnalytics(eventId);
    } else {
      fetchGlobalAnalytics();
    }
  }, [eventId, dateRange, platformFilter]);

  const fetchEventAnalytics = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}/interactions/`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);
      showSnackbar('Erreur lors de la récupération des analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/virtual_events/', {
        params: {
          include_analytics: true,
          date_range: dateRange,
          platform: platformFilter !== 'all' ? platformFilter : undefined
        }
      });
      setEvents(response.data.results || response.data);
      
      // Calculer les statistiques globales
      const globalStats = calculateGlobalStats(response.data.results || response.data);
      setAnalytics(globalStats);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics globaux:', error);
      showSnackbar('Erreur lors de la récupération des analytics globaux', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalStats = (eventsList) => {
    if (!eventsList || eventsList.length === 0) return null;

    const stats = {
      total_events: eventsList.length,
      total_participants: 0,
      total_interactions: 0,
      platform_distribution: {},
      monthly_trends: {},
      interaction_breakdown: { likes: 0, comments: 0, shares: 0, ratings: 0 },
      average_rating: 0,
      recording_stats: { available: 0, total: 0 }
    };

    let totalRating = 0;
    let ratingCount = 0;

    eventsList.forEach(event => {
      // Participants
      stats.total_participants += event.current_registrations || 0;

      // Plateformes
      if (event.virtual_details?.platform) {
        const platform = event.virtual_details.platform;
        stats.platform_distribution[platform] = (stats.platform_distribution[platform] || 0) + 1;
      }

      // Interactions
      if (event.interaction_count) {
        stats.total_interactions += event.interaction_count.total || 0;
        stats.interaction_breakdown.likes += event.interaction_count.likes || 0;
        stats.interaction_breakdown.comments += event.interaction_count.comments || 0;
        stats.interaction_breakdown.shares += event.interaction_count.shares || 0;
        stats.interaction_breakdown.ratings += event.interaction_count.ratings || 0;
        
        if (event.interaction_count.average_rating) {
          totalRating += event.interaction_count.average_rating;
          ratingCount++;
        }
      }

      // Enregistrements
      if (event.virtual_details?.recording_available) {
        stats.recording_stats.available++;
      }
      stats.recording_stats.total++;

      // Tendances mensuelles
      const month = format(new Date(event.start_date), 'yyyy-MM');
      stats.monthly_trends[month] = (stats.monthly_trends[month] || 0) + 1;
    });

    stats.average_rating = ratingCount > 0 ? totalRating / ratingCount : 0;

    return stats;
  };

  const getChartData = () => {
    if (!analytics) return [];

    if (eventId) {
      // Données pour un événement spécifique
      return [
        { name: 'J\'aime', value: analytics.likes || 0, color: '#2196F3' },
        { name: 'Commentaires', value: analytics.comments || 0, color: '#4CAF50' },
        { name: 'Partages', value: analytics.shares || 0, color: '#FF9800' },
        { name: 'Évaluations', value: analytics.ratings || 0, color: '#9C27B0' }
      ];
    } else {
      // Données globales
      return [
        { name: 'J\'aime', value: analytics.interaction_breakdown?.likes || 0, color: '#2196F3' },
        { name: 'Commentaires', value: analytics.interaction_breakdown?.comments || 0, color: '#4CAF50' },
        { name: 'Partages', value: analytics.interaction_breakdown?.shares || 0, color: '#FF9800' },
        { name: 'Évaluations', value: analytics.interaction_breakdown?.ratings || 0, color: '#9C27B0' }
      ];
    }
  };

  const getPlatformChartData = () => {
    if (!analytics?.platform_distribution) return [];
    
    return Object.entries(analytics.platform_distribution).map(([platform, count]) => ({
      name: platform,
      value: count
    }));
  };

  const getMonthlyTrendData = () => {
    if (!analytics?.monthly_trends) return [];
    
    return Object.entries(analytics.monthly_trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy', { locale: fr }),
        events: count
      }));
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const data = eventId ? 
      `Analytics pour l'événement\n${JSON.stringify(analytics, null, 2)}` :
      `Analytics globaux\n${JSON.stringify(analytics, null, 2)}`;

    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${eventId || 'global'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showSnackbar('Analytics exportés avec succès', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Chargement des analytics...
        </Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Aucune donnée d'analytics disponible
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon /> Analytics des Événements Virtuels
          {eventId && <Chip label="Événement spécifique" color="primary" size="small" />}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialog(true)}
          >
            Filtres
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => eventId ? fetchEventAnalytics(eventId) : fetchGlobalAnalytics()}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<GetAppIcon />}
            onClick={exportAnalytics}
          >
            Exporter
          </Button>
        </Box>
      </Box>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Vue d'ensemble" />
          <Tab label="Interactions" />
          <Tab label="Tendances" />
          <Tab label="Détails" />
        </Tabs>
      </Box>

      {/* Vue d'ensemble */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Statistiques principales */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <VideoLibraryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {analytics.total_events || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Événements virtuels
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {analytics.total_participants || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participants totaux
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ThumbUpIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {analytics.total_interactions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interactions totales
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {analytics.average_rating ? analytics.average_rating.toFixed(1) : '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Note moyenne
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Graphique des interactions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition des interactions
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <PieChartIcon />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Distribution des plateformes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribution des plateformes
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <BarChartIcon />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Interactions détaillées */}
      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Détail des interactions
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type d'interaction</TableCell>
                        <TableCell align="right">Nombre</TableCell>
                        <TableCell align="right">Pourcentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getChartData().map((row) => (
                        <TableRow key={row.name}>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, backgroundColor: row.color, borderRadius: '50%' }} />
                              {row.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{row.value}</TableCell>
                          <TableCell align="right">
                            {analytics.total_interactions > 0 
                              ? ((row.value / analytics.total_interactions) * 100).toFixed(1) 
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tendances */}
      {selectedTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendances mensuelles des événements
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                  <TrendingUpIcon />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Détails */}
      {selectedTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques des enregistrements
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Enregistrements disponibles
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.recording_stats?.total > 0 
                      ? (analytics.recording_stats.available / analytics.recording_stats.total) * 100 
                      : 0} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {analytics.recording_stats?.available || 0} / {analytics.recording_stats?.total || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top des plateformes
                </Typography>
                <List>
                  {getPlatformChartData()
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((platform, index) => (
                      <ListItem key={platform.name}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: index === 0 ? 'gold' : 'primary.main' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={platform.name}
                          secondary={`${platform.value} événement(s)`}
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialog de filtres */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
        <DialogTitle>Filtres d'analytics</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Période</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Période"
                >
                  <MenuItem value="7d">7 derniers jours</MenuItem>
                  <MenuItem value="30d">30 derniers jours</MenuItem>
                  <MenuItem value="90d">90 derniers jours</MenuItem>
                  <MenuItem value="1y">1 an</MenuItem>
                  <MenuItem value="all">Tout</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plateforme</InputLabel>
                <Select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  label="Plateforme"
                >
                  <MenuItem value="all">Toutes les plateformes</MenuItem>
                  <MenuItem value="zoom">Zoom</MenuItem>
                  <MenuItem value="teams">Teams</MenuItem>
                  <MenuItem value="meet">Google Meet</MenuItem>
                  <MenuItem value="webex">Webex</MenuItem>
                  <MenuItem value="youtube">YouTube Live</MenuItem>
                  <MenuItem value="custom">Personnalisée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialog(false)}>Fermer</Button>
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

export default VirtualEventAnalytics;
