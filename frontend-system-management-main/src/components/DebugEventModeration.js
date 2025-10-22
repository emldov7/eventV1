import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Event as EventIcon
} from '@mui/icons-material';

const DebugEventModeration = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Événement de test
  const testEvent = {
    id: 1,
    title: "Événement de Test",
    organizer: "Test Organizer",
    start_date: "2024-01-01T10:00:00Z",
    price: 25.00,
    created_at: "2024-01-01T09:00:00Z"
  };

  const handleViewDetails = (event) => {
    console.log('🔍 handleViewDetails appelé avec:', event);
    console.log('🔍 Type de event:', typeof event);
    console.log('🔍 Event ID:', event?.id);
    console.log('🔍 Event title:', event?.title);
    
    if (!event || !event.id) {
      console.error('❌ Événement invalide:', event);
      return;
    }
    
    setSelectedEvent(event);
    setModalOpen(true);
    console.log('🔍 Modal ouvert:', true);
    console.log('🔍 Événement sélectionné:', event);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    console.log('🔍 Modal fermé');
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <EventIcon />
              Debug - Test Bouton Œil
            </Box>
          }
          subheader="Composant de test pour vérifier le fonctionnement du bouton œil"
        />
        <CardContent>
          <Typography variant="body1" gutterBottom>
            Ce composant teste le bouton œil avec un événement de test.
          </Typography>
          
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>
              {testEvent.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Organisateur: {testEvent.organizer}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Date: {new Date(testEvent.start_date).toLocaleDateString('fr-FR')}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Prix: ${testEvent.price}
            </Typography>
            
            <Box mt={2} display="flex" gap={1}>
              <Tooltip title="Voir les détails (Test)">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => {
                    console.log('🔍 Clic sur le bouton œil pour l\'événement:', testEvent);
                    handleViewDetails(testEvent);
                  }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  console.log('🔍 Test direct de handleViewDetails');
                  handleViewDetails(testEvent);
                }}
              >
                Test Direct
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Modal de test */}
      {modalOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={handleCloseModal}
        >
          <Card
            sx={{ maxWidth: 500, m: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader
              title="Modal de Test - Détails de l'Événement"
              subheader="Si vous voyez ceci, le bouton œil fonctionne !"
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedEvent?.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                ID: {selectedEvent?.id}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Organisateur: {selectedEvent?.organizer}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Prix: ${selectedEvent?.price}
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseModal} variant="contained">
                Fermer
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default DebugEventModeration;
