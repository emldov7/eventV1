import React, { useEffect, useRef, useState } from 'react';
import { Container, Typography, Box, Button, Alert, Card, CardContent } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

const QRCodeScannerPage = () => {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      const current = scannerRef.current;
      scannerRef.current = null;
      const wasStarted = startedRef.current;
      startedRef.current = false;
      if (current && wasStarted) {
        current
          .stop()
          .catch(() => {})
          .finally(() => {
            try { current.clear(); } catch (_) {}
          });
      }
    };
  }, []);

  const startScan = async () => {
    setError('');
    setResult(null);
    try {
      // S'assurer que le conteneur est propre
      const container = document.getElementById('qr-reader');
      if (container) container.innerHTML = '';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Caméra non disponible sur cet appareil.');
        return;
      }
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      setScanning(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // Expected format: EMSv1|eventId|registrationId|userId|token
          const parts = decodedText.split('|');
          const token = parts.length >= 5 ? parts[4] : decodedText;
          try {
            const res = await api.post('/registrations/verify_qr/', { token, mark_attended: true });
            setResult(res.data);
          } catch (e) {
            setError(e.response?.data?.error || 'Vérification échouée');
          } finally {
            if (startedRef.current) {
              try { await html5QrCode.stop(); } catch (_) {}
              try { await html5QrCode.clear(); } catch (_) {}
              startedRef.current = false;
            }
            setScanning(false);
          }
        },
        (err) => {
          // ignore scan failure frame
        }
      );
      startedRef.current = true;
    } catch (e) {
      setError('Impossible de démarrer la caméra');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    const current = scannerRef.current;
    const wasStarted = startedRef.current;
    scannerRef.current = null;
    startedRef.current = false;
    if (current && wasStarted) {
      try { await current.stop(); } catch (_) {}
      try { await current.clear(); } catch (_) {}
    }
    setScanning(false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Scanner les billets (QR)</Typography>
      <Box id="qr-reader" sx={{ width: '100%', minHeight: 260, border: '1px dashed #ccc', borderRadius: 1, mb: 1 }} />
      {!scanning && !result && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Appuyez sur "Démarrer" pour activer la caméra</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={startScan} disabled={scanning}>Démarrer</Button>
        <Button variant="outlined" onClick={stopScan} disabled={!scanning}>Arrêter</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Résultat</Typography>
            <Typography variant="body2">Valide: {String(result.valid)}</Typography>
            {result.user && <Typography variant="body2">Utilisateur: {result.user.username} ({result.user.email})</Typography>}
            {result.event && <Typography variant="body2">Événement: {result.event.title} (ID {result.event.id})</Typography>}
            <Typography variant="body2">Statut: {result.status}</Typography>
            {result.session_type && <Typography variant="body2">Session: {result.session_type}</Typography>}
            {result.ticket_type && <Typography variant="body2">Type de billet: {result.ticket_type}</Typography>}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default QRCodeScannerPage;

