import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Storage as DatabaseIcon,
  Folder as MediaIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import api from '../services/api';

const SystemHealth = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser l'API réelle
      const response = await api.get('/admin/system_health/');
      setSystemHealth(response.data);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Erreur lors de la vérification de la santé du système:', error);
      setError('Erreur lors de la vérification de la santé du système');
      
      // En cas d'erreur, utiliser des données par défaut
      setSystemHealth({
        system_health: {
          database: false,
          media_files: false,
          email_service: false,
          cache_service: false,
          migrations: false
        },
        system_stats: {
          total_users: 0,
          total_events: 0,
          total_registrations: 0,
          active_events: 0,
          pending_refunds: 0
        },
        health_score: 0,
        overall_status: 'inconnu',
        warnings: ['Impossible de vérifier la santé du système'],
        errors: ['Erreur de connexion à l\'API']
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status) => {
    if (status) {
      return <HealthyIcon color="success" />;
    } else {
      return <ErrorIcon color="error" />;
    }
  };

  const getHealthColor = (status) => {
    return status ? 'success' : 'error';
  };

  const getHealthLabel = (status) => {
    return status ? 'Opérationnel' : 'Problème détecté';
  };

  const getOverallStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'bon': return 'success';
      case 'moyen': return 'warning';
      case 'critique': return 'error';
      default: return 'default';
    }
  };

  const getOverallStatusLabel = (status) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'bon': return 'Bon';
      case 'moyen': return 'Moyen';
      case 'critique': return 'Critique';
      default: return 'Inconnu';
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
          onClick={checkSystemHealth} 
          sx={{ ml: 2 }}
          size="small"
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  if (!systemHealth) {
    return (
      <Alert severity="info">
        Aucune information de santé du système disponible
      </Alert>
    );
  }

  const overallHealth = Object.values(systemHealth.system_health).every(status => status);
  const healthScore = (Object.values(systemHealth.system_health).filter(status => status).length / 
                      Object.keys(systemHealth.system_health).length) * 100;

  return (
    <Box>
      {systemHealth && (
        <Grid container spacing={3}>
          {/* Score de santé global */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h5" component="h2">
                    Santé du Système
                  </Typography>
                  <Chip
                    label={`Score: ${systemHealth.health_score || 0}%`}
                    color={getOverallStatusColor(systemHealth.overall_status)}
                    variant="outlined"
                    size="large"
                  />
                </Box>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Statut global: {getOverallStatusLabel(systemHealth.overall_status)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={systemHealth.health_score || 0}
                  color={getOverallStatusColor(systemHealth.overall_status)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Services système */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Services Système"
                avatar={<DatabaseIcon />}
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {getHealthIcon(systemHealth.system_health?.database)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Base de données"
                      secondary={getHealthLabel(systemHealth.system_health?.database)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {getHealthIcon(systemHealth.system_health?.media_files)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Fichiers média"
                      secondary={getHealthLabel(systemHealth.system_health?.media_files)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {getHealthIcon(systemHealth.system_health?.email_service)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Service email"
                      secondary={getHealthLabel(systemHealth.system_health?.email_service)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {getHealthIcon(systemHealth.system_health?.cache_service)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Service de cache"
                      secondary={getHealthLabel(systemHealth.system_health?.cache_service)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {getHealthIcon(systemHealth.system_health?.migrations)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Migrations"
                      secondary={getHealthLabel(systemHealth.system_health?.migrations)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistiques système */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Statistiques Système"
                avatar={<ChartIcon />}
              />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Utilisateurs totaux"
                      secondary={systemHealth.system_stats?.total_users || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Événements totaux"
                      secondary={systemHealth.system_stats?.total_events || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Inscriptions totales"
                      secondary={systemHealth.system_stats?.total_registrations || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Événements actifs"
                      secondary={systemHealth.system_stats?.active_events || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Remboursements en attente"
                      secondary={systemHealth.system_stats?.pending_refunds || 0}
                    />
                  </ListItem>
                  {systemHealth.system_stats?.disk_free_gb !== undefined && (
                    <ListItem>
                      <ListItemText
                        primary="Espace disque libre"
                        secondary={`${systemHealth.system_stats.disk_free_gb} GB`}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Avertissements et erreurs */}
          {(systemHealth.warnings?.length > 0 || systemHealth.errors?.length > 0) && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Avertissements et Erreurs" />
                <CardContent>
                  {systemHealth.warnings?.map((warning, index) => (
                    <Alert key={`warning-${index}`} severity="warning" sx={{ mb: 1 }}>
                      {warning}
                    </Alert>
                  ))}
                  {systemHealth.errors?.map((error, index) => (
                    <Alert key={`error-${index}`} severity="error" sx={{ mb: 1 }}>
                      {error}
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Dernière vérification */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Dernière vérification : {lastCheck ? lastCheck.toLocaleString('fr-FR') : 'Jamais'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SystemHealth;
