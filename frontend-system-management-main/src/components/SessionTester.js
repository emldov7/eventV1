import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import { login, logout, loadSession, listSessions } from '../store/slices/authSlice';

const SessionTester = () => {
  const dispatch = useDispatch();
  const { user, sessionId, isAuthenticated, availableSessions } = useSelector((state) => state.auth);
  const [localStorageData, setLocalStorageData] = useState({});

  console.log('🧪 [SESSION_TESTER] Rendu avec:', {
    user: user?.username,
    sessionId,
    isAuthenticated,
    availableSessionsCount: availableSessions.length
  });

  // Mettre à jour l'affichage du localStorage
  const updateLocalStorageDisplay = () => {
    console.log('🔄 [SESSION_TESTER] updateLocalStorageDisplay() appelé');
    const data = {};

    console.log('🔍 [SESSION_TESTER] localStorage.length:', localStorage.length);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log('🔍 [SESSION_TESTER] Clé localStorage:', key);

      if (key.startsWith('auth_session_')) {
        const value = localStorage.getItem(key);
        console.log('🔍 [SESSION_TESTER] Valeur pour', key, ':', value);

        try {
          data[key] = JSON.parse(value);
          console.log('✅ [SESSION_TESTER] Valeur parsée pour', key);
        } catch (e) {
          console.error('❌ [SESSION_TESTER] Erreur parsing pour', key, ':', e);
          data[key] = value;
        }
      }
    }

    // Ajouter le pointeur d'onglet depuis sessionStorage
    const currentPtr = sessionStorage.getItem('current_session_id');
    if (currentPtr) {
      data['[sessionStorage] current_session_id'] = currentPtr;
    }

    console.log('💾 [SESSION_TESTER] Données localStorage mises à jour:', data);
    setLocalStorageData(data);
  };

  useEffect(() => {
    console.log('🔧 [SESSION_TESTER] useEffect déclenché');
    updateLocalStorageDisplay();
    
    // Charger la liste des sessions disponibles
    dispatch(listSessions());

    // Mettre à jour toutes les 2 secondes
    const interval = setInterval(() => {
      console.log('⏰ [SESSION_TESTER] Mise à jour automatique localStorage');
      updateLocalStorageDisplay();
      dispatch(listSessions());
    }, 2000);

    return () => {
      console.log('🧹 [SESSION_TESTER] Nettoyage interval');
      clearInterval(interval);
    };
  }, [dispatch]);

  // Simuler une connexion avec des données de test (MOCKÉE)
  const simulateLogin = (userType) => {
    console.log('🔐 [SESSION_TESTER] simulateLogin() (MOCK) appelé pour:', userType);

    const testUsers = {
      userA: {
        username: 'userA_participant',
        role: 'participant',
        id: 1,
        email: 'userA@example.com',
        profile: { role: 'participant' }
      },
      userB: {
        username: 'userB_organizer',
        role: 'organizer',
        id: 2,
        email: 'userB@example.com',
        profile: { role: 'organizer' }
      },
      userC: {
        username: 'userC_superadmin',
        role: 'super_admin',
        id: 3,
        email: 'userC@example.com',
        profile: { role: 'super_admin' }
      }
    };

    const selectedUser = testUsers[userType];
    if (!selectedUser) {
      console.error('❌ [SESSION_TESTER] Type utilisateur inconnu:', userType);
      return;
    }

    // Créer manuellement une session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const access_token = `mock_access_token_${sessionId}`;
    const refresh_token = `mock_refresh_token_${sessionId}`;

    const userSession = {
      sessionId,
      access: access_token,
      refresh: refresh_token,
      user: selectedUser,
      timestamp: Date.now()
    };

    console.log('💾 [SESSION_TESTER] Sauvegarde session mockée dans localStorage:', {
      key: `auth_session_${sessionId}`,
      user: userSession.user?.username
    });

    localStorage.setItem(`auth_session_${sessionId}`, JSON.stringify(userSession));
    sessionStorage.setItem('current_session_id', sessionId);

    console.log('✅ [SESSION_TESTER] Session mockée sauvegardée avec succès');

    // Mettre à jour le state Redux pour refléter la nouvelle session
    dispatch(login.fulfilled({
      sessionId,
      access: access_token,
      refresh: refresh_token,
      user: selectedUser
    }));

    updateLocalStorageDisplay();
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    console.log('🚪 [SESSION_TESTER] handleLogout() appelé');
    console.log('🔄 [SESSION_TESTER] Dispatch logout');
    dispatch(logout());
  };

  // Charger une session spécifique
  const handleLoadSession = (sessionId) => {
    console.log('📂 [SESSION_TESTER] handleLoadSession() appelé pour:', sessionId);
    dispatch(loadSession(sessionId));
  };

  // Nettoyer toutes les sessions
  const clearAllSessions = () => {
    console.log('🧹 [SESSION_TESTER] clearAllSessions() appelé');

    // Récupérer toutes les clés de session
    const sessionKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('auth_session_') || key === 'access_token' || key === 'refresh_token' // Also clear old tokens
    );

    console.log('🔍 [SESSION_TESTER] Clés de session trouvées:', sessionKeys);

    // Supprimer chaque session
    sessionKeys.forEach(key => {
      console.log('🗑️ [SESSION_TESTER] Suppression de:', key);
      localStorage.removeItem(key);
    });

    console.log('✅ [SESSION_TESTER] Toutes les sessions supprimées');
    sessionStorage.removeItem('current_session_id');
    updateLocalStorageDisplay();
    
    // Forcer la déconnexion
    dispatch(logout());
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>🧪 TESTEUR DE SESSIONS MULTIPLES</Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>État Actuel</Typography>
        <Typography>Connecté: {isAuthenticated ? '✅ OUI' : '❌ NON'}</Typography>
        <Typography>Utilisateur: {user?.username || 'Aucun'}</Typography>
        <Typography>Rôle: {user?.profile?.role || 'Aucun'}</Typography>
        <Typography>Session ID: {sessionId || 'Aucun'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Actions de Test</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button onClick={() => simulateLogin('userA')} disabled={isAuthenticated}>Connecter User A (Participant)</Button>
          <Button onClick={() => simulateLogin('userB')} disabled={isAuthenticated}>Connecter User B (Organizer)</Button>
          <Button onClick={() => simulateLogin('userC')} disabled={isAuthenticated}>Connecter User C (Super Admin)</Button>
          <Button onClick={handleLogout} disabled={!isAuthenticated}>Déconnexion</Button>
          <Button onClick={clearAllSessions}>Nettoyer Toutes les Sessions</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Sessions Disponibles</Typography>
        {availableSessions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucune session disponible.
          </Typography>
        ) : (
          <List>
            {availableSessions.map((session) => (
              <ListItem key={session.sessionId} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {session.user} ({session.role})
                      </Typography>
                      {session.isCurrent && (
                        <Chip label="ACTIF" color="success" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Session: {session.sessionId}
                      <br />
                      Créée: {new Date(session.timestamp).toLocaleString()}
                    </Typography>
                  }
                />
                {!session.isCurrent && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleLoadSession(session.sessionId)}
                  >
                    Charger
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>localStorage en Temps Réel</Typography>
        <Box className="log" sx={{ maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {Object.keys(localStorageData).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune donnée de session dans localStorage.
            </Typography>
          ) : (
            Object.entries(localStorageData).map(([key, value]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: key.startsWith('auth_session_') ? 'success.main' : 'warning.main' }}>
                  {key}:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ ml: 2, fontSize: '0.7rem' }}>
                  {JSON.stringify(value, null, 2)}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>Instructions de Test</Typography>
        <Typography variant="body2">
          1. Connectez-vous avec User A
          <br />
          2. Ouvrez un nouvel onglet et connectez-vous avec User B
          <br />
          3. Revenez au premier onglet et actualisez
          <br />
          4. Vérifiez que User A voit toujours ses données
          <br />
          5. Utilisez le bouton "Charger" pour basculer entre les sessions
          <br />
          6. Vérifiez que chaque utilisateur voit ses propres données
        </Typography>
      </Paper>
    </Box>
  );
};

export default SessionTester;
