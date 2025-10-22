import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../store/slices/uiSlice';
import { registerForEvent, cancelPayment } from '../store/slices/eventSlice';
import api from '../services/api';

const PaymentSection = ({ registrationData, setPaymentLoading, onPaid, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const [paymentError, setPaymentError] = useState('');

  const handlePay = async () => {
    setPaymentError('');
    if (!stripe || !elements) {
      setPaymentError("Stripe n'est pas prêt");
      return;
    }
    
    // Validation de la carte avant tout
    const card = elements.getElement(CardElement);
    if (!card) {
      setPaymentError("Veuillez saisir les informations de carte");
      return;
    }
    
    try {
      setPaymentLoading(true);
      
      // 1. Créer un PaymentIntent temporaire pour valider la carte
      // 🔥 CORRECTION: Utiliser le prix du billet sélectionné, pas le prix par défaut
      let amount = registrationData.event.price || 0;
      
      if (registrationData.ticket_type_id) {
        // Trouver le billet sélectionné pour obtenir son prix
        const selectedTicket = registrationData.event.ticket_types?.find(t => t.id === registrationData.ticket_type_id);
        if (selectedTicket) {
          amount = selectedTicket.effective_price || selectedTicket.price || 0;
          console.log('DEBUG: Prix du billet sélectionné:', amount, 'Billet:', selectedTicket.name);
        }
      }
      
      console.log('DEBUG: Montant final envoyé:', amount, 'Type:', typeof amount);
      
      const tempIntent = await api.post(`/events/${registrationData.event.id}/create_temp_payment_intent/`, {
        amount: amount,
        currency: 'eur'
      }).then(r => r.data);
      
      // 2. Valider la carte avec Stripe
      let paymentResult;
      if (tempIntent.mode === 'test') {
        // Mode test - validation simple
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card,
        });
        
        if (error) {
          setPaymentError(error.message || 'Carte invalide - Veuillez vérifier vos informations');
          setPaymentLoading(false);
          return;
        }
        
        // Carte valide en mode test
        paymentResult = { error: null, paymentIntent: { id: tempIntent.payment_intent_id, status: 'succeeded' } };
      } else {
        // Mode production - validation complète
        paymentResult = await stripe.confirmCardPayment(tempIntent.client_secret, { 
          payment_method: { card } 
        });
        
        if (paymentResult.error) {
          setPaymentError(paymentResult.error.message || 'Carte invalide - Veuillez vérifier vos informations');
          setPaymentLoading(false);
          return;
        }
      }
      
      // 2. CARTE VALIDÉE - Créer l'inscription maintenant
      const payload = { 
        event: registrationData.event.id, // Envoyer l'ID au lieu de l'objet complet
      };
      if (registrationData.ticket_type_id) {
        payload.ticket_type_id = registrationData.ticket_type_id;
      }
      if (registrationData.session_type_id) {
        payload.session_type_id = registrationData.session_type_id;
      }
      
      // 🎯 NOUVELLE LOGIQUE : Ajouter les données d'invité si présentes
      if (registrationData.guest_full_name && registrationData.guest_email && registrationData.guest_phone) {
        payload.guest_full_name = registrationData.guest_full_name;
        payload.guest_email = registrationData.guest_email;
        payload.guest_phone = registrationData.guest_phone;
        payload.guest_country = registrationData.guest_country;
      }
      const registration = await dispatch(registerForEvent(payload)).unwrap();

      // 3. Confirmer le paiement côté serveur
      let finalRegistration = registration;
      try {
        const confirmResponse = await api.post(`/registrations/${registration.id}/confirm_payment/`, { 
          payment_intent_id: paymentResult.paymentIntent?.id || tempIntent.payment_intent_id,
          mode: tempIntent.mode
        });
        finalRegistration = confirmResponse.data;
      } catch (e) {
        console.error('Erreur de confirmation serveur:', e);
        // En cas d'erreur serveur, annuler l'inscription
        try {
          await dispatch(cancelPayment(registration.id));
        } catch (cancelError) {
          console.error('Erreur lors de l\'annulation après erreur serveur:', cancelError);
        }
        setPaymentError('Erreur de confirmation du paiement');
        setPaymentLoading(false);
        return;
      }
      
      setPaymentLoading(false);
      
      // 5. Afficher le message approprié
      if (finalRegistration.status === 'waitlisted') {
        dispatch(showSnackbar({ 
          message: "Paiement confirmé. Votre inscription est en attente de validation par l'organisateur.", 
          severity: 'warning', 
          persist: true 
        }));
      } else if (finalRegistration.status === 'confirmed') {
        dispatch(showSnackbar({ 
          message: "🎉 Paiement confirmé ! Votre billet (QR) a été envoyé à votre email.", 
          severity: 'success', 
          persist: true 
        }));
      } else {
        dispatch(showSnackbar({ 
          message: "Paiement confirmé. Votre inscription est en cours de traitement.", 
          severity: 'info', 
          persist: true 
        }));
      }
      
      onPaid?.();
    } catch (e) {
      setPaymentLoading(false);
      setPaymentError('Erreur lors de l\'inscription ou du paiement');
      console.error('Erreur complète:', e);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Informations de paiement</Typography>
      
      {paymentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {paymentError}
        </Alert>
      )}
      
      <Box sx={{ p: 1.5, border: '1px solid #ddd', borderRadius: 1 }}>
        <CardElement options={{ hidePostalCode: true }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" color="error" onClick={onCancel}>
          Annuler l'inscription
        </Button>
        <Button variant="contained" onClick={handlePay}>Payer</Button>
      </Box>
    </Box>
  );
};

export default PaymentSection;
