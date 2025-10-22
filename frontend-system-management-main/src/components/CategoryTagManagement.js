import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import api from '../services/api';

const CategoryTagManagement = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    icon: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Utiliser les vraies APIs
      const [categoriesResponse, tagsResponse] = await Promise.all([
        api.get('/categories_management/'),
        api.get('/tags_management/')
      ]);
      setCategories(categoriesResponse.data || []);
      setTags(tagsResponse.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showSnackbar('Erreur lors du chargement des données', 'error');
      // En cas d'erreur, utiliser des tableaux vides
      setCategories([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      icon: ''
    });
    setCategoryDialog(true);
  };

  const handleAddTag = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      color: '#666666'
    });
    setTagDialog(true);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    if (type === 'category') {
      setFormData({
        name: item.name,
        description: item.description || '',
        color: item.color || '#1976d2',
        icon: item.icon || ''
      });
      setCategoryDialog(true);
    } else {
      setFormData({
        name: item.name,
        color: item.color || '#666666'
      });
      setTagDialog(true);
    }
  };

  const handleDelete = async (item, type) => {
    try {
      if (type === 'category') {
        await api.delete(`/categories_management/${item.id}/`);
        showSnackbar('Catégorie supprimée avec succès', 'success');
      } else {
        await api.delete(`/tags_management/${item.id}/`);
        showSnackbar('Tag supprimé avec succès', 'success');
      }
      loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        // Mise à jour
        if (categoryDialog) {
          await api.patch(`/categories_management/${editingItem.id}/`, formData);
          showSnackbar('Catégorie mise à jour avec succès', 'success');
        } else {
          await api.patch(`/tags_management/${editingItem.id}/`, formData);
          showSnackbar('Tag mis à jour avec succès', 'success');
        }
      } else {
        // Création
        if (categoryDialog) {
          await api.post('/categories_management/', formData);
          showSnackbar('Catégorie créée avec succès', 'success');
        } else {
          await api.post('/tags_management/', formData);
          showSnackbar('Tag créé avec succès', 'success');
        }
      }
      
      setCategoryDialog(false);
      setTagDialog(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', color: '#1976d2', icon: '' });
      loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showSnackbar('Erreur lors de la sauvegarde', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      <Grid container spacing={3}>
        {/* Gestion des Catégories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <CategoryIcon />
                  Gestion des Catégories
                </Box>
              }
              action={
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddCategory}
                  variant="contained"
                  size="small"
                >
                  Ajouter
                </Button>
              }
            />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Couleur</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {category.icon && (
                              <Typography variant="h6">{category.icon}</Typography>
                            )}
                            <Typography variant="subtitle2">{category.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {category.description || 'Aucune description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: category.color,
                                borderRadius: '50%',
                                border: '1px solid #ddd'
                              }}
                            />
                            <Typography variant="body2">{category.color}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Modifier">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleEdit(category, 'category')}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDelete(category, 'category')}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Gestion des Tags */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <TagIcon />
                  Gestion des Tags
                </Box>
              }
              action={
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddTag}
                  variant="contained"
                  size="small"
                >
                  Ajouter
                </Button>
              }
            />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Couleur</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Typography variant="subtitle2">{tag.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: tag.color,
                                borderRadius: '50%',
                                border: '1px solid #ddd'
                              }}
                            />
                            <Typography variant="body2">{tag.color}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Modifier">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleEdit(tag, 'tag')}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDelete(tag, 'tag')}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog pour les catégories */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Nom de la catégorie"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Icône (emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🎉"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Couleur"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              type="color"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ColorIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingItem ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour les tags */}
      <Dialog open={tagDialog} onClose={() => setTagDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Modifier le tag' : 'Ajouter un tag'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Nom du tag"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Couleur"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              type="color"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ColorIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingItem ? 'Modifier' : 'Ajouter'}
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
    </Box>
  );
};

export default CategoryTagManagement;
