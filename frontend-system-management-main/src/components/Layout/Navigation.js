import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Event as EventIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  AccountCircle as AccountIcon,
  Home as HomeIcon,
  Bookmark as BookmarkIcon,
  Logout as LogoutIcon,
  Info as InfoIcon,
  ContactSupport as ContactIcon,
  Brightness4 as ThemeIcon,
  Brightness7 as Brightness7Icon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toggleDarkMode } from '../../store/slices/uiSlice';

const Navigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  
  // État pour le menu utilisateur
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // État pour le menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    navigate('/login');
  };

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

  const handleHome = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };


  return (
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
                  onClick={handleLogin}
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
            onClick={toggleMobileMenu}
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
              onClick={() => { handleEvents(); toggleMobileMenu(); }}
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
              onClick={() => { handleAbout(); toggleMobileMenu(); }}
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
              onClick={() => { handleContact(); toggleMobileMenu(); }}
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
                  onClick={() => { handleLogin(); toggleMobileMenu(); }}
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
                  onClick={() => { handleRegister(); toggleMobileMenu(); }}
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
                  onClick={() => { navigate('/profile'); toggleMobileMenu(); }}
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
                  onClick={() => { navigate('/dashboard/events'); toggleMobileMenu(); }}
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
                  onClick={() => { navigate('/my-registrations'); toggleMobileMenu(); }}
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
                  onClick={() => { handleLogout(); toggleMobileMenu(); }}
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
  );
};

export default Navigation;
