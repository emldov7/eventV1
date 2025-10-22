import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  AccountCircle,
  Event as EventIcon,
  Add as AddIcon,
  QrCodeScanner as ScannerIcon,
  Logout as LogoutIcon,
  Info as InfoIcon,
  ContactSupport as ContactIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleDarkMode, toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/dashboard/profile');
  };

  const handleDashboard = () => {
    handleClose();
    navigate('/dashboard');
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Fonctions pour les nouveaux liens
  const handleAbout = () => {
    navigate('/about');
  };

  const handleContact = () => {
    navigate('/contact');
  };

  const mobileMenuItems = [
    { text: 'Accueil', icon: <EventIcon />, action: () => navigate('/') },
    { text: 'Mon Profil', icon: <AccountCircle />, action: () => navigate('/dashboard/profile') },
    { text: 'Événements', icon: <EventIcon />, action: () => navigate('/dashboard/events') },
    { text: 'Mes Inscriptions', icon: <AddIcon />, action: () => navigate('/dashboard/my-registrations') },
    { text: 'À propos', icon: <InfoIcon />, action: () => navigate('/about') },
    { text: 'Contact', icon: <ContactIcon />, action: () => navigate('/contact') },
    ...(user?.profile?.role === 'organizer' || user?.profile?.role === 'super_admin' ? [
      { text: 'Tableau de bord', icon: <EventIcon />, action: () => navigate('/dashboard') },
      { text: 'Mes Événements', icon: <EventIcon />, action: () => navigate('/dashboard/my-events') },
      { text: 'Créer un événement', icon: <EventIcon />, action: () => navigate('/dashboard/create-event') },
      { text: 'Scanner billets', icon: <ScannerIcon />, action: () => navigate('/scan') },
    ] : []),
    ...(user?.profile?.role === 'super_admin' ? [
      { text: '👑 Super Admin', icon: <AccountCircle />, action: () => navigate('/dashboard/super-admin') }
    ] : []),
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, rgba(108,99,255,0.85) 0%, rgba(34,211,238,0.85) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            '&:hover': {
              color: '#f0f0f0',
              textShadow: '0 2px 6px rgba(0,0,0,0.5)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={() => navigate('/')}
        >
          Gestion d'Événements
        </Typography>

        {/* Boutons visibles sur desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => dispatch(toggleDarkMode())}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>


          <Button 
            color="inherit" 
            onClick={() => navigate('/dashboard/events')}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
              fontWeight: 600,
            }}
          >
            Événements
          </Button>

          {/* Lien À propos */}
          <Button
            color="inherit"
            startIcon={<InfoIcon />}
            onClick={handleAbout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
              fontWeight: 500,
            }}
          >
            À propos
          </Button>

          {/* Lien Contact */}
          <Button
            color="inherit"
            startIcon={<ContactIcon />}
            onClick={handleContact}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
              fontWeight: 500,
            }}
          >
            Contact
          </Button>

          {/* Boutons organisateur - Seulement pour organisateurs et super admins */}
          {user?.profile?.role !== 'participant' && (
            <>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/dashboard/create-event')}
                sx={{
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  fontWeight: 600,
                }}
              >
                Créer un événement
              </Button>
              
              <Button 
                variant="outlined" 
                color="inherit" 
                onClick={() => navigate('/scan')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderColor: '#ffffff',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  fontWeight: 600,
                }}
              >
                Scanner billets
              </Button>
            </>
          )}
        </Box>

        {/* Menu mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={() => dispatch(toggleDarkMode())}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>

        {/* Avatar et menu utilisateur - Pour TOUS les utilisateurs connectés */}
        {user && (
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {user?.profile_picture ? (
              <Avatar
                src={user.profile_picture}
                alt={user.username}
                sx={{ 
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
                  '&:hover': {
                    boxShadow: '0 0 0 3px rgba(255,255,255,1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            ) : (
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : <AccountCircle />}
              </Avatar>
            )}
          </IconButton>
        )}

        {/* Menu utilisateur */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderRadius: 2,
            },
          }}
        >
          <MenuItem onClick={() => { handleClose(); navigate('/dashboard/profile'); }}>
            <AccountCircle sx={{ mr: 2, color: 'primary.main' }} />
            Mon Profil
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/'); }}>
            <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
            Accueil
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/dashboard/events'); }}>
            <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
            Événements
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/dashboard/my-registrations'); }}>
            <AddIcon sx={{ mr: 2, color: 'primary.main' }} />
            Mes Inscriptions
          </MenuItem>
          
          {/* Options supplémentaires pour organisateurs et super admins */}
          {(user?.profile?.role === 'organizer' || user?.profile?.role === 'super_admin') && (
            <>
              <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                Tableau de bord
              </MenuItem>
              {user?.profile?.role === 'super_admin' && (
                <MenuItem onClick={() => { handleClose(); navigate('/dashboard/super-admin'); }}>
                  <AccountCircle sx={{ mr: 2, color: 'primary.main' }} />
                  👑 Super Admin
                </MenuItem>
              )}
            </>
          )}
          
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 2, color: 'error.main' }} />
            Déconnexion
          </MenuItem>
        </Menu>

        {/* Drawer mobile */}
        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          PaperProps={{
            sx: {
              width: 280,
              background: 'linear-gradient(135deg, rgba(108,99,255,0.95) 0%, rgba(34,211,238,0.95) 100%)',
              color: '#ffffff',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
              Menu
            </Typography>
            <List>
              {mobileMenuItems.map((item, index) => (
                <React.Fragment key={item.text}>
                  <ListItem 
                    button 
                    onClick={() => {
                      item.action();
                      handleMobileMenuClose();
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                  {index < mobileMenuItems.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 