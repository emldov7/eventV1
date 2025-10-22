import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser, logout, loadSession } from './store/slices/authSlice';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr, enUS, es } from 'date-fns/locale';

// Redux actions
import { hideSnackbar } from './store/slices/uiSlice';

// Thèmes
import { theme, darkTheme } from './theme';

// Composants
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import OrganizerRoute from './components/Auth/OrganizerRoute';
import AIChatbotWidget from './components/AIChatbotWidget';

// Pages
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import MyEventsPage from './pages/MyEventsPage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import FacebookAuthCallback from './pages/FacebookAuthCallback';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import QRCodeScannerPage from './pages/QRCodeScannerPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import VirtualEventList from './components/VirtualEventList';
import VirtualEventDisplay from './components/VirtualEventDisplay';
import VirtualEventCreation from './components/VirtualEventCreation';
import VirtualEventRecordingManager from './components/VirtualEventRecordingManager';
import VirtualEventAnalytics from './components/VirtualEventAnalytics';
import ContentGenerator from './components/ContentGenerator';
import PublicHomePage from './pages/PublicHomePage';
import SessionTester from './components/SessionTester';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import RefundsPage from './pages/RefundsPage';
import RemindersTab from './components/OrganizerDashboard/RemindersTab';


// Composant principal de l'application
const App = () => {
  const { locale, darkMode } = useSelector((state) => state.ui);
  const currentTheme = darkMode ? darkTheme : theme;
  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
        <Elements stripe={stripePromise}>
          <AppRoutes />
        </Elements>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

// Composant des routes
function AppRoutes() {
  const { isAuthenticated, loading: authLoading, initialized } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  console.log('🚀 [APP] AppRoutes rendu avec:', {
    isAuthenticated,
    authLoading,
    initialized
  });

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    console.log('🔧 [APP] useEffect d\'initialisation déclenché');
    console.log('🔍 [APP] État actuel:', { isAuthenticated, initialized });
    
    const initializeAuth = async () => {
      console.log('🔄 [APP] initializeAuth() démarré');
      
      // Vérifier s'il y a une session active (pointeur par onglet)
      const currentSessionId = sessionStorage.getItem('current_session_id');
      console.log('🔍 [APP] current_session_id trouvé:', currentSessionId);
      
      if (currentSessionId) {
        console.log('✅ [APP] Session trouvée, tentative de restauration');
        try {
          // Charger la session depuis localStorage
          console.log('🔄 [APP] Appel dispatch(loadSession())');
          await dispatch(loadSession(currentSessionId));
          console.log('✅ [APP] Session restaurée avec succès');
          
          // Si l'utilisateur n'est pas encore chargé, le récupérer depuis l'API
          if (!isAuthenticated) {
            console.log('🔄 [APP] Appel dispatch(getCurrentUser()) pour récupérer les données utilisateur');
            await dispatch(getCurrentUser());
            console.log('✅ [APP] getCurrentUser réussi');
          }
        } catch (error) {
          console.error('❌ [APP] Erreur lors de la restauration de session:', error);
          console.log('🔄 [APP] Force la déconnexion en cas d\'erreur');
          dispatch(logout());
        }
      } else if (isAuthenticated && !initialized) {
        console.log('✅ [APP] Utilisateur authentifié mais pas initialisé, appel getCurrentUser');
        try {
          console.log('🔄 [APP] Appel dispatch(getCurrentUser())');
          await dispatch(getCurrentUser());
          console.log('✅ [APP] getCurrentUser réussi');
        } catch (error) {
          console.error('❌ [APP] Erreur lors de l\'initialisation de l\'auth:', error);
          console.log('🔄 [APP] Force la déconnexion en cas d\'erreur');
          dispatch(logout());
        }
      } else {
        console.log('ℹ️ [APP] Pas d\'initialisation nécessaire:', {
          isAuthenticated,
          initialized,
          hasCurrentSession: !!currentSessionId
        });
      }
    };
    
    initializeAuth();
  }, [dispatch, isAuthenticated, initialized]);

  const handleSnackbarClose = () => {
    dispatch(hideSnackbar());
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Chargement...
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Page d'accueil publique - accessible à tous, SANS layout */}
        <Route path="/" element={<PublicHomePage />} />
        
        {/* Page d'accueil publique alternative - accessible à tous, SANS layout */}
        <Route path="/home" element={<PublicHomePage />} />
        
        {/* Route de test pour le système de sessions */}
        <Route path="/test-sessions" element={<SessionTester />} />
        
        {/* Pages publiques */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Routes d'authentification */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 🔐 Routes d'authentification sociale */}
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/auth/facebook/callback" element={<FacebookAuthCallback />} />
        

        
        {/* Routes protégées avec layout - DASHBOARD */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="create-event" element={<CreateEventPage />} />
          <Route path="edit-event/:id" element={<EditEventPage />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="my-registrations" element={<MyRegistrationsPage />} />
          <Route path="refunds" element={<RefundsPage />} />
          <Route path="reminders" element={<RemindersTab />} />
          <Route path="super-admin" element={<SuperAdminDashboard />} />
          {/* Événements virtuels */}
          <Route path="virtual-events" element={<VirtualEventList />} />
          <Route path="virtual-events/create" element={<VirtualEventCreation />} />
          <Route path="virtual-events/:id" element={<VirtualEventDisplay />} />
          <Route path="virtual-events/:id/recording" element={<VirtualEventRecordingManager />} />
          <Route path="virtual-events/analytics" element={<VirtualEventAnalytics />} />
          <Route path="scan" element={<QRCodeScannerPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="ai-content-generator" element={
            <OrganizerRoute>
              <ContentGenerator />
            </OrganizerRoute>
          } />
        </Route>



        <Route path="/dashboard/organizer" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="create-event" element={<CreateEventPage />} />
          <Route path="edit-event/:id" element={<EditEventPage />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="my-registrations" element={<MyRegistrationsPage />} />
          <Route path="refunds" element={<RefundsPage />} />
          <Route path="reminders" element={<RemindersTab />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="scan" element={<QRCodeScannerPage />} />
          <Route path="virtual-events" element={<VirtualEventList />} />
          <Route path="virtual-events/create" element={<VirtualEventCreation />} />
          <Route path="virtual-events/:id" element={<VirtualEventDisplay />} />
          <Route path="virtual-events/:id/recording" element={<VirtualEventRecordingManager />} />
          <Route path="virtual-events/analytics" element={<VirtualEventAnalytics />} />
          <Route path="ai-content-generator" element={<ContentGenerator />} />
        </Route>

        {/* Routes directes pour éviter les erreurs 404 */}
        <Route path="/events" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<EventsPage />} />
          <Route path=":id" element={<EventDetailPage />} />
        </Route>
        
        {/* 🎯 NOUVELLES ROUTES PUBLIQUES pour les visiteurs */}
        <Route path="/public/events" element={<EventsPage />} />
        <Route path="/public/events/:id" element={<EventDetailPage />} />

        <Route path="/create-event" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CreateEventPage />} />
        </Route>

        <Route path="/edit-event/:id" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<EditEventPage />} />
        </Route>

        <Route path="/my-events" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<MyEventsPage />} />
        </Route>

        <Route path="/my-registrations" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<MyRegistrationsPage />} />
        </Route>

        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<ProfilePage />} />
        </Route>

        <Route path="/scan" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<QRCodeScannerPage />} />
        </Route>

        <Route path="/virtual-events" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<VirtualEventList />} />
          <Route path="create" element={<VirtualEventCreation />} />
          <Route path=":id" element={<VirtualEventDisplay />} />
          <Route path=":id/recording" element={<VirtualEventRecordingManager />} />
          <Route path="analytics" element={<VirtualEventAnalytics />} />
        </Route>

        <Route path="/ai-content-generator" element={
          <ProtectedRoute>
            <OrganizerRoute>
              <Layout />
            </OrganizerRoute>
          </ProtectedRoute>
        }>
          <Route index element={<ContentGenerator />} />
        </Route>
        
        {/* Route 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Snackbar global */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.persist ? null : 6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Chatbot IA flottant - visible partout */}
      <AIChatbotWidget />
    </>
  );
}

// Mémoriser la promesse Stripe pour éviter les re-créations
const stripePublicKey = process.env.REACT_APP_STRIPE_PK || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

export default App; 