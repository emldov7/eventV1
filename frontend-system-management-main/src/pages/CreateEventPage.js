import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon, VideoCall as VideoCallIcon } from '@mui/icons-material';
import { createEvent, fetchCategories, fetchTags } from '../store/slices/eventSlice';
import { eventAPI } from '../services/api';
import { showSnackbar } from '../store/slices/uiSlice';
import { getImageUrl } from '../services/api';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categories, tags, loading, error } = useSelector((state) => state.events);
  const { locale } = useSelector((state) => state.ui);
  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [newTicket, setNewTicket] = useState({ 
    name: '', 
    price: 0, 
    quantity: '', 
    is_vip: false, 
    is_discount_active: false, 
    discount_price: '', 
    discount_percent: '',
    enable_waitlist: true  // 🎯 NOUVEAU : Liste d'attente pour les types de billets
  });
  const [sessionTypes, setSessionTypes] = useState([]);
  const [newSession, setNewSession] = useState({ 
    name: '', 
    is_active: true, 
    is_mandatory: true, 
    display_order: 1 
  });
  // 🎯 NOUVEAU : État pour désactiver les billets par défaut
  const [disableDefaultTickets, setDisableDefaultTickets] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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
      enable_waitlist: true,
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

  React.useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    console.log('=== DEBUG: handleImageChange ===');
    console.log('Fichier sélectionné:', file);
    
    if (file) {
      console.log('Nom du fichier:', file.name);
      console.log('Type du fichier:', file.type);
      console.log('Taille du fichier:', file.size);
      console.log('Dernière modification:', file.lastModified);
      
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
    console.log('=== DEBUG: Données du formulaire ===');
    console.log('Données:', data);
    console.log('Tags sélectionnés:', selectedTags);

    // Forcer le type d'événement à 'physical' pour ce formulaire
    data.event_type = 'physical';
    
    const formData = new FormData();
    
    // 🎯 NOUVEAU : Gérer la désactivation des billets par défaut
    if (disableDefaultTickets && ticketTypes.length > 0) {
      // Si les billets par défaut sont désactivés, forcer les paramètres
      data.place_type = 'unlimited';  // Pas de limite globale
      data.max_capacity = null;       // Pas de capacité maximale
      data.is_free = true;            // Gratuit par défaut (les prix sont dans les types)
      data.price = 0;                 // Prix par défaut à 0
    }
    
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
          // Ne pas envoyer max_capacity si place_type est unlimited ou si billets par défaut désactivés
          if (data['place_type'] === 'limited' && data[key] && data[key] !== '' && !disableDefaultTickets) {
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
      console.log('Dernière modification:', imageFile.lastModified);
      
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
      console.log('Envoi de la requête...');
      const event = await dispatch(createEvent(formData)).unwrap();
      console.log('✅ Succès:', event);
      // Créer les types de billets si fournis
      if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
        for (const tt of ticketTypes) {
          const payload = {
            name: tt.name,
            price: Number(tt.price) || 0,
            quantity: tt.quantity === '' ? null : Number(tt.quantity),
            is_vip: !!tt.is_vip,
            is_discount_active: !!tt.is_discount_active,
            discount_price: tt.discount_price === '' ? null : Number(tt.discount_price),
            discount_percent: tt.discount_percent === '' ? null : Number(tt.discount_percent),
            enable_waitlist: !!tt.enable_waitlist,  // 🎯 NOUVEAU : Liste d'attente pour les types de billets
          };
          try { await eventAPI.createTicketType(event.id, payload); } catch (_) {}
        }
      }

      // Créer les types de sessions si fournis
      if (Array.isArray(sessionTypes) && sessionTypes.length > 0) {
        for (const st of sessionTypes) {
          const payload = {
            name: st.name,
            is_active: !!st.is_active,
            is_mandatory: !!st.is_mandatory,
            display_order: Number(st.display_order) || 1,
          };
          try { await eventAPI.createSessionType(event.id, payload); } catch (error) {
            console.error('Erreur lors de la création du type de session:', error);
          }
        }
      }
      dispatch(showSnackbar({ message: 'Événement créé avec succès', severity: 'success' }));
      navigate('/events');
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Error object:', error);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Créer un nouvel événement
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/virtual-events/create')}
            startIcon={<VideoCallIcon />}
          >
            Créer un événement virtuel
          </Button>
        </Box>
        
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

            {/* Types de billets - MASQUÉ */}
            <Grid item xs={12} sx={{ display: 'none' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Types de billets
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={disableDefaultTickets}
                      onChange={(e) => setDisableDefaultTickets(e.target.checked)}
                      color="warning"
                      disabled={ticketTypes.length === 0}
                    />
                  }
                  label="Désactiver les billets par défaut"
                />
              </Box>
              {ticketTypes.length > 0 && disableDefaultTickets && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Les billets par défaut sont désactivés. Seuls les types de billets personnalisés seront disponibles.
                </Alert>
              )}
              {ticketTypes.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  💡 <strong>Astuce :</strong> Créez des types de billets personnalisés pour désactiver automatiquement les billets par défaut.
                </Alert>
              )}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} md={3}>
                  <TextField label="Nom" fullWidth value={newTicket.name} onChange={(e)=>setNewTicket({...newTicket,name:e.target.value})} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField label="Prix ($)" type="number" fullWidth value={newTicket.price} onChange={(e)=>setNewTicket({...newTicket,price:e.target.value})} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField label="Quantité" type="number" fullWidth value={newTicket.quantity} onChange={(e)=>setNewTicket({...newTicket,quantity:e.target.value})} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControlLabel control={<Switch checked={newTicket.is_vip} onChange={(e)=>setNewTicket({...newTicket,is_vip:e.target.checked})} />} label="VIP" />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControlLabel control={<Switch checked={newTicket.enable_waitlist} onChange={(e)=>setNewTicket({...newTicket,enable_waitlist:e.target.checked})} />} label="Liste d'attente" />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button variant="outlined" onClick={()=>{
                    if(!newTicket.name) return;
                    setTicketTypes([...ticketTypes, newTicket]);
                    setNewTicket({ 
                      name: '', 
                      price: 0, 
                      quantity: '', 
                      is_vip: false, 
                      is_discount_active: false, 
                      discount_price: '', 
                      discount_percent: '',
                      enable_waitlist: true
                    });
                    // 🎯 NOUVEAU : Désactiver automatiquement les billets par défaut quand des types sont créés
                    if (ticketTypes.length === 0) {
                      setDisableDefaultTickets(true);
                    }
                  }}>Ajouter</Button>
                </Grid>
              </Grid>
              {ticketTypes.length>0 && (
                <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                  {ticketTypes.map((tt,idx)=> (
                    <Box key={idx} sx={{ p:1.5, border:'1px solid #eee', borderRadius:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <Typography>
                        {tt.name} — {tt.is_discount_active && tt.discount_price ? <><span style={{textDecoration:'line-through', marginRight:6}}>${Number(tt.price).toFixed(2)}</span><strong>${Number(tt.discount_price).toFixed(2)}</strong></> : <>${Number(tt.price).toFixed(2)}</>} 
                        {tt.is_vip ? ' • VIP' : ''} 
                        {tt.quantity ? ` • Qté: ${tt.quantity}` : ' • Illimité'} 
                        {tt.enable_waitlist ? ' • Liste d\'attente' : ''}
                      </Typography>
                      <Button color="error" onClick={()=> {
                        const newTicketTypes = ticketTypes.filter((_,i)=>i!==idx);
                        setTicketTypes(newTicketTypes);
                        // 🎯 NOUVEAU : Réactiver les billets par défaut si plus de types de billets
                        if (newTicketTypes.length === 0) {
                          setDisableDefaultTickets(false);
                        }
                      }}>Supprimer</Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>

            {/* Types de sessions */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Types de sessions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Créez des sessions que les participants devront choisir lors de l'inscription (optionnel)
              </Typography>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} md={4}>
                  <TextField 
                    label="Nom de la session" 
                    fullWidth 
                    value={newSession.name} 
                    onChange={(e) => setNewSession({...newSession, name: e.target.value})} 
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControlLabel 
                    control={<Switch checked={newSession.is_active} onChange={(e) => setNewSession({...newSession, is_active: e.target.checked})} />} 
                    label="Active" 
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControlLabel 
                    control={<Switch checked={newSession.is_mandatory} onChange={(e) => setNewSession({...newSession, is_mandatory: e.target.checked})} />} 
                    label="Obligatoire" 
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField 
                    label="Ordre" 
                    type="number" 
                    fullWidth 
                    value={newSession.display_order} 
                    onChange={(e) => setNewSession({...newSession, display_order: parseInt(e.target.value) || 1})} 
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      if (!newSession.name) return;
                      setSessionTypes([...sessionTypes, { ...newSession, id: Date.now() }]);
                      setNewSession({ 
                        name: '', 
                        is_active: true, 
                        is_mandatory: true, 
                        display_order: 1 
                      });
                    }}
                  >
                    Ajouter
                  </Button>
                </Grid>
              </Grid>
              {sessionTypes.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {sessionTypes.map((st, idx) => (
                    <Box key={idx} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{st.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {st.is_mandatory ? 'Obligatoire' : 'Optionnel'} • 
                          {st.is_active ? 'Active' : 'Inactive'} • 
                          Ordre: {st.display_order}
                        </Typography>
                      </Box>
                      <Button 
                        color="error" 
                        onClick={() => setSessionTypes(sessionTypes.filter((_, i) => i !== idx))}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
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
                Capacité et prix {disableDefaultTickets && ticketTypes.length > 0 && <Chip label="Désactivé" color="warning" size="small" sx={{ ml: 1 }} />}
              </Typography>
              {disableDefaultTickets && ticketTypes.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Les billets par défaut sont désactivés. La capacité et le prix sont gérés par les types de billets personnalisés ci-dessus.
                </Alert>
              )}
            </Grid>

            {!disableDefaultTickets && (
              <>
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

                {placeType === 'limited' && (
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Controller
                          name="enable_waitlist"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      }
                      label="Activer la liste d'attente"
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
              </>
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
                     placeholder="exemple.com ou https://exemple.com"
                     helperText="Vous pouvez saisir juste le nom de domaine, https:// sera ajouté automatiquement"
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
                  startIcon={<AddIcon />}
                  sx={{ mb: 2 }}
                >
                  Choisir une image
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Grid>

            {/* Boutons d'action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/events')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Créer l\'événement'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateEventPage; 