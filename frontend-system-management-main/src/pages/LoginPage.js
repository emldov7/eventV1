import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';
import {
  Event as EventIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  AccountCircle as AccountIcon,
  Home as HomeIcon,
  Bookmark as BookmarkIcon,
  Logout as LogoutIcon,
  Brightness4 as ThemeIcon,
  Brightness7 as Brightness7Icon,
  Info as InfoIcon,
  ContactSupport as ContactIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toggleDarkMode } from '../store/slices/uiSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  
  // Récupérer le message de la page d'accueil publique
  const messageFromHome = location.state?.message;
  
  // État pour le menu utilisateur
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // État pour le menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [localLoading, setLocalLoading] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    navigate('/login');
  };

  // Fonctions pour les icônes
  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
  };


  const handleEvents = () => {
    if (isAuthenticated) {
      navigate('/dashboard/events');
    } else {
      navigate('/public/events');
    }
  };

  const handleAbout = () => {
    navigate('/about');
  };

  const handleContact = () => {
    navigate('/contact');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    
    try {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        // Redirection intelligente selon le rôle
        const user = result.payload;
        
        if (user.profile?.role === 'super_admin') {
          // Super Admin va directement au dashboard Super Admin
          navigate('/dashboard/super-admin');
        } else if (user.profile?.role === 'organizer') {
          // Organisateur approuvé va au dashboard organisateur
          navigate('/dashboard/organizer');
        } else {
          // Participant va à la page d'accueil publique
          navigate('/');
        }
      }
    } catch (error) {
      console.error('❌ [LOGIN_PAGE] Erreur lors de la connexion:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header public */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, rgba(108,99,255,0.95) 0%, rgba(34,211,238,0.95) 100%)',
          boxShadow: '0 2px 20px rgba(108,99,255,0.3)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo et titre */}
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              cursor: 'pointer',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}
            onClick={() => navigate('/')}
          >
            🎉 Gestion d'Événements
          </Typography>
          
          {/* Navigation desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            {/* Icône thème */}
            <IconButton
              onClick={handleThemeToggle}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <ThemeIcon />}
            </IconButton>


            {/* Icône événements */}
            <IconButton
              onClick={handleEvents}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              <EventIcon />
            </IconButton>

            {/* Lien À propos */}
            <Button
              startIcon={<InfoIcon />}
              onClick={handleAbout}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
                fontWeight: 500,
              }}
            >
              À propos
            </Button>

            {/* Lien Contact */}
            <Button
              startIcon={<ContactIcon />}
              onClick={handleContact}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
                fontWeight: 500,
              }}
            >
              Contact
            </Button>
            
            {/* Boutons de connexion/inscription ou profil utilisateur */}
            <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
              {!isAuthenticated ? (
                // Boutons pour visiteurs non connectés
                <>
                  <Button
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.7)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderColor: 'white',
                      },
                      fontWeight: 600,
                    }}
                  >
                    Se connecter
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleRegister}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    S'inscrire
                  </Button>
                </>
              ) : (
                // Icône profil pour utilisateurs connectés
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                  
                  {/* Menu déroulant utilisateur */}
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                      <AccountIcon sx={{ mr: 2, color: 'primary.main' }} />
                      Mon Profil
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/'); }}>
                      <HomeIcon sx={{ mr: 2, color: 'primary.main' }} />
                      Accueil
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard/events'); }}>
                      <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                      Événements
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/my-registrations'); }}>
                      <BookmarkIcon sx={{ mr: 2, color: 'primary.main' }} />
                      Mes Inscriptions
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 2, color: 'error.main' }} />
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Box>
          
          {/* Menu hamburger pour mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            {/* Icônes essentielles pour mobile */}
            <IconButton
              onClick={handleThemeToggle}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <ThemeIcon />}
            </IconButton>
            
            <IconButton
              onClick={handleMobileMenuToggle}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Toolbar>
        
        {/* Menu mobile */}
        {mobileMenuOpen && (
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              backgroundColor: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              
              {/* Événements */}
              <Button
                startIcon={<EventIcon />}
                onClick={() => { handleEvents(); handleMobileMenuClose(); }}
                sx={{
                  color: 'white',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                Événements
              </Button>
              
              {/* À propos */}
              <Button
                startIcon={<InfoIcon />}
                onClick={() => { handleAbout(); handleMobileMenuClose(); }}
                sx={{
                  color: 'white',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                À propos
              </Button>
              
              {/* Contact */}
              <Button
                startIcon={<ContactIcon />}
                onClick={() => { handleContact(); handleMobileMenuClose(); }}
                sx={{
                  color: 'white',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                Contact
              </Button>
              
              {/* Boutons de connexion/inscription pour mobile */}
              {!isAuthenticated ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    onClick={() => { navigate('/login'); handleMobileMenuClose(); }}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.7)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderColor: 'white',
                      },
                      fontWeight: 600,
                    }}
                  >
                    Se connecter
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => { handleRegister(); handleMobileMenuClose(); }}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                  >
                    S'inscrire
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Button
                    startIcon={<AccountIcon />}
                    onClick={() => { navigate('/profile'); handleMobileMenuClose(); }}
                    sx={{
                      color: 'white',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Mon Profil
                  </Button>
                  
                  <Button
                    startIcon={<EventIcon />}
                    onClick={() => { navigate('/dashboard/events'); handleMobileMenuClose(); }}
                    sx={{
                      color: 'white',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Événements
                  </Button>
                  
                  <Button
                    startIcon={<BookmarkIcon />}
                    onClick={() => { navigate('/my-registrations'); handleMobileMenuClose(); }}
                    sx={{
                      color: 'white',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Mes Inscriptions
                  </Button>
                  
                  <Button
                    startIcon={<LogoutIcon />}
                    onClick={() => { handleLogout(); handleMobileMenuClose(); }}
                    sx={{
                      color: 'white',
                      justifyContent: 'flex-start',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Déconnexion
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </AppBar>

      {/* Contenu principal */}
      <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Connexion
          </Typography>

          {/* Message de la page d'accueil publique */}
          {messageFromHome && (
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              {messageFromHome}
            </Alert>
          )}

          {isAuthenticated && (
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              Vous êtes déjà connecté en tant que <strong>{user?.username}</strong> ({user?.profile?.role === 'super_admin' ? 'Super Admin' : user?.profile?.role === 'organizer' ? 'Organisateur' : 'Participant'}). 
              <br />
                              <Button 
                  variant="text" 
                  color="primary" 
                  onClick={() => {
                    if (user?.profile?.role === 'super_admin') {
                      navigate('/dashboard/super-admin');
                    } else if (user?.profile?.role === 'organizer') {
                      navigate('/dashboard/organizer');
                    } else {
                      navigate('/');
                    }
                  }}
                  sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                >
                  {user?.profile?.role === 'participant' ? 'Aller à l\'accueil' : 'Aller au dashboard'}
                </Button>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {typeof error === 'string' ? error : error.detail || error.message || 'Une erreur est survenue'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nom d'utilisateur"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
                      <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={localLoading}
          >
            {localLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
          
          {/* 🔐 Boutons d'authentification sociale */}
          <SocialAuthButtons 
            onSuccess={(data) => {
              console.log('✅ [LOGIN_PAGE] Social auth success:', data);
              // Redirection intelligente selon le rôle
              if (data.user.profile?.role === 'super_admin') {
                navigate('/dashboard/super-admin');
              } else if (data.user.profile?.role === 'organizer') {
                navigate('/dashboard/organizer');
              } else {
                navigate('/');
              }
            }}
            onError={(error) => {
              console.error('❌ [LOGIN_PAGE] Social auth error:', error);
              // Gérer l'erreur (afficher un message, etc.)
            }}
            loading={localLoading}
            setLoading={setLocalLoading}
          />
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Vous n'avez pas de compte ? Inscrivez-vous"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 