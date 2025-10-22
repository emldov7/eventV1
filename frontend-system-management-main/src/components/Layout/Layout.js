import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Si l'utilisateur n'est PAS connecté, ne pas afficher le layout avec sidebar/header
  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Outlet />
      </Box>
    );
  }

  // Déterminer si l'utilisateur doit voir la sidebar
  const shouldShowSidebar = user?.profile?.role === 'organizer' || user?.profile?.role === 'super_admin';
  
  // Si l'utilisateur n'est PAS connecté, ne pas afficher le layout avec sidebar/header
  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Outlet />
      </Box>
    );
  }

  // Si l'utilisateur EST connecté, afficher le layout avec header
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      
      {/* Sidebar seulement pour organisateurs et super admins */}
      {shouldShowSidebar && <Sidebar />}
      
      <Box
        component="main"
        className="fade-in"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Pour compenser la hauteur du header
          ml: shouldShowSidebar ? { xs: 0, sm: '240px' } : 0, // Marge à gauche seulement si sidebar visible
          backgroundColor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 