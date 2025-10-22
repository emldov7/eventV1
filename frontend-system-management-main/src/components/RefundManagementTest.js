import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AutoAwesome as AutoIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

const RefundManagementTest = () => {
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  // Données de test
  const testRefunds = [
    {
      id: 1,
      status: 'pending',
      reason: 'Annulation personnelle',
      amount_paid: 50.00,
      refund_percentage: 100,
      refund_amount: 50.00,
      created_at: '2024-01-15T10:00:00Z',
      expires_at: '2024-01-20T10:00:00Z',
      registration: {
        user: {
          username: 'john_doe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe'
        },
        event: {
          title: 'Conférence Tech 2024',
          start_date: '2024-02-01T14:00:00Z',
          location: 'Paris, France',
          organizer: {
            username: 'tech_org'
          }
        }
      }
    },
    {
      id: 2,
      status: 'approved',
      reason: 'Événement annulé',
      amount_paid: 75.00,
      refund_percentage: 100,
      refund_amount: 75.00,
      created_at: '2024-01-14T09:00:00Z',
      expires_at: '2024-01-19T09:00:00Z',
      registration: {
        user: {
          username: 'jane_smith',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith'
        },
        event: {
          title: 'Workshop Marketing',
          start_date: '2024-01-25T10:00:00Z',
          location: 'Lyon, France',
          organizer: {
            username: 'marketing_org'
          }
        }
      }
    },
    {
      id: 3,
      status: 'processed',
      reason: 'Problème technique',
      amount_paid: 30.00,
      refund_percentage: 80,
      refund_amount: 24.00,
      created_at: '2024-01-13T08:00:00Z',
      processed_at: '2024-01-16T15:00:00Z',
      processed_by: {
        username: 'admin_user',
        email: 'admin@example.com'
      },
      registration: {
        user: {
          username: 'bob_wilson',
          email: 'bob@example.com',
          first_name: 'Bob',
          last_name: 'Wilson'
        },
        event: {
          title: 'Formation Python',
          start_date: '2024-01-20T13:00:00Z',
          location: 'Marseille, France',
          organizer: {
            username: 'python_org'
          }
        }
      }
    }
  ];

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

  const handleViewDetails = (refund) => {
    setSelectedRefund(refund);
    setDetailDialog(true);
  };

  const handleAction = (refund, action) => {
    console.log(`Action ${action} sur le remboursement ${refund.id}`);
    // Ici on simuler l'action
    alert(`Action ${action} effectuée sur le remboursement ${refund.id}`);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Test de Gestion des Remboursements
      </Typography>
      
      <Typography variant="body1" paragraph>
        Ce composant teste l'affichage et les actions sur les remboursements.
      </Typography>

      <Grid container spacing={3}>
        {testRefunds.map((refund) => (
          <Grid item xs={12} md={6} lg={4} key={refund.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">
                    Remboursement #{refund.id}
                  </Typography>
                  <Chip
                    label={getStatusLabel(refund.status)}
                    color={getStatusColor(refund.status)}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Utilisateur :</strong> {refund.registration.user.username}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Événement :</strong> {refund.registration.event.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Montant :</strong> {refund.refund_amount}€ ({refund.refund_percentage}% de {refund.amount_paid}€)
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Raison :</strong> {refund.reason}
                  </Typography>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Tooltip title="Voir les détails">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(refund)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>

                  {refund.status === 'pending' && (
                    <>
                      <Tooltip title="Approuver">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleAction(refund, 'approve')}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeter">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleAction(refund, 'reject')}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  {refund.status === 'approved' && (
                    <Tooltip title="Traiter">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleAction(refund, 'process')}
                      >
                        <AutoIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de détails */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            Détails du Remboursement #{selectedRefund?.id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRefund && (
            <Grid container spacing={3}>
              {/* Informations principales */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5">
                    Remboursement #{selectedRefund.id}
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedRefund.status)}
                    color={getStatusColor(selectedRefund.status)}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body1" color="textSecondary" paragraph>
                  {selectedRefund.reason}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Montant payé :</strong> {selectedRefund.amount_paid}€
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">
                        <strong>Montant remboursé :</strong> {selectedRefund.refund_amount}€
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        <strong>Créé le :</strong> {new Date(selectedRefund.created_at).toLocaleString('fr-FR')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="body2">
                        <strong>Expire le :</strong> {selectedRefund.expires_at ? 
                          new Date(selectedRefund.expires_at).toLocaleString('fr-FR') : 
                          'Non définie'
                        }
                      </Typography>
                    </Box>
                    {selectedRefund.processed_at && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <AutoIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="body2">
                          <strong>Traité le :</strong> {new Date(selectedRefund.processed_at).toLocaleString('fr-FR')}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* Informations utilisateur */}
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">Utilisateur</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    {selectedRefund.registration.user.username[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {selectedRefund.registration.user.first_name} {selectedRefund.registration.user.last_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      @{selectedRefund.registration.user.username}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedRefund.registration.user.email}
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
                    {selectedRefund.registration.event.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Date :</strong> {new Date(selectedRefund.registration.event.start_date).toLocaleString('fr-FR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Lieu :</strong> {selectedRefund.registration.event.location}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Organisateur :</strong> {selectedRefund.registration.event.organizer.username}
                  </Typography>
                </Box>
              </Grid>

              {/* Informations de traitement */}
              {selectedRefund.processed_by && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AutoIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Traitement</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      {selectedRefund.processed_by.username[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        Traité par {selectedRefund.processed_by.username}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedRefund.processed_by.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundManagementTest;
