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
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import api from '../services/api';

const PlatformAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser l'API réelle
      const response = await api.get(`/admin/analytics/`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      setError('Erreur lors du chargement des analytics');
      
      // En cas d'erreur, utiliser des données par défaut
      setAnalytics({
        summary: {
          total_platform_users: 0,
          active_organizers: 0,
          published_events: 0,
          this_month_revenue: 0,
          total_events_this_month: 0,
          new_users_this_month: 0
        },
        growth_metrics: {
          users_growth: 0,
          events_growth: 0,
          revenue_growth: 0
        },
        daily_stats: [],
        top_revenue_events: [],
        top_organizers: [],
        refund_stats: {
          pending_refunds: 0,
          approved_refunds: 0,
          rejected_refunds: 0,
          total_refund_amount: 0
        }
      });
    } finally {
      setLoading(false);
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
        <Button 
          onClick={loadAnalytics} 
          sx={{ ml: 2 }}
          size="small"
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        Aucune donnée d'analytics disponible
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête avec contrôles */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          Analytics de la Plateforme
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadAnalytics}
          variant="contained"
          size="small"
        >
          Actualiser
        </Button>
      </Box>

      {/* Résumé des métriques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" color="primary">
                    {analytics.summary?.total_platform_users || 0}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Utilisateurs totaux
                  </Typography>
                </Box>
                <Box color="primary">
                  <PeopleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" color="secondary">
                    {analytics.summary?.active_organizers || 0}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Organisateurs actifs
                  </Typography>
                </Box>
                <Box color="secondary">
                  <EventIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" color="success">
                    {analytics.summary?.published_events || 0}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Événements publiés
                  </Typography>
                </Box>
                <Box color="success">
                  <EventIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" color="warning">
                    {analytics.summary?.this_month_revenue || 0}€
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Revenus ce mois
                  </Typography>
                </Box>
                <Box color="warning">
                  <MoneyIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistiques quotidiennes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Activité Quotidienne (7 derniers jours)"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {analytics.daily_stats && analytics.daily_stats.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Nouveaux utilisateurs</TableCell>
                        <TableCell>Nouveaux événements</TableCell>
                        <TableCell>Nouvelles inscriptions</TableCell>
                        <TableCell>Revenus</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.daily_stats.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell>{day.new_users}</TableCell>
                          <TableCell>{day.new_events}</TableCell>
                          <TableCell>{day.new_registrations}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main">
                              ${day.revenue}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucune donnée quotidienne disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Répartition des Rôles"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {analytics.role_distribution ? (
                <Box>
                  {Object.entries(analytics.role_distribution).map(([role, data]) => (
                    <Box key={role} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">
                          {data.name}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {data.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(data.count / analytics.summary.total_platform_users) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucune donnée de répartition disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métriques de croissance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Croissance des Utilisateurs"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<TrendingIcon color="primary" />}
            />
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom>
                {analytics.growth_metrics?.users_growth || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Croissance sur 30 jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Croissance des Événements"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<TrendingIcon color="secondary" />}
            />
            <CardContent>
              <Typography variant="h4" color="secondary" gutterBottom>
                {analytics.growth_metrics?.events_growth || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Croissance sur 30 jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Croissance des Revenus"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<TrendingIcon color="success" />}
            />
            <CardContent>
              <Typography variant="h4" color="success" gutterBottom>
                {analytics.growth_metrics?.revenue_growth || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Croissance sur 30 jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistiques des remboursements */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Statistiques des Remboursements"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {analytics.refund_stats?.pending_refunds || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      En attente
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {analytics.refund_stats?.approved_refunds || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Approuvés
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main">
                      {analytics.refund_stats?.rejected_refunds || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Rejetés
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                                              <Box textAlign="center">
                              <Typography variant="h6" color="info.main">
                                ${analytics.refund_stats?.total_refund_amount || 0}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Montant total
                              </Typography>
                            </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Top Organisateurs"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              {analytics.top_organizers && analytics.top_organizers.length > 0 ? (
                <Box>
                  {analytics.top_organizers.map((organizer, index) => (
                    <Box key={organizer.id} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2">
                            {organizer.full_name || organizer.username}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {organizer.event_count} événement(s)
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="success.main">
                          ${organizer.total_revenue}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(organizer.total_revenue / Math.max(...analytics.top_organizers.map(o => o.total_revenue), 1)) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucun organisateur avec des revenus disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top événements par revenus */}
      <Card>
        <CardHeader
          title="Top 10 Événements par Revenus"
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          {analytics.top_revenue_events && analytics.top_revenue_events.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rang</TableCell>
                    <TableCell>Événement</TableCell>
                    <TableCell>Organisateur</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Revenus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.top_revenue_events.map((event, index) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          color={index < 3 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {event.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{event.organizer}</TableCell>
                      <TableCell>
                        {new Date(event.start_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          ${event.total_revenue}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Aucun événement avec des revenus disponible
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlatformAnalytics;
