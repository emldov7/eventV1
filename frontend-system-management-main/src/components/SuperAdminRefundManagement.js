import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../services/api';
import RefundDetailModal from './RefundDetailModal';

const SuperAdminRefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/refunds/');
      // L'API retourne { count, results, page, page_size, total_pages }
      // Nous voulons le tableau 'results'
      setRefunds(response.data?.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des remboursements:', error);
      showSnackbar('Erreur lors du chargement des remboursements', 'error');
      setRefunds([]); // En cas d'erreur, initialiser avec un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (refund) => {
    setSelectedRefund(refund);
    setDetailDialog(true);
  };

  const handleAction = (refund, action) => {
    setSelectedRefund(refund);
    setActionType(action);
    setActionDialog(true);
    setReason('');
  };

  const confirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await api.post(`/admin/process_refund/`, {
          refund_id: selectedRefund.id,
          action: 'approve'
        });
      } else if (actionType === 'reject') {
        await api.post(`/admin/process_refund/`, {
          refund_id: selectedRefund.id,
          action: 'reject',
          reason
        });
      }
      
      showSnackbar('Action effectuée avec succès', 'success');
      setActionDialog(false);
      loadRefunds();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'action';
      showSnackbar(errorMessage, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'processed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'processed': return 'Traité';
      default: return status;
    }
  };

  // S'assurer que refunds est toujours un tableau
  const refundsArray = Array.isArray(refunds) ? refunds : [];
  
  const filteredRefunds = refundsArray.filter(refund => {
    if (statusFilter && refund.status !== statusFilter) return false;
    return true;
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
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
          title="Gestion des Remboursements"
          subheader={`${filteredRefunds.length} remboursement(s) trouvé(s)`}
          action={
            <Box display="flex" gap={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Statut"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="approved">Approuvé</MenuItem>
                  <MenuItem value="rejected">Rejeté</MenuItem>
                  <MenuItem value="processed">Traité</MenuItem>
                </Select>
              </FormControl>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadRefunds}
                variant="outlined"
                size="small"
              >
                Actualiser
              </Button>
            </Box>
          }
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Demandeur</TableCell>
                  <TableCell>Événement</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date de demande</TableCell>
                  <TableCell>Raison</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund.id}>
                                         <TableCell>
                       <Box>
                         <Typography variant="subtitle2">
                           {refund.user?.username || 'N/A'}
                         </Typography>
                         <Typography variant="body2" color="textSecondary">
                           ID: {refund.user?.id || 'N/A'}
                         </Typography>
                       </Box>
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2">
                         {refund.event?.title || 'N/A'}
                       </Typography>
                     </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        ${refund.amount_paid}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(refund.status)}
                        color={getStatusColor(refund.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(refund.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {refund.reason || 'Aucune raison spécifiée'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                                             <Box display="flex" gap={1}>
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
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rejeter">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleAction(refund, 'reject')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog pour les actions */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approuver le remboursement' : 'Rejeter le remboursement'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
                         <Typography variant="body2" gutterBottom>
               <strong>Demandeur:</strong> {selectedRefund?.user?.username}
             </Typography>
             <Typography variant="body2" gutterBottom>
               <strong>Événement:</strong> {selectedRefund?.event?.title}
             </Typography>
            <Typography variant="body2" gutterBottom>
                              <strong>Montant:</strong> ${selectedRefund?.amount_paid}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Raison de la demande:</strong> {selectedRefund?.reason || 'Aucune'}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison de la décision"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder={
                actionType === 'approve' 
                  ? 'Raison de l\'approbation (optionnel)'
                  : 'Raison du rejet (requis)'
              }
              required={actionType === 'reject'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Annuler</Button>
          <Button 
            onClick={confirmAction} 
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionType === 'reject' && !reason.trim()}
          >
            {actionType === 'approve' ? 'Approuver' : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
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

      {/* Modal de détails du remboursement */}
      <RefundDetailModal
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        refund={selectedRefund}
      />
    </Box>
  );
};

export default SuperAdminRefundManagement;
