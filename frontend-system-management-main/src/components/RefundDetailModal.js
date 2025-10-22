import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  AutoAwesome as AutoIcon
} from '@mui/icons-material';

const RefundDetailModal = ({ open, onClose, refund }) => {
  if (!refund) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'processed': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'processed': return 'Traité';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Détails du Remboursement #{refund.id}
          </Typography>
          <Chip
            label={getStatusLabel(refund.status)}
            color={getStatusColor(refund.status)}
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informations principales */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informations Générales
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {refund.reason}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    <strong>Montant payé :</strong> {refund.amount_paid}€
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2">
                    <strong>Montant remboursé :</strong> {refund.refund_amount}€
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    <strong>Créé le :</strong> {formatDate(refund.created_at)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body2">
                    <strong>Expire le :</strong> {formatDate(refund.expires_at)}
                  </Typography>
                </Box>
                {refund.processed_at && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <AutoIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">
                      <strong>Traité le :</strong> {formatDate(refund.processed_at)}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    <strong>Pourcentage :</strong> {refund.refund_percentage}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Informations utilisateur */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Utilisateur</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2 }}>
                {refund.registration?.user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {refund.registration?.user?.first_name} {refund.registration?.user?.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  @{refund.registration?.user?.username}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {refund.registration?.user?.email}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Informations événement */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Événement</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {refund.registration?.event?.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Date :</strong> {formatDate(refund.registration?.event?.start_date)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Lieu :</strong> {refund.registration?.event?.location}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Organisateur :</strong> {refund.registration?.event?.organizer?.username}
              </Typography>
            </Box>
          </Grid>

          {/* Informations de traitement */}
          {refund.processed_by && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <AutoIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">Traitement</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    {refund.processed_by.username[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      Traité par {refund.processed_by.username}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {refund.processed_by.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </>
          )}

          {/* Informations Stripe */}
          {refund.stripe_refund_id && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informations de Paiement
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>ID Remboursement Stripe :</strong> {refund.stripe_refund_id}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundDetailModal;
