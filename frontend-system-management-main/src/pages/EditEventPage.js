import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr, enUS, es } from 'date-fns/locale';
import { Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { updateEvent, fetchEventById, fetchCategories, fetchTags, deleteEvent, fetchMyEvents, fetchEvents } from '../store/slices/eventSlice';
import { showSnackbar } from '../store/slices/uiSlice';
import { getImageUrl } from '../services/api';

const EditEventPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { currentEvent, categories, tags, loading, error } = useSelector((state) => state.events);
  const { locale } = useSelector((state) => state.ui);
  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      short_description: '',
      start_date: new Date(),
      end_date: new Date(),
      location: '',
      address: '',
      place_type: 'unlimited',
      max_capacity: '',
      price: 0,
      is_free: true,
      category: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      is_featured: false,
      is_public: true,
    },
  });

  const isFree = watch('is_free');
  const placeType = watch('place_type');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTags());
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentEvent) {
      reset({
        title: currentEvent.title || '',
        description: currentEvent.description || '',
        short_description: currentEvent.short_description || '',
        start_date: currentEvent.start_date ? new Date(currentEvent.start_date) : new Date(),
        end_date: currentEvent.end_date ? new Date(currentEvent.end_date) : new Date(),
        location: currentEvent.location || '',
        address: currentEvent.address || '',
        place_type: currentEvent.place_type || 'unlimited',
        max_capacity: currentEvent.max_capacity || '',
        price: currentEvent.price || 0,
        is_free: currentEvent.is_free !== undefined ? currentEvent.is_free : true,
        category: currentEvent.category?.id || '',
        contact_email: currentEvent.contact_email || '',
        contact_phone: currentEvent.contact_phone || '',
        website: currentEvent.website || '',
        is_featured: currentEvent.is_featured || false,
        is_public: currentEvent.is_public !== undefined ? currentEvent.is_public : true,
      });

      // Définir les tags sélectionnés
      if (currentEvent.tags && Array.isArray(currentEvent.tags)) {
        setSelectedTags(currentEvent.tags.map(tag => tag.id));
      }

      // Définir l'aperçu de l'image
      if (currentEvent.poster) {
        setImagePreview(currentEvent.poster);
      }
    }
  }, [currentEvent, reset]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    console.log('=== DEBUG: EditEventPage handleImageChange ===');
    console.log('Fichier sélectionné:', file);
    
    if (file) {
      console.log('Nom du fichier:', file.name);
      console.log('Type du fichier:', file.type);
      console.log('Taille du fichier:', file.size);
      
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        console.error('❌ Le fichier sélectionné n\'est pas une image');
        alert('Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('❌ Le fichier est trop volumineux');
        alert('Le fichier est trop volumineux. Taille maximale : 5MB');
        return;
      }
      
      console.log('✅ Image valide sélectionnée');
      
      // Stocker le fichier dans le state
      setSelectedImageFile(file);
      console.log('✅ Fichier stocké dans le state');
      
      // Créer l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log('✅ Aperçu de l\'image généré');
      };
      reader.onerror = () => {
        console.error('❌ Erreur lors de la lecture du fichier');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ Aucun fichier sélectionné');
      setImagePreview(null);
      setSelectedImageFile(null);
    }
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const onSubmit = async (data) => {
    console.log('=== DEBUG: EditEventPage onSubmit ===');
    console.log('Données:', data);
    console.log('Tags sélectionnés:', selectedTags);
    
    const formData = new FormData();
    
    // Ajouter les champs de base
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'start_date' || key === 'end_date') {
          formData.append(key, data[key].toISOString());
        } else if (key === 'category') {
          // Convertir category en category_id, ignorer si vide
          if (data[key] && data[key] !== '') {
            formData.append('category_id', data[key]);
          }
        } else if (key === 'max_capacity') {
          // Ne pas envoyer max_capacity si place_type est unlimited
          if (data['place_type'] === 'limited' && data[key] && data[key] !== '') {
            formData.append(key, data[key]);
          }
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Ajouter les tags sélectionnés
    selectedTags.forEach((tagId) => {
      formData.append('tag_ids', tagId);
    });

    // Ajouter l'image si sélectionnée
    console.log('=== DEBUG: Image ===');
    console.log('Image du state:', selectedImageFile);
    console.log('Image de l\'input:', document.getElementById('poster-input').files[0]);
    
    // Utiliser l'image du state plutôt que de l'input
    const imageFile = selectedImageFile || document.getElementById('poster-input').files[0];
    console.log('Image finale utilisée:', imageFile);
    
    if (imageFile) {
      console.log('Nom de l\'image:', imageFile.name);
      console.log('Type de l\'image:', imageFile.type);
      console.log('Taille de l\'image:', imageFile.size);
      
      // Vérifier que c'est bien une image
      if (!imageFile.type.startsWith('image/')) {
        console.error('❌ Le fichier n\'est pas une image valide');
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      formData.append('poster', imageFile);
      console.log('✅ Image ajoutée au FormData');
      
      // Vérifier que l'image a bien été ajoutée
      const formDataEntries = Array.from(formData.entries());
      const posterEntry = formDataEntries.find(([key]) => key === 'poster');
      if (posterEntry) {
        console.log('✅ Image confirmée dans FormData:', posterEntry[1].name);
      } else {
        console.error('❌ Image non trouvée dans FormData');
      }
    } else {
      console.log('❌ Aucune image trouvée');
    }

    console.log('=== DEBUG: Contenu du FormData ===');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      console.log('Envoi de la requête de mise à jour...');
      const updated = await dispatch(updateEvent({ id, eventData: formData })).unwrap();
      console.log('✅ Mise à jour réussie');
      // Rafraîchir les données pour refléter immédiatement le changement
      await Promise.all([
        dispatch(fetchEventById(id)),
        dispatch(fetchMyEvents()),
        dispatch(fetchEvents({})),
      ]);
      dispatch(showSnackbar({ message: 'Événement mis à jour', severity: 'success' }));
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await dispatch(deleteEvent(id)).unwrap();
        navigate('/events');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!currentEvent) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Événement non trouvé
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Modifier l'événement
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {typeof error === 'string' ? error : error.detail || error.message || 'Une erreur est survenue'}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations de base
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Le titre est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Titre de l'événement"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Catégorie</InputLabel>
                    <Select {...field} label="Catégorie">
                      <MenuItem value="">Aucune catégorie</MenuItem>
                                        {Array.isArray(categories) && categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="short_description"
                control={control}
                rules={{ maxLength: { value: 300, message: 'Maximum 300 caractères' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description courte"
                    fullWidth
                    multiline
                    rows={2}
                    error={!!errors.short_description}
                    helperText={errors.short_description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'La description est requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description complète"
                    fullWidth
                    multiline
                    rows={6}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.isArray(tags) && tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    onClick={() => handleTagToggle(tag.id)}
                    color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                    variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Dates et lieu */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dates et lieu
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{ required: 'La date de début est requise' }}
                  render={({ field }) => (
                    <DateTimePicker
                      {...field}
                      label="Date et heure de début"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.start_date,
                          helperText: errors.start_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
                <Controller
                  name="end_date"
                  control={control}
                  rules={{ required: 'La date de fin est requise' }}
                  render={({ field }) => (
                    <DateTimePicker
                      {...field}
                      label="Date et heure de fin"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.end_date,
                          helperText: errors.end_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                rules={{ required: 'Le lieu est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Lieu"
                    fullWidth
                    error={!!errors.location}
                    helperText={errors.location?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Adresse complète"
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Capacité et prix */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Capacité et prix
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="place_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Type de places</InputLabel>
                    <Select {...field} label="Type de places">
                      <MenuItem value="unlimited">Places illimitées</MenuItem>
                      <MenuItem value="limited">Places limitées</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {placeType === 'limited' && (
              <Grid item xs={12} md={4}>
                <Controller
                  name="max_capacity"
                  control={control}
                  rules={{ 
                    required: placeType === 'limited' ? 'La capacité maximale est requise' : false,
                    min: { value: 1, message: 'Minimum 1 place' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Capacité maximale"
                      type="number"
                      fullWidth
                      error={!!errors.max_capacity}
                      helperText={errors.max_capacity?.message}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Controller
                    name="is_free"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                }
                label="Événement gratuit"
              />
            </Grid>

            {!isFree && (
              <Grid item xs={12} md={4}>
                <Controller
                  name="price"
                  control={control}
                  rules={{ 
                    required: !isFree ? 'Le prix est requis' : false,
                    min: { value: 0, message: 'Le prix doit être positif' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Prix ($)"
                      type="number"
                      fullWidth
                      error={!!errors.price}
                      helperText={errors.price?.message}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Contact et options */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact et options
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="contact_email"
                control={control}
                rules={{ 
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email de contact"
                    type="email"
                    fullWidth
                    error={!!errors.contact_email}
                    helperText={errors.contact_email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="contact_phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Téléphone de contact"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Site web"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Controller
                    name="is_featured"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                }
                label="Événement en vedette"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Controller
                    name="is_public"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                }
                label="Événement public"
              />
            </Grid>

            {/* Image */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Affiche de l'événement
              </Typography>
              <input
                id="poster-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="poster-input">
                <Button
                  variant="outlined"
                  component="span"
                  sx={{ mb: 2 }}
                >
                  Changer l'image
                </Button>
              </label>
              {/* Afficher l'image existante ou l'aperçu de la nouvelle image */}
              {(imagePreview || currentEvent.poster) && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={imagePreview || getImageUrl(currentEvent.poster)}
                    alt="Aperçu"
                    style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Grid>

            {/* Boutons d'action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Supprimer
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate(`/events/${id}`)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Sauvegarder'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditEventPage; 