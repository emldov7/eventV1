import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../services/api';

const UserCreationModal = ({ open, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'participant'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const roleOptions = [
    { value: 'participant', label: 'Participant', description: 'Utilisateur standard qui peut s\'inscrire aux événements' },
    { value: 'organizer', label: 'Organisateur', description: 'Peut créer et gérer des événements' },
    { value: 'super_admin', label: 'Super Administrateur', description: 'Accès complet à la plateforme' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom de famille est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async () => {
    if (!validateForm()) {
      return;
  }

  try {
    setLoading(true);
    
    // Utiliser l'API réelle
    const response = await api.post('/admin/create_user/', {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      role: formData.role
    });
    
    onUserCreated(response.data);
    showSnackbar('Utilisateur créé avec succès', 'success');
    handleClose();
    
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    showSnackbar('Erreur lors de la création de l\'utilisateur', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'participant'
    });
    setErrors({});
    onClose();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAddIcon color="primary" />
            Créer un Nouvel Utilisateur
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box mt={2}>
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
              <TextField
                fullWidth
                label="Nom de famille"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Box>
            
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                error={!!errors.username}
                helperText={errors.username}
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Box>
            
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
                required
              />
              <TextField
                fullWidth
                label="Confirmer le mot de passe"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                required
              />
            </Box>
            
            <Box display="flex" gap={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Téléphone (optionnel)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
              <FormControl fullWidth required>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Rôle"
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Box fontWeight="bold">{option.label}</Box>
                        <Box fontSize="0.875rem" color="text.secondary">
                          {option.description}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Note :</strong> L'utilisateur recevra un email de confirmation avec ses identifiants de connexion.
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </DialogActions>
      </Dialog>
      
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
    </>
  );
};

export default UserCreationModal;
