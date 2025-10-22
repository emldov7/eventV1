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
  Switch,
  FormControlLabel,
  Pagination,
  CircularProgress,
  Snackbar,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({});
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
      };
      
      const response = await api.get('/admin/all_users/', { params });
      setUsers(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    
    if (action === 'change_role') {
      setActionData({ new_role: user.role });
    } else if (action === 'suspend' || action === 'activate') {
      setActionData({ reason: '' });
    } else {
      setActionData({});
    }
    
    setActionDialog(true);
  };

  const confirmAction = async () => {
    try {
      const payload = {
        user_id: selectedUser.id,
        action: actionType,
        ...actionData
      };

      await api.post('/admin/manage_user/', payload);
      
      showSnackbar('Action effectuée avec succès', 'success');
      setActionDialog(false);
      setSelectedUser(null);
      setActionType('');
      setActionData({});
      loadUsers(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      showSnackbar('Erreur lors de l\'action', 'error');
    }
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailDialog(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'organizer': return 'primary';
      case 'participant': return 'success';
      case 'guest': return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'organizer': return 'Organisateur';
      case 'participant': return 'Participant';
      case 'guest': return 'Invité';
      default: return role;
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
          Gestion des Utilisateurs
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
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
          placeholder="Nom, email, username..."
          InputProps={{
            startAdornment: <SearchIcon />
          }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Rôle</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Rôle"
          >
            <MenuItem value="">Tous les rôles</MenuItem>
            <MenuItem value="super_admin">Super Admin</MenuItem>
            <MenuItem value="organizer">Organisateur</MenuItem>
            <MenuItem value="participant">Participant</MenuItem>
            <MenuItem value="guest">Invité</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Statut"
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="active">Actif</MenuItem>
            <MenuItem value="inactive">Inactif</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => window.dispatchEvent(new CustomEvent('openUserCreation'))}
        >
          Créer un Utilisateur
        </Button>
      </Box>

      {/* Table des utilisateurs */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Événements</TableCell>
              <TableCell>Inscriptions</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>{user.username[0].toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.username}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.first_name} {user.last_name}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">{user.email}</Typography>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Actif' : 'Inactif'}
                    color={user.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {user.events_count || 0}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {user.registrations_count || 0}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(user.date_joined).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Voir le profil">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewUserDetails(user)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Changer le rôle">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => handleUserAction(user, 'change_role')}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {user.is_active ? (
                      <Tooltip title="Suspendre">
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleUserAction(user, 'suspend')}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Réactiver">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleUserAction(user, 'activate')}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleUserAction(user, 'delete')}
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
          {actionType === 'suspend' && 'Suspendre l\'utilisateur'}
          {actionType === 'activate' && 'Réactiver l\'utilisateur'}
          {actionType === 'change_role' && 'Changer le rôle'}
          {actionType === 'delete' && 'Supprimer l\'utilisateur'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'change_role' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Nouveau rôle</InputLabel>
              <Select
                value={actionData.new_role || ''}
                onChange={(e) => setActionData({ ...actionData, new_role: e.target.value })}
                label="Nouveau rôle"
              >
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="organizer">Organisateur</MenuItem>
                <MenuItem value="participant">Participant</MenuItem>
                <MenuItem value="guest">Invité</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {(actionType === 'suspend' || actionType === 'delete') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison"
              value={actionData.reason || ''}
              onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
              placeholder="Raison de la suspension/suppression..."
              sx={{ mt: 2 }}
            />
          )}
          
          {actionType === 'delete' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette action est irréversible. L'utilisateur sera définitivement supprimé.
            </Alert>
          )}
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Utilisateur: <strong>{selectedUser?.username}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Annuler</Button>
          <Button 
            onClick={confirmAction} 
            color={actionType === 'delete' ? 'error' : 'primary'}
            variant="contained"
            disabled={actionType === 'suspend' && !actionData.reason?.trim()}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails de l'utilisateur */}
      <Dialog open={userDetailDialog} onClose={() => setUserDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Profil de l'Utilisateur</Typography>
            <Button onClick={() => setUserDetailDialog(false)}>Fermer</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar sx={{ width: 80, height: 80 }}>
                  {selectedUser.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    @{selectedUser.username}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                                 <Grid item xs={12} md={6}>
                   <Typography variant="h6" gutterBottom>Informations générales</Typography>
                   <Box>
                     <Box display="flex" alignItems="center" gap={1} mb={1}>
                       <Typography variant="body2" color="textSecondary">
                         Rôle:
                       </Typography>
                       <Chip label={getRoleLabel(selectedUser.role)} color={getRoleColor(selectedUser.role)} size="small" />
                     </Box>
                     <Box display="flex" alignItems="center" gap={1} mb={1}>
                       <Typography variant="body2" color="textSecondary">
                         Statut:
                       </Typography>
                       <Chip label={selectedUser.is_active ? 'Actif' : 'Inactif'} color={selectedUser.is_active ? 'success' : 'error'} size="small" />
                     </Box>
                     <Typography variant="body2" color="textSecondary" mb={1}>
                       Date d'inscription: {new Date(selectedUser.date_joined).toLocaleDateString('fr-FR')}
                     </Typography>
                     {selectedUser.last_login && (
                       <Typography variant="body2" color="textSecondary">
                         Dernière connexion: {new Date(selectedUser.last_login).toLocaleDateString('fr-FR')}
                       </Typography>
                     )}
                   </Box>
                 </Grid>

                                 <Grid item xs={12} md={6}>
                   <Typography variant="h6" gutterBottom>Statistiques</Typography>
                   <Box>
                     <Typography variant="body2" color="textSecondary" mb={1}>
                       Événements organisés: {selectedUser.events_count || 0}
                     </Typography>
                     <Typography variant="body2" color="textSecondary" mb={1}>
                       Inscriptions: {selectedUser.registrations_count || 0}
                     </Typography>
                     {selectedUser.total_revenue && (
                       <Typography variant="body2" color="textSecondary">
                         Revenus générés: ${selectedUser.total_revenue}
                       </Typography>
                     )}
                   </Box>
                 </Grid>
              </Grid>
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

export default UserManagement;
