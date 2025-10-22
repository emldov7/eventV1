import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  TextareaAutosize,
  useTheme,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Send as SendIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import Navigation from '../components/Layout/Navigation';

const ContactPage = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const contactInfo = [
    {
      icon: <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Email',
      value: 'kossiemmanueldovon@gmail.com',
      description: 'Réponse sous 24h',
    },
    {
      icon: <PhoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Téléphone',
      value: '+1 5146212053',
      description: 'Lun-Ven: 9h-18h',
    },
    {
      icon: <LocationIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Adresse',
      value: '1514 av Saint Laurent',
      description: 'Siège social',
    },
    {
      icon: <TimeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Horaires',
      value: 'Lundi - Vendredi',
      description: '9h00 - 18h00 (CET)',
    },
  ];

  const supportTopics = [
    {
      title: 'Support Technique',
      description: 'Aide avec la plateforme, bugs, problèmes de connexion',
      contact: 'support@gestion-evenements.com',
    },
    {
      title: 'Ventes & Partenariats',
      description: 'Demandes commerciales, tarifs, collaborations',
      contact: 'commercial@gestion-evenements.com',
    },
    {
      title: 'Formation & Onboarding',
      description: 'Formation des équipes, accompagnement personnalisé',
      contact: 'formation@gestion-evenements.com',
    },
    {
      title: 'Presse & Communication',
      description: 'Relations presse, interviews, communiqués',
      contact: 'presse@gestion-evenements.com',
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setSnackbar({
        open: true,
        message: 'Veuillez remplir tous les champs',
        severity: 'error',
      });
      return;
    }

    // Simulation d'envoi
    console.log('Formulaire soumis:', formData);
    
    setSnackbar({
      open: true,
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.',
      severity: 'success',
    });

    // Réinitialiser le formulaire
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        {/* En-tête de la page */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #6C63FF 0%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            Contactez-Nous
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: 800,
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Nous sommes là pour vous aider ! Contactez notre équipe pour toute question, 
            suggestion ou demande d'assistance.
          </Typography>
        </Box>

        {/* Informations de contact */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 4,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            Nos Coordonnées
          </Typography>
          <Grid container spacing={3}>
            {contactInfo.map((info, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(108,99,255,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {info.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: 'text.primary',
                      }}
                    >
                      {info.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 1,
                        color: 'primary.main',
                        fontWeight: 500,
                      }}
                    >
                      {info.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {info.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Formulaire de contact et sujets de support */}
        <Grid container spacing={4}>
          {/* Formulaire de contact */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: 3,
                border: '1px solid rgba(108,99,255,0.1)',
              }}
            >
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  color: 'text.primary',
                }}
              >
                Envoyez-nous un Message
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom complet *"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sujet *"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message *"
                      name="message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #6C63FF 0%, #22D3EE 100%)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(108,99,255,0.3)',
                        },
                      }}
                    >
                      Envoyer le Message
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Sujets de support */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                background: 'linear-gradient(135deg, #6C63FF 0%, #22D3EE 100%)',
                borderRadius: 3,
                color: 'white',
                height: 'fit-content',
              }}
            >
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  color: 'white',
                }}
              >
                Besoin d'Aide ?
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
                  Contactez directement nos équipes spécialisées :
                </Typography>
                
                {supportTopics.map((topic, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: 'white',
                      }}
                    >
                      {topic.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        opacity: 0.9,
                        lineHeight: 1.5,
                      }}
                    >
                      {topic.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      📧 {topic.contact}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <SupportIcon sx={{ fontSize: 60, opacity: 0.8, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  Support 24/7
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Notre équipe est disponible pour vous accompagner
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* FAQ rapide */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mt: 6,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: 3,
            border: '2px dashed rgba(108,99,255,0.3)',
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 4,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            Questions Fréquentes
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                ⏱️ Délai de réponse
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Nous nous engageons à répondre à toutes vos demandes dans un délai maximum de 24 heures ouvrables.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                🌍 Support multilingue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Notre équipe parle français, anglais et espagnol pour vous accompagner dans votre langue.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                📱 Support mobile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Contactez-nous depuis n'importe quel appareil, nous sommes accessibles partout !
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                🎯 Demande urgente
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pour les demandes urgentes, appelez-nous directement au +1 5146212053.
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ContactPage;
















