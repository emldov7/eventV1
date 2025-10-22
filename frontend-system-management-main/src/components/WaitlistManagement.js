import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { eventAPI } from '../services/api';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../store/slices/uiSlice';
import { fetchEventById } from '../store/slices/eventSlice';

const WaitlistManagement = ({ open, onClose, event }) => {
  const dispatch = useDispatch();
  const [waitlistedRegistrations, setWaitlistedRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadWaitlistedRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await eventAPI.getWaitlistedRegistrations(event.id);
      setWaitlistedRegistrations(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions en attente:', error);
      dispatch(showSnackbar({ 
        message: 'Erreur lors du chargement des inscriptions en attente', 
        severity: 'error' 
      }));
    } finally {
      setLoading(false);
    }
  }, [event?.id, dispatch]);

  useEffect(() => {
    if (open && event?.id) {
      loadWaitlistedRegistrations();
    }
  }, [open, event, loadWaitlistedRegistrations]);

  const handleApprove = async (registrationId) => {
    setActionLoading(prev => ({ ...prev, [registrationId]: 'approve' }));
    try {
      await eventAPI.approveWaitlist(registrationId);
      dispatch(showSnackbar({ 
        message: 'Inscription approuvée avec succès', 
        severity: 'success' 
      }));
      // Recharger les données
      loadWaitlistedRegistrations();
      dispatch(fetchEventById(event.id)); // Rafraîchir l'événement
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      dispatch(showSnackbar({ 
        message: 'Erreur lors de l\'approbation de l\'inscription', 
        severity: 'error' 
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [registrationId]: null }));
    }
  };

  const handleRejectClick = (registration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRegistration) return;
    
    setActionLoading(prev => ({ ...prev, [selectedRegistration.id]: 'reject' }));
    try {
      await eventAPI.rejectWaitlist(selectedRegistration.id, rejectReason);
      dispatch(showSnackbar({ 
        message: 'Inscription rejetée', 
        severity: 'info' 
      }));
      // Recharger les données
      loadWaitlistedRegistrations();
      dispatch(fetchEventById(event.id)); // Rafraîchir l'événement
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      dispatch(showSnackbar({ 
        message: 'Erreur lors du rejet de l\'inscription', 
        severity: 'error' 
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedRegistration.id]: null }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Gestion des inscriptions en attente
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            Événement : {event.title}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : waitlistedRegistrations.length === 0 ? (
            <Alert severity="info">
              Aucune inscription en attente pour cet événement.
            </Alert>
          ) : (
            <List>
              {waitlistedRegistrations.map((registration) => (
                <ListItem key={registration.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {registration.user?.first_name || registration.user?.username}
                        </Typography>
                        <Chip 
                          label="En attente" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          <Typography variant="body2">
                            {registration.user?.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <TimeIcon fontSize="small" />
                          <Typography variant="body2">
                            Inscrit le {formatDate(registration.registered_at)}
                          </Typography>
                        </Box>
                        {registration.ticket_type && (
                          <Typography variant="body2">
                            Type de billet : {registration.ticket_type.name}
                          </Typography>
                        )}
                        {registration.notes && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Notes : {registration.notes}
                          </Typography>
                        )}
                        {registration.special_requirements && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Besoins spéciaux : {registration.special_requirements}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Approuver l'inscription">
                        <IconButton
                          color="success"
                          onClick={() => handleApprove(registration.id)}
                          disabled={actionLoading[registration.id]}
                        >
                          {actionLoading[registration.id] === 'approve' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <ApproveIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeter l'inscription">
                        <IconButton
                          color="error"
                          onClick={() => handleRejectClick(registration)}
                          disabled={actionLoading[registration.id]}
                        >
                          {actionLoading[registration.id] === 'reject' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RejectIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation pour le rejet */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter l'inscription</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Êtes-vous sûr de vouloir rejeter l'inscription de{' '}
            <strong>{selectedRegistration?.user?.first_name || selectedRegistration?.user?.username}</strong> ?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motif du rejet (optionnel)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Expliquez pourquoi cette inscription est rejetée..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={actionLoading[selectedRegistration?.id]}
          >
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WaitlistManagement;






