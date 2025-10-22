import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Checkbox,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Pagination,
  CircularProgress,
  Avatar,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import api from '../services/api';

const PendingRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // États pour les modales
  const [rejectDialog, setRejectDialog] = useState({ open: false, registrationId: null, reason: '' });
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState({ open: false, count: 0 });
  
  // États pour les notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadPendingRegistrations();
  }, [page, search]);

  const loadPendingRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pageSize,
        ...(search && { search })
      };
      
      const response = await api.get('/admin/pending_registrations/', { params });
      
      setRegistrations(response.data.pending_registrations);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total_count);
      
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions en attente:', error);
      setError('Erreur lors du chargement des inscriptions en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegistration = async (registrationId) => {
    try {
      await api.post('/admin/confirm_registration/', { registration_id: registrationId });
      
      setSnackbar({
        open: true,
        message: 'Inscription confirmée avec succès',
        severity: 'success'
      });
      
      // Recharger les données
      loadPendingRegistrations();
      
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors de la confirmation: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleRejectRegistration = async (registrationId, reason) => {
    try {
      await api.post('/admin/reject_registration/', { 
        registration_id: registrationId,
        reason: reason || 'Aucune raison fournie'
      });
      
      setSnackbar({
        open: true,
        message: 'Inscription rejetée avec succès',
        severity: 'success'
      });
      
      // Fermer la modale et recharger
      setRejectDialog({ open: false, registrationId: null, reason: '' });
      loadPendingRegistrations();
      
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors du rejet: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedRegistrations.length === 0) return;
    
    try {
      const response = await api.post('/admin/bulk_confirm_registrations/', {
        registration_ids: selectedRegistrations
      });
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      
      // Fermer la modale et recharger
      setBulkConfirmDialog({ open: false, count: 0 });
      setSelectedRegistrations([]);
      loadPendingRegistrations();
      
    } catch (error) {
      console.error('Erreur lors de la confirmation en lot:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors de la confirmation en lot: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRegistrations(registrations.map(reg => reg.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectRegistration = (registrationId) => {
    setSelectedRegistrations(prev => 
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'unpaid': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading && registrations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title="Inscriptions en Attente de Confirmation"
          subheader={`${totalCount} inscription(s) en attente`}
          action={
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadPendingRegistrations}
                disabled={loading}
              >
                Actualiser
              </Button>
              {selectedRegistrations.length > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckBoxIcon />}
                  onClick={() => setBulkConfirmDialog({ open: true, count: selectedRegistrations.length })}
                >
                  Confirmer ({selectedRegistrations.length})
                </Button>
              )}
            </Box>
          }
        />
        
        <CardContent>
          {/* Barre de recherche */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom, email ou événement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tableau des inscriptions */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedRegistrations.length > 0 && selectedRegistrations.length < registrations.length}
                      checked={registrations.length > 0 && selectedRegistrations.length === registrations.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Événement</TableCell>
                  <TableCell>Type de Billet</TableCell>
                  <TableCell>Prix</TableCell>
                  <TableCell>Statut Paiement</TableCell>
                  <TableCell>Date d'Inscription</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRegistrations.includes(registration.id)}
                        onChange={() => handleSelectRegistration(registration.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {registration.user.first_name?.[0] || registration.user.username[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {registration.user.first_name} {registration.user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{registration.user.username}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {registration.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {registration.event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(registration.event.start_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {registration.ticket_type ? (
                        <Chip
                          label={registration.ticket_type.name}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Standard
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPrice(registration.price_paid)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={registration.payment_status}
                        size="small"
                        color={getPaymentStatusColor(registration.payment_status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(registration.registered_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Confirmer l'inscription">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleConfirmRegistration(registration.id)}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter l'inscription">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setRejectDialog({ 
                              open: true, 
                              registrationId: registration.id, 
                              reason: '' 
                            })}
                          >
                            <CancelIcon />
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
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modale de rejet */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, registrationId: null, reason: '' })}>
        <DialogTitle>Rejeter l'Inscription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Veuillez fournir une raison pour le rejet de cette inscription.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Raison du rejet"
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Ex: Capacité atteinte, informations manquantes, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, registrationId: null, reason: '' })}>
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleRejectRegistration(rejectDialog.registrationId, rejectDialog.reason)}
          >
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modale de confirmation en lot */}
      <Dialog open={bulkConfirmDialog.open} onClose={() => setBulkConfirmDialog({ open: false, count: 0 })}>
        <DialogTitle>Confirmer les Inscriptions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Êtes-vous sûr de vouloir confirmer {bulkConfirmDialog.count} inscription(s) en attente ?
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            Cette action vérifiera automatiquement la capacité des événements et des types de billets.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirmDialog({ open: false, count: 0 })}>
            Annuler
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={handleBulkConfirm}
          >
            Confirmer ({bulkConfirmDialog.count})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingRegistrations;
