import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Avatar,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  Event as EventIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Bookmark as BookmarkIcon,
  QrCodeScanner as QrCodeScannerIcon,
  AdminPanelSettings as SuperAdminIcon,
  VideoCall as VideoCallIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  AttachMoney as MoneyIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const drawerWidth = 240;

const baseMenuItems = [
  { text: 'Accueil', icon: <HomeIcon />, path: '/' },
  { text: 'Événements', icon: <EventIcon />, path: '/dashboard/events' },
  { text: 'Mon profil', icon: <PersonIcon />, path: '/dashboard/profile' },
];

const organizerMenuItems = [
  { text: 'Créer un événement', icon: <AddIcon />, path: '/dashboard/create-event' },
  { text: 'Mes événements', icon: <EventIcon />, path: '/dashboard/my-events' },
  { text: '📧 Rappels', icon: <EmailIcon />, path: '/dashboard/reminders' },
  { text: '💰 Remboursements', icon: <MoneyIcon />, path: '/dashboard/refunds' },
  { text: 'Scanner billets', icon: <QrCodeScannerIcon />, path: '/dashboard/scan' },
];

const participantMenuItems = [
  { text: 'Mes inscriptions', icon: <BookmarkIcon />, path: '/dashboard/my-registrations' },
];

const virtualEventItems = [
  { text: 'Événements virtuels', icon: <VideoCallIcon />, path: '/dashboard/virtual-events' },
  { text: 'Créer événement virtuel', icon: <AddIcon />, path: '/dashboard/virtual-events/create' },
  { text: 'Analytics virtuels', icon: <AnalyticsIcon />, path: '/dashboard/virtual-events/analytics' },
];

const aiItems = [
  { text: '🤖 Générateur IA', icon: <AutoAwesomeIcon />, path: '/dashboard/ai-content-generator' },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const handleNavigation = (path) => {
    navigate(path);
    dispatch(setSidebarOpen(false));
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={user?.profile_picture} sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {user?.username || 'Utilisateur'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.email || 'Bienvenue'}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {(() => {
          let menuItems = [...baseMenuItems];
          
          // Ajouter les options selon le rôle
          if (user && user.profile) {
            const userRole = user.profile.role;
            
            if (userRole === 'participant') {
              // PARTICIPANTS : seulement les options de base + inscriptions
              menuItems.push(...participantMenuItems);
            } else if (userRole === 'organizer' || userRole === 'super_admin') {
              // ORGANISATEURS & SUPER ADMINS : toutes les options
              menuItems.push(...organizerMenuItems);
              
              // Ajouter Super Admin Dashboard pour super admins
              if (userRole === 'super_admin' || user.is_superuser) {
                menuItems.splice(3, 0, { text: '🎛️ Super Admin', icon: <SuperAdminIcon />, path: '/dashboard/super-admin' });
              }
              
              // Ajouter la section des événements virtuels
              menuItems.push(...virtualEventItems);
              
              // Ajouter la section IA seulement pour les organisateurs et super admins
              if (userRole === 'organizer' || userRole === 'super_admin') {
                menuItems.push(...aiItems);
              }
            }
          }
          
          return menuItems;
        })().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Sidebar mobile (temporaire) */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => dispatch(setSidebarOpen(false))}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundImage: (theme) => theme.palette.gradients?.sidebar,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Sidebar desktop (permanente) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundImage: (theme) => theme.palette.gradients?.sidebar,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar; 