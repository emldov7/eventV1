import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Pagination,
  CircularProgress,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Publish as PublishIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import api from '../services/api';

const EventModeration = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [eventDetailDialog, setEventDetailDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [actionData, setActionData] = useState({ reason: '' });

  useEffect(() => {
    loadEvents();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      };
      
      const response = await api.get('/admin/all_events/', { params });
      setEvents(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      showSnackbar('Erreur lors du chargement des événements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModerationHistory = async (eventId) => {
    try {
      const response = await api.get(`/admin/events/${eventId}/history/`);
      setModerationHistory(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const handleEventAction = async (event, action) => {
    setSelectedEvent(event);
    setActionType(action);
    setActionData({ reason: '' });
    setActionDialog(true);
  };

  const confirmAction = async () => {
    try {
      const payload = {
        event_id: selectedEvent.id,
        action: actionType,
        ...(actionType === 'suspend' || actionType === 'reject' ? { reason: actionData.reason } : {})
      };

      await api.post('/admin/moderate_event/', payload);
      
      showSnackbar('Action de modération effectuée avec succès', 'success');
      setActionDialog(false);
      setSelectedEvent(null);
      setActionType('');
      setActionData({ reason: '' });
      loadEvents(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      showSnackbar('Erreur lors de l\'action de modération', 'error');
    }
  };

  const handleViewEventDetails = async (event) => {
    setSelectedEvent(event);
    setEventDetailDialog(true);
    await loadModerationHistory(event.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      case 'postponed': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      case 'postponed': return 'Reporté';
      default: return status;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve': return <CheckIcon />;
      case 'reject': return <CancelIcon />;
      case 'suspend': return <BlockIcon />;
      case 'publish': return <PublishIcon />;
      default: return <InfoIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approve': return 'success';
      case 'reject': return 'error';
      case 'suspend': return 'warning';
      case 'publish': return 'info';
      default: return 'default';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'approve': return 'Approuver';
      case 'reject': return 'Rejeter';
      case 'suspend': return 'Suspendre';
      case 'publish': return 'Publier';
      default: return action;
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getPendingEventsCount = () => {
    return events.filter(event => event.status === 'draft').length;
  };

  const getPublishedEventsCount = () => {
    return events.filter(event => event.status === 'published').length;
  };

  const getCancelledEventsCount = () => {
    return events.filter(event => event.status === 'cancelled').length;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          Modération des Événements
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadEvents}
          variant="outlined"
        >
          Actualiser
        </Button>
      </Box>

      {/* Statistiques de modération */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ color: 'warning.main', mr: 2 }}>
                    <WarningIcon fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {getPendingEventsCount()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      En attente de modération
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ color: 'success.main', mr: 2 }}>
                    <CheckIcon fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {getPublishedEventsCount()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Événements publiés
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ color: 'error.main', mr: 2 }}>
                    <CancelIcon fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {getCancelledEventsCount()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Événements rejetés
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ color: 'info.main', mr: 2 }}>
                    <EventIcon fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {events.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total des événements
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Onglets de modération */}
      <Box mb={3}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label={
              <Badge badgeContent={getPendingEventsCount()} color="warning">
                En Attente
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getPublishedEventsCount()} color="success">
                Publiés
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getCancelledEventsCount()} color="error">
                Rejetés
              </Badge>
            } 
          />
          <Tab label="Tous" />
        </Tabs>
      </Box>

      {/* Filtres et recherche */}
      <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Titre, lieu, organisateur..."
          InputProps={{
            startAdornment: <SearchIcon />
          }}
          sx={{ minWidth: 250 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Statut"
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="draft">Brouillon</MenuItem>
            <MenuItem value="published">Publié</MenuItem>
            <MenuItem value="cancelled">Annulé</MenuItem>
            <MenuItem value="completed">Terminé</MenuItem>
            <MenuItem value="postponed">Reporté</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Catégorie"
          >
            <MenuItem value="">Toutes les catégories</MenuItem>
            {/* Les catégories pourraient être chargées dynamiquement */}
          </Select>
        </FormControl>
      </Box>

      {/* Table des événements */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Événement</TableCell>
              <TableCell>Organisateur</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Actions de Modération</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events
              .filter(event => {
                if (activeTab === 0) return event.status === 'draft';
                if (activeTab === 1) return event.status === 'published';
                if (activeTab === 2) return event.status === 'cancelled';
                return true; // Tous les événements
              })
              .map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {event.short_description || 'Aucune description'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {event.organizer?.username?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {event.organizer?.username || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                        {event.organizer?.email || ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={getStatusLabel(event.status)}
                    color={getStatusColor(event.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date(event.start_date).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                      {new Date(event.start_date).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {event.location || 'Non spécifié'}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {event.current_registrations || 0} / {event.max_capacity || '∞'}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    {event.is_free ? 'Gratuit' : `$${event.price || 0}`}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Voir les détails">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewEventDetails(event)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {event.status === 'draft' && (
                      <>
                        <Tooltip title="Approuver">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleEventAction(event, 'approve')}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleEventAction(event, 'reject')}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {event.status === 'published' && (
                      <Tooltip title="Suspendre">
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleEventAction(event, 'suspend')}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Dialog pour les actions de modération */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getActionIcon(actionType)}
            <Typography variant="h6">
              {getActionLabel(actionType)} l'événement
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Événement: <strong>{selectedEvent?.title}</strong>
          </Typography>
          
          {(actionType === 'suspend' || actionType === 'reject') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison"
              value={actionData.reason || ''}
              onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
              placeholder="Raison de la suspension/rejet..."
              sx={{ mt: 2 }}
              required
            />
          )}

          {actionType === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action rejettera définitivement l'événement. L'organisateur sera notifié.
            </Alert>
          )}

          {actionType === 'suspend' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              L'événement sera mis en brouillon et pourra être republié ultérieurement.
            </Alert>
          )}

          {actionType === 'approve' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              L'événement sera publié et visible par tous les utilisateurs.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Annuler</Button>
          <Button 
            onClick={confirmAction} 
            color={getActionColor(actionType)}
            variant="contained"
            disabled={actionType === 'suspend' || actionType === 'reject' ? !actionData.reason : false}
          >
            {getActionLabel(actionType)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails de l'événement avec historique de modération */}
      <Dialog open={eventDetailDialog} onClose={() => setEventDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Détails de l'Événement</Typography>
            <Button onClick={() => setEventDetailDialog(false)}>Fermer</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Grid container spacing={3}>
              {/* Informations principales */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h4" component="h1" gutterBottom>
                        {selectedEvent.title}
                      </Typography>
                      <Chip
                        label={getStatusLabel(selectedEvent.status)}
                        color={getStatusColor(selectedEvent.status)}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body1" color="textSecondary" paragraph>
                      {selectedEvent.description}
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            <strong>Début :</strong> {new Date(selectedEvent.start_date).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" mb={1}>
                          <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            <strong>Fin :</strong> {new Date(selectedEvent.end_date).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            <strong>Lieu :</strong> {selectedEvent.location || 'Non spécifié'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" mb={1}>
                          <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            <strong>Prix :</strong> {selectedEvent.is_free ? 'Gratuit' : `$${selectedEvent.price}`}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Organisateur */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Organisateur"
                    avatar={<PersonIcon />}
                  />
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2 }}>
                        {selectedEvent.organizer?.username?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {selectedEvent.organizer?.first_name} {selectedEvent.organizer?.last_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          @{selectedEvent.organizer?.username}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedEvent.organizer?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Statistiques */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Statistiques"
                    avatar={<PeopleIcon />}
                  />
                  <CardContent>
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Capacité: {selectedEvent.max_capacity || 'Illimitée'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Inscriptions actuelles: {selectedEvent.current_registrations || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Places disponibles: {selectedEvent.max_capacity ? 
                          Math.max(0, selectedEvent.max_capacity - (selectedEvent.current_registrations || 0)) : 
                          'Illimitées'
                        }
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Type d'accès: {selectedEvent.access_type || 'Public'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Historique de modération */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Historique de Modération"
                    avatar={<HistoryIcon />}
                  />
                  <CardContent>
                    {moderationHistory.length > 0 ? (
                      <List>
                        {moderationHistory.map((history, index) => (
                          <ListItem key={index} divider>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: getActionColor(history.action) }}>
                                {getActionIcon(history.action)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${getActionLabel(history.action)} par ${history.user?.username || 'Admin'}`}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="textSecondary">
                                    {new Date(history.created_at).toLocaleString('fr-FR')}
                                  </Typography>
                                  {history.field_name && (
                                    <Typography variant="body2" color="textSecondary">
                                      Champ modifié: {history.field_name}
                                    </Typography>
                                  )}
                                  {history.old_value && history.new_value && (
                                    <Typography variant="body2" color="textSecondary">
                                      {history.old_value} → {history.new_value}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        Aucun historique de modération disponible
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventModeration;
