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
  CardHeader
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { Tabs, Tab } from '@mui/material';
import api from '../services/api';
import { CustomRemindersManager } from './CustomReminders';

const EventManagement = () => {
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

  const handleEventAction = async (event, action) => {
    setSelectedEvent(event);
    setActionType(action);
    setActionDialog(true);
  };

  const confirmAction = async () => {
    try {
      let response;
      
      if (actionType === 'delete') {
        // Pour la suppression, utiliser l'endpoint dédié
        response = await api.delete(`/admin/events/${selectedEvent.id}/delete/`);
      } else {
        // Pour les autres actions (approve, suspend, reject), utiliser moderate_event
        const payload = {
          event_id: selectedEvent.id,
          action: actionType
        };
        response = await api.post('/admin/moderate_event/', payload);
      }
      
      showSnackbar('Action effectuée avec succès', 'success');
      setActionDialog(false);
      setSelectedEvent(null);
      setActionType('');
      loadEvents(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      showSnackbar('Erreur lors de l\'action', 'error');
    }
  };

  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    setEventDetailDialog(true);
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
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
          Gestion des Événements
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadEvents}
          variant="outlined"
        >
          Actualiser
        </Button>
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
            <MenuItem value="published">Publié</MenuItem>
            <MenuItem value="draft">Brouillon</MenuItem>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
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
                    <Tooltip title="Voir l'événement">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewEventDetails(event)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {event.status === 'draft' && (
                      <Tooltip title="Approuver">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleEventAction(event, 'approve')}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
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
                    
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleEventAction(event, 'delete')}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* Dialog pour les actions */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' && 'Approuver l\'événement'}
          {actionType === 'suspend' && 'Suspendre l\'événement'}
          {actionType === 'delete' && 'Supprimer l\'événement'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Événement: <strong>{selectedEvent?.title}</strong>
          </Typography>
          
          {actionType === 'delete' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. L'événement sera définitivement supprimé.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Annuler</Button>
          <Button 
            onClick={confirmAction} 
            color={actionType === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails de l'événement */}
      <Dialog open={eventDetailDialog} onClose={() => setEventDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Détails de l'Événement</Typography>
            <Button onClick={() => setEventDetailDialog(false)}>Fermer</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              {/* Onglets */}
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
              >
                <Tab 
                  icon={<EventIcon />} 
                  label="Informations" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<EmailIcon />} 
                  label="Rappels Personnalisés" 
                  iconPosition="start"
                />
              </Tabs>

              {/* Contenu des onglets */}
              {activeTab === 0 && (
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

              {/* Informations supplémentaires */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Informations supplémentaires"
                    avatar={<EventIcon />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          <strong>Créé le :</strong> {new Date(selectedEvent.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          <strong>Dernière modification :</strong> {new Date(selectedEvent.updated_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          <strong>Événement en vedette :</strong> {selectedEvent.is_featured ? 'Oui' : 'Non'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Lien virtuel :</strong> {selectedEvent.virtual_link || 'Non spécifié'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
                </Grid>
              )}

              {/* Onglet Rappels Personnalisés */}
              {activeTab === 1 && (
                <CustomRemindersManager 
                  eventId={selectedEvent.id}
                  eventTitle={selectedEvent.title}
                />
              )}
            </Box>
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

export default EventManagement;
