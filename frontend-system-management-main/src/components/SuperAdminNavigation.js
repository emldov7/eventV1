import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as AnalyticsIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Psychology as AIIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const SuperAdminNavigation = ({ 
  activeTab, 
  onTabChange, 
  notifications = 0, 
  pendingModeration = 0,
  pendingRefunds = 0 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const getTabIcon = (tabIndex) => {
    switch (tabIndex) {
      case 0: return <PeopleIcon />;
      case 1: return <EventIcon />;
      case 2: return <WarningIcon />;
      case 3: return <MoneyIcon />;
      case 4: return <AnalyticsIcon />;
      case 5: return <AIIcon />;
      case 6: return <CategoryIcon />;
      case 7: return <SettingsIcon />;
      default: return <DashboardIcon />;
    }
  };

  const getTabLabel = (tabIndex) => {
    switch (tabIndex) {
      case 0: return 'Utilisateurs';
      case 1: return 'Événements';
      case 2: return 'Modération';
      case 3: return 'Remboursements';
      case 4: return 'Analytics';
      case 5: return 'IA Prédictive';
      case 6: return 'Catégories & Tags';
      case 7: return 'Système';
      default: return 'Dashboard';
    }
  };

  const getTabBadge = (tabIndex) => {
    switch (tabIndex) {
      case 2: return pendingModeration;
      case 3: return pendingRefunds;
      default: return 0;
    }
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Super Admin Dashboard
          </Typography>
        </Box>

        {/* Navigation tabs */}
        <Box display="flex" gap={1} sx={{ mr: 3 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((tabIndex) => {
            const badge = getTabBadge(tabIndex);
            return (
              <Button
                key={tabIndex}
                variant={activeTab === tabIndex ? 'contained' : 'text'}
                startIcon={getTabIcon(tabIndex)}
                onClick={() => onTabChange(tabIndex)}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  position: 'relative'
                }}
              >
                {getTabLabel(tabIndex)}
                {badge > 0 && (
                  <Chip
                    label={badge}
                    size="small"
                    color="error"
                    sx={{
                      ml: 1,
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.75rem'
                    }}
                  />
                )}
              </Button>
            );
          })}
        </Box>

        {/* Notifications et profil */}
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton color="inherit" size="large">
            <Badge badgeContent={notifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              SA
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              Super Admin
            </Typography>
          </Box>

          <IconButton color="inherit" onClick={handleLogout} size="large">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SuperAdminNavigation;
