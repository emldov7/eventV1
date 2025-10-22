import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { AutoAwesome, Description, Tag, Palette } from '@mui/icons-material';
import api from '../services/api';

const ContentGenerator = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    price: '',
    max_capacity: ''
  });
  
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Conférence',
    'Concert', 
    'Sport',
    'Workshop',
    'Meetup'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateContent = async () => {
    if (!formData.title || !formData.category || !formData.location) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);
    // Ne pas effacer le contenu précédent pendant le chargement

    try {
      const response = await api.post('/admin/generate_content/', {
        title: formData.title,
        category: formData.category,
        location: formData.location,
        price: parseFloat(formData.price) || 0,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null
      });

      if (response.data.status === 'success') {
        setGeneratedContent(response.data.generated_content);
        setError(null); // Effacer les erreurs précédentes
      } else {
        setError('Erreur lors de la génération du contenu');
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setError(error.response?.data?.error || 'Erreur lors de la génération du contenu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      location: '',
      price: '',
      max_capacity: ''
    });
    setGeneratedContent(null);
    setError(null);
    setLoading(false); // S'assurer que le loading est arrêté
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* En-tête avec indication du rôle requis */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>🤖 Générateur de Contenu IA</strong> - Outil exclusif pour les <strong>organisateurs d'événements</strong> et <strong>super administrateurs</strong>
        </Typography>
      </Alert>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: 'primary.main',
        fontWeight: 'bold'
      }}>
        <AutoAwesome />
        Générateur Automatique de Contenu
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Générez automatiquement des descriptions, hashtags et suggestions visuelles pour vos événements
      </Typography>

      {/* Formulaire */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Informations de l'événement
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Titre de l'événement *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Workshop Innovation Tech"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Catégorie *"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lieu *"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ex: Montreal, Paris, Lyon"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Prix (€)"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Capacité max"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => handleInputChange('max_capacity', e.target.value)}
                placeholder="Illimitée"
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={generateContent}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
              sx={{ 
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)'
                }
              }}
            >
              {loading ? 'Génération...' : 'Générer le Contenu'}
            </Button>
            
                         <Button
               variant="outlined"
               onClick={resetForm}
               disabled={loading}
               sx={{ mr: 1 }}
             >
               Réinitialiser
             </Button>
             
             {generatedContent && (
               <Button
                 variant="outlined"
                 onClick={generateContent}
                 disabled={loading}
                 color="secondary"
               >
                 Régénérer le Contenu
               </Button>
             )}
          </Box>
        </CardContent>
      </Card>

      {/* Affichage des erreurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Contenu généré */}
      {generatedContent && (
        <Grid container spacing={3}>
          {/* Description générée */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                }}>
                  <Description />
                  Description Générée
                </Typography>
                <Typography variant="body2" sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontStyle: 'italic'
                }}>
                  {generatedContent.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Hashtags générés */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                }}>
                  <Tag />
                  Hashtags Optimisés
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {generatedContent.hashtags.map((hashtag, index) => (
                    <Chip
                      key={index}
                      label={hashtag}
                      variant="outlined"
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Suggestions visuelles */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main'
                }}>
                  <Palette />
                  Suggestions Visuelles
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Couleurs */}
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Couleurs suggérées
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {generatedContent.visual_suggestions.colors.slice(0, 4).map((color, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: color,
                            borderRadius: 1,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          title={color}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Thèmes */}
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Thèmes
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {generatedContent.visual_suggestions.themes.slice(0, 3).map((theme, index) => (
                        <Chip
                          key={index}
                          label={theme}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Style */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Style recommandé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {generatedContent.visual_suggestions.style}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Recommandations */}
                {generatedContent.visual_suggestions.recommendations && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Recommandations personnalisées
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {generatedContent.visual_suggestions.recommendations.map((rec, index) => (
                        <Typography key={index} component="li" variant="body2" sx={{ mb: 1 }}>
                          {rec}
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Exemples d'utilisation */}
      {!generatedContent && !loading && (
        <Card sx={{ mt: 4, backgroundColor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💡 Exemples d'utilisation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Essayez ces exemples pour voir le générateur en action :
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ p: 2, cursor: 'pointer' }} 
                      onClick={() => setFormData({
                        title: 'Workshop Innovation Tech',
                        category: 'Workshop',
                        location: 'Paris',
                        price: '50',
                        max_capacity: '25'
                      })}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎓 Workshop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Workshop Innovation Tech à Paris
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ p: 2, cursor: 'pointer' }}
                      onClick={() => setFormData({
                        title: 'Festival de Musique Électronique',
                        category: 'Concert',
                        location: 'Montreal',
                        price: '45',
                        max_capacity: '500'
                      })}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎵 Concert
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Festival de Musique Électronique à Montreal
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ p: 2, cursor: 'pointer' }}
                      onClick={() => setFormData({
                        title: 'Meetup Développeurs Web',
                        category: 'Meetup',
                        location: 'Lyon',
                        price: '0',
                        max_capacity: '50'
                      })}>
                  <Typography variant="subtitle2" gutterBottom>
                    🤝 Meetup
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Meetup Développeurs Web à Lyon
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ContentGenerator;
