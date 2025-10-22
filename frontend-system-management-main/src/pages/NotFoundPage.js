import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page non trouvée
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Retour à l'accueil
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 