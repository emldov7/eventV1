import { createTheme } from '@mui/material/styles';

// Thème clair modernisé (gradients, glassmorphism, hover states raffinés)
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5', // Bleu plus sombre et agréable
      light: '#6366F1',
      dark: '#3730A3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0891B2', // Cyan plus sombre
      light: '#06B6D4',
      dark: '#0E7490',
      contrastText: '#ffffff',
    },
    success: { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
    warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
    error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    info: { main: '#1D4ED8', light: '#3B82F6', dark: '#1E40AF' },
    background: {
      default: '#F1F5F9', // Gris plus sombre
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155', // Gris plus sombre
      disabled: '#64748B',
    },
    // Dégradés réutilisables
    gradients: {
      header: 'linear-gradient(135deg, rgba(79,70,229,0.85) 0%, rgba(8,145,178,0.85) 100%)',
      sidebar: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.92) 100%)',
      primary: 'linear-gradient(135deg, #4F46E5 0%, #0891B2 100%)',
      text: 'linear-gradient(135deg, #4F46E5 0%, #0891B2 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': {
          background: 'rgba(79,70,229,0.2)',
        },
        body: {
          backgroundImage:
            'radial-gradient(1200px 800px at 10% 0%, rgba(226,232,240,0.8) 0%, rgba(226,232,240,0) 60%),\
             radial-gradient(1000px 700px at 90% 10%, rgba(241,245,249,0.8) 0%, rgba(241,245,249,0) 60%),\
             linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(79,70,229,0.8) 0%, rgba(8,145,178,0.8) 100%)',
          color: '#fff',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          backdropFilter: 'saturate(180%) blur(12px)',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(2, 6, 23, 0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.92) 100%)',
          backdropFilter: 'saturate(180%) blur(14px)',
          boxShadow: '2px 0 24px rgba(16, 24, 40, 0.12)'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 18px',
          transition: 'transform .15s ease, box-shadow .2s ease',
          '&:active': { transform: 'translateY(1px)' },
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #0891B2 100%)',
          boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
          '&:hover': {
            boxShadow: '0 12px 28px rgba(79, 70, 229, 0.4)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(2, 6, 23, 0.08)',
          boxShadow: '0 12px 30px rgba(16, 24, 40, 0.1)',
          transition: 'transform .2s ease, box-shadow .2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 36px rgba(16, 24, 40, 0.15)'
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: 'rgba(79,70,229,0.12)'
          },
        },
      },
    },
  },
});

// Thème sombre assorti
export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    primary: { 
      main: '#818CF8', // Bleu plus doux
      light: '#A5B4FC', 
      dark: '#6366F1', 
      contrastText: '#ffffff' 
    },
    secondary: { 
      main: '#22D3EE', // Cyan plus doux
      light: '#67E8F9', 
      dark: '#0891B2', 
      contrastText: '#000000' 
    },
    background: { 
      default: '#0F172A', // Plus sombre
      paper: '#1E293B' // Plus contrasté
    },
    text: { 
      primary: '#FFFFFF', // Blanc pur pour un contraste maximum
      secondary: '#E2E8F0', // Gris clair pour le texte secondaire
      disabled: '#94A3B8', // Gris moyen pour le texte désactivé
    },
    gradients: {
      header: 'linear-gradient(135deg, rgba(129,140,248,0.3) 0%, rgba(34,211,238,0.3) 100%)',
      sidebar: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.95) 100%)',
      primary: 'linear-gradient(135deg, #818CF8 0%, #22D3EE 100%)',
      text: 'linear-gradient(135deg, #A5B4FC 0%, #67E8F9 100%)',
    },
  },
  components: {
    ...theme.components,
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': { background: 'rgba(129,140,248,0.3)' },
        body: {
          backgroundImage:
            'radial-gradient(1200px 800px at 10% -10%, rgba(129,140,248,0.15) 0%, rgba(129,140,248,0) 60%),\
             radial-gradient(1000px 700px at 90% -10%, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0) 60%),\
             linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          color: '#FFFFFF', // Couleur de texte par défaut pour le body
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(129,140,248,0.25) 0%, rgba(34,211,238,0.25) 100%)',
          color: '#FFFFFF', // Texte blanc pour la barre de navigation
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'saturate(180%) blur(12px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.9) 100%)',
          backdropFilter: 'saturate(180%) blur(14px)',
          boxShadow: '2px 0 24px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF', // Texte blanc pour le drawer
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
          color: '#FFFFFF', // Texte blanc pour les cartes
          '&:hover': { boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)' },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit', // Hérite de la couleur du parent
        },
        h1: { color: '#FFFFFF' },
        h2: { color: '#FFFFFF' },
        h3: { color: '#FFFFFF' },
        h4: { color: '#FFFFFF' },
        h5: { color: '#FFFFFF' },
        h6: { color: '#FFFFFF' },
        body1: { color: '#E2E8F0' },
        body2: { color: '#E2E8F0' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#FFFFFF', // Texte blanc pour les boutons
        },
        text: {
          color: '#FFFFFF',
        },
        outlined: {
          color: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.5)',
            backgroundColor: 'rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)',
        },
      },
    },
  },
});