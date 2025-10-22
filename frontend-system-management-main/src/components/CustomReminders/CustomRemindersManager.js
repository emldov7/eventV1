import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Drafts as DraftIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CreateReminderDialog from './CreateReminderDialog';
import ReminderDetailsDialog from './ReminderDetailsDialog';

const CustomRemindersManager = ({ eventId, eventTitle }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Charger les rappels
  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/custom-reminders/?event=${eventId}`);
      setReminders(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des rappels:', err);
      setError('Erreur lors du chargement des rappels');
      toast.error('Erreur lors du chargement des rappels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadReminders();
    }
  }, [eventId]);

  // Envoyer un rappel immédiatement
  const handleSendNow = async (reminderId) => {
    try {
      setActionLoading(reminderId);
      await api.post(`/custom-reminders/${reminderId}/send_now/`);
      toast.success('Rappel envoyé avec succès!');
      loadReminders(); // Recharger la liste
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      toast.error('Erreur lors de l\'envoi du rappel');
    } finally {
      setActionLoading(null);
    }
  };

  // Programmer un rappel
  const handleSchedule = async (reminderId, scheduledAt) => {
    try {
      setActionLoading(reminderId);
      await api.post(`/custom-reminders/${reminderId}/schedule/`, {
        scheduled_at: scheduledAt
      });
      toast.success('Rappel programmé avec succès!');
      loadReminders(); // Recharger la liste
    } catch (err) {
      console.error('Erreur lors de la programmation:', err);
      toast.error('Erreur lors de la programmation du rappel');
    } finally {
      setActionLoading(null);
    }
  };

  // Supprimer un rappel
  const handleDelete = async (reminderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rappel?')) {
      return;
    }

    try {
      setActionLoading(reminderId);
      await api.delete(`/custom-reminders/${reminderId}/`);
      toast.success('Rappel supprimé avec succès!');
      loadReminders(); // Recharger la liste
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du rappel');
    } finally {
      setActionLoading(null);
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'info';
      case 'failed': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircleIcon />;
      case 'scheduled': return <ScheduleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'draft': return <DraftIcon />;
      default: return <DraftIcon />;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'sent': return 'Envoyé';
      case 'scheduled': return 'Programmé';
      case 'failed': return 'Échec';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              📧 Rappels Personnalisés
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérez les rappels et messages pour l'événement: <strong>{eventTitle}</strong>
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ minWidth: 200 }}
          >
            Créer un Rappel
          </Button>
        </Box>
      </Paper>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Liste des rappels */}
      {reminders.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun rappel créé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Créez votre premier rappel pour communiquer avec vos participants
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Créer le Premier Rappel
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reminders.map((reminder) => (
            <Grid item xs={12} md={6} lg={4} key={reminder.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* En-tête du rappel */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" noWrap>
                      {reminder.title}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(reminder.status)}
                      label={getStatusText(reminder.status)}
                      color={getStatusColor(reminder.status)}
                      size="small"
                    />
                  </Box>

                  {/* Type de rappel */}
                  <Chip
                    label={reminder.reminder_type_display}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {/* Audience cible */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {reminder.target_audience_display}
                    </Typography>
                    <Badge badgeContent={reminder.recipients_count} color="primary" sx={{ ml: 1 }}>
                      <PeopleIcon fontSize="small" />
                    </Badge>
                  </Box>

                  {/* Canaux d'envoi */}
                  <Box display="flex" gap={1} mb={2}>
                    {reminder.send_email && (
                      <Tooltip title="Email activé">
                        <EmailIcon color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                    {reminder.send_sms && (
                      <Tooltip title="SMS activé">
                        <SmsIcon color="secondary" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>

                  {/* Message (tronqué) */}
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {reminder.message}
                  </Typography>

                  {/* Dates */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Créé: {formatDate(reminder.created_at)}
                    </Typography>
                    {reminder.sent_at && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Envoyé: {formatDate(reminder.sent_at)}
                      </Typography>
                    )}
                    {reminder.scheduled_at && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Programmé: {formatDate(reminder.scheduled_at)}
                      </Typography>
                    )}
                  </Box>

                  {/* Statistiques */}
                  {(reminder.emails_sent > 0 || reminder.sms_sent > 0) && (
                    <Box mt={2}>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        📧 {reminder.emails_sent} emails • 📱 {reminder.sms_sent} SMS
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedReminder(reminder);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    Voir Détails
                  </Button>
                  
                  <Box>
                    {reminder.status === 'draft' && (
                      <Tooltip title="Envoyer maintenant">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSendNow(reminder.id)}
                          disabled={actionLoading === reminder.id}
                        >
                          {actionLoading === reminder.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => {
                          setSelectedReminder(reminder);
                          setCreateDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(reminder.id)}
                        disabled={actionLoading === reminder.id}
                      >
                        {actionLoading === reminder.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de création/modification */}
      <CreateReminderDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedReminder(null);
        }}
        eventId={eventId}
        eventTitle={eventTitle}
        reminder={selectedReminder}
        onSuccess={() => {
          loadReminders();
          setCreateDialogOpen(false);
          setSelectedReminder(null);
        }}
      />

      {/* Dialog de détails */}
      <ReminderDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedReminder(null);
        }}
        reminder={selectedReminder}
        onSendNow={handleSendNow}
        onSchedule={handleSchedule}
        onDelete={handleDelete}
        actionLoading={actionLoading}
      />
    </Box>
  );
};

export default CustomRemindersManager;
