import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  TextField
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Description as DraftIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

const ReminderDetailsDialog = ({ 
  open, 
  onClose, 
  reminder, 
  onSendNow, 
  onSchedule, 
  onDelete,
  actionLoading 
}) => {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);

  if (!reminder) return null;

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleString('fr-FR');
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

  // Calculer le pourcentage de succès
  const getSuccessRate = () => {
    const total = reminder.emails_sent + reminder.sms_sent + reminder.emails_failed + reminder.sms_failed;
    if (total === 0) return 0;
    const success = reminder.emails_sent + reminder.sms_sent;
    return Math.round((success / total) * 100);
  };

  // Gérer l'envoi immédiat
  const handleSendNow = () => {
    onSendNow(reminder.id);
  };

  // Gérer la programmation
  const handleSchedule = () => {
    if (scheduledAt) {
      onSchedule(reminder.id, scheduledAt.toISOString());
      setScheduleDialogOpen(false);
      setScheduledAt(null);
    }
  };

  // Gérer la suppression
  const handleDelete = () => {
    onDelete(reminder.id);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" component="h2">
                {reminder.title}
              </Typography>
              <Chip
                icon={getStatusIcon(reminder.status)}
                label={getStatusText(reminder.status)}
                color={getStatusColor(reminder.status)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            <Box>
              {reminder.status === 'draft' && (
                <Tooltip title="Envoyer maintenant">
                  <IconButton
                    color="primary"
                    onClick={handleSendNow}
                    disabled={actionLoading === reminder.id}
                  >
                    {actionLoading === reminder.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Programmer">
                <IconButton
                  color="info"
                  onClick={() => setScheduleDialogOpen(true)}
                  disabled={actionLoading === reminder.id}
                >
                  <ScheduleIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Modifier">
                <IconButton color="warning">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Supprimer">
                <IconButton
                  color="error"
                  onClick={handleDelete}
                  disabled={actionLoading === reminder.id}
                >
                  {actionLoading === reminder.id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Informations générales */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informations Générales
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTimeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Type de rappel"
                        secondary={reminder.reminder_type_display}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Audience cible"
                        secondary={reminder.target_audience_display}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Nombre de destinataires"
                        secondary={reminder.recipients_count}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email activé"
                        secondary={reminder.send_email ? 'Oui' : 'Non'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <SmsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="SMS activé"
                        secondary={reminder.send_sms ? 'Oui' : 'Non'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Dates et statut */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dates et Statut
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Créé le"
                        secondary={formatDate(reminder.created_at)}
                      />
                    </ListItem>
                    
                    {reminder.sent_at && (
                      <ListItem>
                        <ListItemText
                          primary="Envoyé le"
                          secondary={formatDate(reminder.sent_at)}
                        />
                      </ListItem>
                    )}
                    
                    {reminder.scheduled_at && (
                      <ListItem>
                        <ListItemText
                          primary="Programmé pour"
                          secondary={formatDate(reminder.scheduled_at)}
                        />
                      </ListItem>
                    )}
                    
                    <ListItem>
                      <ListItemText
                        primary="Dernière modification"
                        secondary={formatDate(reminder.updated_at)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Message */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Message
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {reminder.message}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Statistiques d'envoi */}
            {(reminder.emails_sent > 0 || reminder.sms_sent > 0 || reminder.emails_failed > 0 || reminder.sms_failed > 0) && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistiques d'Envoi
                    </Typography>
                    
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">
                          Taux de succès
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {getSuccessRate()}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getSuccessRate()} 
                        color={getSuccessRate() > 80 ? 'success' : getSuccessRate() > 50 ? 'warning' : 'error'}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={1}>
                          <Typography variant="h4" color="success.contrastText">
                            {reminder.emails_sent + reminder.sms_sent}
                          </Typography>
                          <Typography variant="body2" color="success.contrastText">
                            Messages envoyés
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="error.light" borderRadius={1}>
                          <Typography variant="h4" color="error.contrastText">
                            {reminder.emails_failed + reminder.sms_failed}
                          </Typography>
                          <Typography variant="body2" color="error.contrastText">
                            Messages échoués
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon color="primary" />
                          <Typography variant="body2">
                            Emails: {reminder.emails_sent} envoyés, {reminder.emails_failed} échoués
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <SmsIcon color="secondary" />
                          <Typography variant="body2">
                            SMS: {reminder.sms_sent} envoyés, {reminder.sms_failed} échoués
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Destinataires personnalisés */}
            {reminder.target_audience === 'custom' && reminder.custom_recipients && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Destinataires Sélectionnés
                    </Typography>
                    <List dense>
                      {reminder.custom_recipients.map((recipient) => (
                        <ListItem key={recipient.id}>
                          <ListItemText
                            primary={recipient.guest_name}
                            secondary={`${recipient.guest_email} - ${recipient.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </DialogActions>

        {/* Dialog de programmation */}
        <Dialog 
          open={scheduleDialogOpen} 
          onClose={() => setScheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Programmer l'envoi du rappel
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="Date et heure d'envoi"
                value={scheduledAt}
                onChange={setScheduledAt}
                minDateTime={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSchedule}
              variant="contained"
              disabled={!scheduledAt}
            >
              Programmer
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReminderDetailsDialog;
