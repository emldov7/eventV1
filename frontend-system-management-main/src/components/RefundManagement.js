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
  AccordionDetails,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  AutoAwesome as AutoIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import api from '../services/api';
import RefundDetailModal from './RefundDetailModal';

const RefundManagement = ({ open, onClose, event }) => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRefunds, setSelectedRefunds] = useState([]);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [refundDetailDialog, setRefundDetailDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  const [actionData, setActionData] = useState({ reason: '' });

  useEffect(() => {
    if (open) {
      loadRefunds();
    }
  }, [open, currentPage, searchTerm, statusFilter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };
      
      const response = await api.get('/organizer/refunds/', { params });
      setRefunds(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des remboursements:', error);
      showSnackbar('Erreur lors du chargement des remboursements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (refund, action) => {
    setSelectedRefund(refund);
    setActionType(action);
    setActionData({ reason: '' });
    setActionDialog(true);
  };

  const handleBulkAction = async (action) => {
    if (selectedRefunds.length === 0) {
      showSnackbar('Aucun remboursement sélectionné', 'warning');
      return;
    }

    setActionType(action);
    setActionData({ reason: '' });
    setActionDialog(true);
  };

  const confirmAction = async () => {
    try {
      let response;
      
      if (actionType === 'bulk_approve' || actionType === 'bulk_reject') {
        // Action en lot
        const payload = {
          refund_ids: selectedRefunds,
          action: actionType === 'bulk_approve' ? 'approve' : 'reject',
          reason: actionData.reason
        };
        response = await api.post('/organizer/bulk_process_refunds/', payload);
      } else {
        // Action individuelle
        const payload = {
          refund_id: selectedRefund.id,
          action: actionType,
          reason: actionData.reason
        };
        response = await api.post(`/organizer/refunds/${selectedRefund.id}/process/`, payload);
      }
      
      showSnackbar('Action effectuée avec succès', 'success');
      setActionDialog(false);
      setSelectedRefund(null);
      setActionType('');
      setActionData({ reason: '' });
      setSelectedRefunds([]);
      loadRefunds();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      showSnackbar('Erreur lors de l\'action', 'error');
    }
  };

  const handleViewRefundDetails = (refund) => {
    setSelectedRefund(refund);
    setRefundDetailDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'processed': return 'info';
      case 'rejected': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'processed': return 'Traité';
      case 'rejected': return 'Rejeté';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve': return <CheckIcon />;
      case 'reject': return <CancelIcon />;
      case 'process': return <AutoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approve': return 'success';
      case 'reject': return 'error';
      case 'process': return 'info';
      default: return 'default';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'approve': return 'Approuver';
      case 'reject': return 'Rejeter';
      case 'process': return 'Traiter';
      case 'bulk_approve': return 'Approuver en lot';
      case 'bulk_reject': return 'Rejeter en lot';
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

  const handleSelectRefund = (refundId) => {
    setSelectedRefunds(prev => 
      prev.includes(refundId) 
        ? prev.filter(id => id !== refundId)
        : [...prev, refundId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRefunds.length === refunds.length) {
      setSelectedRefunds([]);
    } else {
      setSelectedRefunds(refunds.map(refund => refund.id));
    }
  };

  const getPendingRefundsCount = () => {
    return refunds.filter(refund => refund.status === 'pending').length;
  };

  const getApprovedRefundsCount = () => {
    return refunds.filter(refund => refund.status === 'approved').length;
  };

  const getProcessedRefundsCount = () => {
    return refunds.filter(refund => refund.status === 'processed').length;
  };

  const getRejectedRefundsCount = () => {
    return refunds.filter(refund => refund.status === 'rejected').length;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2">
            Gestion des Remboursements
          </Typography>
          <Button onClick={onClose} color="primary">
            ✕
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="h3">
              {event?.title ? `Remboursements pour "${event.title}"` : 'Tous les remboursements'}
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadRefunds}
              variant="outlined"
            >
              Actualiser
            </Button>
          </Box>

          {/* Statistiques des remboursements */}
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: 'warning.main', mr: 2 }}>
                        <WarningIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography variant="h4" component="div">
                          {getPendingRefundsCount()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          En attente
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: 'success.main', mr: 2 }}>
                        <CheckIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography variant="h4" component="div">
                          {getApprovedRefundsCount()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Approuvés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: 'info.main', mr: 2 }}>
                        <AutoIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography variant="h4" component="div">
                          {getProcessedRefundsCount()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Traités
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: 'error.main', mr: 2 }}>
                        <CancelIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography variant="h4" component="div">
                          {getRejectedRefundsCount()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Rejetés
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ color: 'primary.main', mr: 2 }}>
                        <MoneyIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography variant="h4" component="div">
                          {refunds.length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Onglets de statut */}
          <Box mb={3}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab 
                label={
                  <Badge badgeContent={getPendingRefundsCount()} color="warning">
                    En Attente
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getApprovedRefundsCount()} color="success">
                    Approuvés
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getProcessedRefundsCount()} color="info">
                    Traités
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getRejectedRefundsCount()} color="error">
                    Rejetés
                  </Badge>
                } 
              />
              <Tab label="Tous" />
            </Tabs>
          </Box>

          {/* Actions en lot */}
          {selectedRefunds.length > 0 && (
            <Box mb={3} p={2} bgcolor="action.hover" borderRadius={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  {selectedRefunds.length} remboursement(s) sélectionné(s)
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleBulkAction('bulk_approve')}
                    size="small"
                  >
                    Approuver en lot
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleBulkAction('bulk_reject')}
                    size="small"
                  >
                    Rejeter en lot
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Filtres et recherche */}
          <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Utilisateur, événement, raison..."
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
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="approved">Approuvé</MenuItem>
                <MenuItem value="processed">Traité</MenuItem>
                <MenuItem value="rejected">Rejeté</MenuItem>
                <MenuItem value="expired">Expiré</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Table des remboursements */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedRefunds.length > 0 && selectedRefunds.length < refunds.length}
                      checked={selectedRefunds.length === refunds.length && refunds.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Événement</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Date de création</TableCell>
                  <TableCell>Échéance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refunds
                  .filter(refund => {
                    if (activeTab === 0) return refund.status === 'pending';
                    if (activeTab === 1) return refund.status === 'approved';
                    if (activeTab === 2) return refund.status === 'processed';
                    if (activeTab === 3) return refund.status === 'rejected';
                    return true; // Tous les remboursements
                  })
                  .map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRefunds.includes(refund.id)}
                        onChange={() => handleSelectRefund(refund.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {refund.user?.username?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {refund.user?.username || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                            {refund.user?.email || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {refund.event?.title || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                          {refund.created_at ? 
                            new Date(refund.created_at).toLocaleDateString('fr-FR') : 
                            'Date non spécifiée'
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={getStatusLabel(refund.status)}
                        color={getStatusColor(refund.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {refund.refund_amount}€
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                          {refund.refund_percentage}% de {refund.amount_paid}€
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(refund.created_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {refund.expires_at ? 
                          new Date(refund.expires_at).toLocaleDateString('fr-FR') : 
                          'Non définie'
                        }
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Voir les détails">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewRefundDetails(refund)}
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
                                onClick={() => handleRefundAction(refund, 'approve')}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rejeter">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleRefundAction(refund, 'reject')}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {refund.status === 'approved' && (
                          <Tooltip title="Traiter (Finaliser le remboursement)">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handleRefundAction(refund, 'process')}
                            >
                              <AutoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {refund.status === 'processed' && (
                          <Tooltip title="Déjà traité">
                            <IconButton 
                              size="small" 
                              color="default"
                              disabled
                            >
                              <AutoIcon />
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

          {/* Dialog pour les actions */}
          <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getActionIcon(actionType)}
                <Typography variant="h6">
                  {getActionLabel(actionType)}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {actionType.includes('bulk') ? (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {selectedRefunds.length} remboursement(s) sélectionné(s)
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Remboursement: <strong>{selectedRefund?.registration?.event?.title}</strong>
                </Typography>
              )}
              
              {(actionType === 'reject' || actionType === 'bulk_reject') && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Raison du rejet"
                  value={actionData.reason || ''}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="Raison du rejet..."
                  sx={{ mt: 2 }}
                  required
                />
              )}

              {actionType === 'approve' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Le remboursement sera approuvé et pourra être traité.
                </Alert>
              )}

              {actionType === 'reject' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Le remboursement sera définitivement rejeté.
                </Alert>
              )}

              {actionType === 'process' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Le remboursement sera traité et le montant sera remboursé.
                </Alert>
              )}

              {actionType === 'bulk_approve' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Tous les remboursements sélectionnés seront approuvés.
                </Alert>
              )}

              {actionType === 'bulk_reject' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Tous les remboursements sélectionnés seront rejetés.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog(false)}>Annuler</Button>
              <Button 
                onClick={confirmAction} 
                color={getActionColor(actionType)}
                variant="contained"
                disabled={actionType.includes('reject') && !actionData.reason}
              >
                {getActionLabel(actionType)}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de détails du remboursement */}
          <Dialog open={refundDetailDialog} onClose={() => setRefundDetailDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Détails du Remboursement</Typography>
                <Button onClick={() => setRefundDetailDialog(false)}>Fermer</Button>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedRefund && (
                <Grid container spacing={3}>
                  {/* Informations principales */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography variant="h4" component="h1" gutterBottom>
                            Remboursement #{selectedRefund.id}
                          </Typography>
                          <Chip
                            label={getStatusLabel(selectedRefund.status)}
                            color={getStatusColor(selectedRefund.status)}
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body1" color="textSecondary" paragraph>
                          {selectedRefund.reason || 'Aucune raison spécifiée'}
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
                              <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                              <Typography variant="body2">
                                <strong>Pourcentage :</strong> {selectedRefund.refund_percentage}%
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="body2">
                                <strong>Créé le :</strong> {new Date(selectedRefund.created_at).toLocaleString('fr-FR')}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" mb={1}>
                              <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
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
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Informations utilisateur */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader
                        title="Utilisateur"
                        avatar={<PersonIcon />}
                      />
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ mr: 2 }}>
                            {selectedRefund.registration?.user?.username?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {selectedRefund.registration?.user?.first_name} {selectedRefund.registration?.user?.last_name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              @{selectedRefund.registration?.user?.username}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {selectedRefund.registration?.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Informations événement */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader
                        title="Événement"
                        avatar={<EventIcon />}
                      />
                      <CardContent>
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {selectedRefund.registration?.event?.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>Date :</strong> {selectedRefund.registration?.event?.start_date ? 
                              new Date(selectedRefund.registration.event.start_date).toLocaleString('fr-FR') : 
                              'Non spécifiée'
                            }
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>Lieu :</strong> {selectedRefund.registration?.event?.location || 'Non spécifié'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Organisateur :</strong> {selectedRefund.registration?.event?.organizer?.username || 'N/A'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Informations de traitement */}
                  {selectedRefund.processed_by && (
                    <Grid item xs={12}>
                      <Card>
                        <CardHeader
                          title="Traitement"
                          avatar={<AutoIcon />}
                        />
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ mr: 2 }}>
                              {selectedRefund.processed_by?.username?.[0]?.toUpperCase() || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1">
                                Traité par {selectedRefund.processed_by?.username}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {selectedRefund.processed_by?.email}
                              </Typography>
                            </Box>
                          </Box>
                          {selectedRefund.stripe_refund_id && (
                            <Typography variant="body2" color="textSecondary">
                              <strong>ID Stripe :</strong> {selectedRefund.stripe_refund_id}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
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
      </DialogContent>
    </Dialog>
  );
};

export default RefundManagement;
