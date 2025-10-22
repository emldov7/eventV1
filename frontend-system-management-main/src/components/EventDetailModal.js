import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import api from '../services/api';

const EventDetailModal = ({ open, onClose, eventId, onEventAction }) => {
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 EventDetailModal useEffect - open:', open, 'eventId:', eventId);
    if (open && eventId) {
      console.log('🔍 Appel de fetchEventDetails pour eventId:', eventId);
      fetchEventDetails();
    }
  }, [open, eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/events/${eventId}/detail/`);
      setEventDetails(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      setError('Erreur lors de la récupération des détails de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEvent = async () => {
    if (!rejectReason.trim()) {
      setError('Veuillez fournir une raison pour le rejet');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/admin/events/${eventId}/reject/`, {
        reason: rejectReason
      });
      
      setShowRejectDialog(false);
      setRejectReason('');
      onEventAction('rejected', eventId);
      onClose();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      setError('Erreur lors du rejet de l\'événement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet événement ? Cette action est irréversible.')) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/admin/events/${eventId}/delete/`);
      
      onEventAction('deleted', eventId);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression de l\'événement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('🔍 Début export CSV pour événement:', eventId);
      setError(null);
      
      const response = await api.get(`/api/admin/events/${eventId}/export_csv/`, {
        responseType: 'blob'
      });
      
      console.log('✅ Export CSV réussi:', response);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inscriptions_event_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('📁 Fichier CSV téléchargé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error);
      
      let errorMessage = 'Erreur lors de l\'export CSV';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.log(`📊 Réponse erreur CSV: Status ${status}`, data);
        
        if (status === 401) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else if (status === 403) {
          errorMessage = 'Accès refusé. Vérifiez vos permissions.';
        } else if (status === 404) {
          errorMessage = 'Événement non trouvé. Vérifiez l\'ID.';
        } else if (status === 500) {
          errorMessage = 'Erreur serveur. Vérifiez les logs backend.';
        } else {
          errorMessage = `Erreur ${status}: ${data.error || data.detail || 'Erreur inconnue'}`;
        }
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur. Vérifiez que le backend fonctionne.';
      } else {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  const handleExportExcel = async () => {
    try {
      console.log('🔍 Début export Excel pour événement:', eventId);
      setError(null);
      
      const response = await api.get(`/api/admin/events/${eventId}/export_excel/`, {
        responseType: 'blob'
      });
      
      console.log('✅ Export Excel réussi:', response);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inscriptions_event_${eventId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('📁 Fichier Excel téléchargé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      
      let errorMessage = 'Erreur lors de l\'export Excel';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.log(`📊 Réponse erreur Excel: Status ${status}`, data);
        
        if (status === 401) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else if (status === 403) {
          errorMessage = 'Accès refusé. Vérifiez vos permissions.';
        } else if (status === 404) {
          errorMessage = 'Événement non trouvé. Vérifiez l\'ID.';
        } else if (status === 500) {
          errorMessage = 'Erreur serveur. Vérifiez les logs backend.';
        } else {
          errorMessage = `Erreur ${status}: ${data.error || data.detail || 'Erreur inconnue'}`;
        }
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur. Vérifiez que le backend fonctionne.';
      } else {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button onClick={fetchEventDetails} sx={{ ml: 2 }} size="small">
              Réessayer
            </Button>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!eventDetails) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h2">
              Détails de l'Événement
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* Informations principales */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {eventDetails.title}
                    </Typography>
                    <Chip
                      label={getStatusLabel(eventDetails.status)}
                      color={getStatusColor(eventDetails.status)}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body1" color="textSecondary" paragraph>
                    {eventDetails.description}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          <strong>Début :</strong> {new Date(eventDetails.start_date).toLocaleString('fr-FR')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          <strong>Fin :</strong> {new Date(eventDetails.end_date).toLocaleString('fr-FR')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          <strong>Lieu :</strong> {eventDetails.location || 'Non spécifié'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          <strong>Prix :</strong> ${eventDetails.price}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Organisateur et catégorie */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Organisateur"
                  avatar={<PersonIcon />}
                />
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      {eventDetails.organizer.first_name?.[0] || eventDetails.organizer.username[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {eventDetails.organizer.first_name} {eventDetails.organizer.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        @{eventDetails.organizer.username}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {eventDetails.organizer.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Catégorie et Tags"
                  avatar={<CategoryIcon />}
                />
                <CardContent>
                  {eventDetails.category && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Catégorie :
                      </Typography>
                      <Chip
                        label={eventDetails.category.name}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  {eventDetails.tags && eventDetails.tags.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Tags :
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {eventDetails.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Statistiques des inscriptions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Statistiques des Inscriptions"
                  avatar={<PeopleIcon />}
                  action={
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Export...' : 'CSV'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportExcel}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Export...' : 'Excel'}
                      </Button>
                    </Box>
                  }
                />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total des inscriptions"
                        secondary={eventDetails.registrations_stats.total}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ReceiptIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Revenus générés"
                        secondary={`$${eventDetails.registrations_stats.revenue.toFixed(2)}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Confirmées"
                        secondary={eventDetails.registrations_stats.confirmed}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="En attente"
                        secondary={eventDetails.registrations_stats.pending}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Liste des Participants */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={`Participants (${eventDetails.registrations_stats.total})`}
                  avatar={<PeopleIcon />}
                  action={
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Export...' : 'CSV'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportExcel}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Export...' : 'Excel'}
                      </Button>
                    </Box>
                  }
                />
                <CardContent>
                  {eventDetails.registrations && eventDetails.registrations.length > 0 ? (
                    <List dense>
                      {eventDetails.registrations.map((registration) => (
                        <ListItem key={registration.id} divider>
                          <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {registration.user.first_name ? registration.user.first_name[0] : registration.user.username[0]}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={`${registration.user.first_name || ''} ${registration.user.last_name || ''}`.trim() || registration.user.username}
                            secondary={
                              <Box>
                                <Typography variant="body2" component="span">
                                  {registration.user.email} • {registration.status} • ${registration.price_paid || 0}
                                </Typography>
                                {registration.ticket_type && (
                                  <Typography variant="body2" component="span" display="block">
                                    Type: {registration.ticket_type.name}
                                  </Typography>
                                )}
                                <Typography variant="body2" component="span" display="block">
                                  Inscrit le: {new Date(registration.registered_at).toLocaleDateString('fr-FR')}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={registration.status}
                              size="small"
                              color={
                                registration.status === 'confirmed' ? 'success' :
                                registration.status === 'pending' ? 'warning' :
                                registration.status === 'cancelled' ? 'error' :
                                'default'
                              }
                            />
                            {registration.refund_request && (
                              <Chip
                                label={`Remboursement: ${registration.refund_request.status}`}
                                size="small"
                                color={
                                  registration.refund_request.status === 'approved' ? 'success' :
                                  registration.refund_request.status === 'pending' ? 'warning' :
                                  registration.refund_request.status === 'rejected' ? 'error' :
                                  'default'
                                }
                              />
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary" align="center">
                      Aucun participant inscrit à cet événement
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Demandes de remboursement */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Demandes de Remboursement"
                  avatar={<ReceiptIcon />}
                />
                <CardContent>
                  {eventDetails.refund_requests && eventDetails.refund_requests.length > 0 ? (
                    <List dense>
                      {eventDetails.refund_requests.slice(0, 3).map((refund) => (
                        <ListItem key={refund.id}>
                          <ListItemIcon>
                            <ReceiptIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`$${refund.refund_amount} - ${refund.user.username}`}
                            secondary={`Statut: ${refund.status} - ${refund.reason || 'Aucune raison'}`}
                          />
                        </ListItem>
                      ))}
                      {eventDetails.refund_requests.length > 3 && (
                        <ListItem>
                          <ListItemText
                            primary={`... et ${eventDetails.refund_requests.length - 3} autres`}
                            color="textSecondary"
                          />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemText
                          primary={`Total: ${eventDetails.refund_requests.length} demande(s)`}
                          secondary={`Montant total: $${eventDetails.refund_requests.reduce((sum, refund) => sum + refund.refund_amount, 0).toFixed(2)}`}
                          color="primary"
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Aucune demande de remboursement
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Historique des modifications */}
            {eventDetails.event_history && eventDetails.event_history.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Historique des Modifications"
                    avatar={<HistoryIcon />}
                  />
                  <CardContent>
                    <List dense>
                      {eventDetails.event_history.slice(0, 5).map((history) => (
                        <ListItem key={history.id}>
                          <ListItemIcon>
                            <HistoryIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={history.action}
                            secondary={`${history.details} - ${history.user} - ${new Date(history.timestamp).toLocaleString('fr-FR')}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit">
            Fermer
          </Button>
          
          {eventDetails.status !== 'cancelled' && (
            <Button
              onClick={() => setShowRejectDialog(true)}
              color="warning"
              variant="outlined"
              startIcon={<BlockIcon />}
              disabled={actionLoading}
            >
              Rejeter
            </Button>
          )}
          
          <Button
            onClick={handleDeleteEvent}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={actionLoading}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour le rejet */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter l'Événement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Veuillez fournir une raison pour le rejet de cet événement. Cette action annulera l'événement et notifiera l'organisateur et tous les participants.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Raison du rejet"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ex: Contenu inapproprié, informations manquantes, etc."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleRejectEvent}
            color="warning"
            variant="contained"
            disabled={!rejectReason.trim() || actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventDetailModal;
