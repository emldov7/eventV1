import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  locale: localStorage.getItem('locale') || 'fr-FR',
  sidebarOpen: false,
  notifications: [],
  loading: false,
  modal: {
    open: false,
    type: null,
    data: null,
  },
  snackbar: {
    open: false,
    message: '',
    severity: 'info', // 'error', 'warning', 'info', 'success'
    persist: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setLocale: (state, action) => {
      state.locale = action.payload || 'fr-FR';
      try { localStorage.setItem('locale', state.locale); } catch(_) {}
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    openModal: (state, action) => {
      state.modal = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = {
        open: false,
        type: null,
        data: null,
      };
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
        persist: !!action.payload.persist,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  setLocale,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  openModal,
  closeModal,
  showSnackbar,
  hideSnackbar,
} = uiSlice.actions;

export default uiSlice.reducer; 