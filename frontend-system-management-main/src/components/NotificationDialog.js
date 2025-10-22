import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Composants stylisés avec MUI v5
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    minWidth: 400,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.primary.main,
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2, 0),
}));

const StyledMessage = styled(Typography)(({ theme }) => ({
  lineHeight: 1.6,
  whiteSpace: 'pre-line',
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
}));

const NotificationDialog = ({ open, onClose, title, message, type = 'success', actionText = 'OK' }) => {
  const getIcon = () => {
    if (type === 'success') {
      return <span style={{ fontSize: 28, marginRight: 8 }}>🎉</span>;
    } else if (type === 'warning') {
      return <span style={{ fontSize: 28, marginRight: 8 }}>⏳</span>;
    }
    return <span style={{ fontSize: 28, marginRight: 8 }}>ℹ️</span>;
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        {getIcon()}
        {title}
      </StyledDialogTitle>
      <StyledDialogContent>
        <StyledMessage variant="body1">
          {message}
        </StyledMessage>
      </StyledDialogContent>
      <StyledDialogActions>
        <Button onClick={onClose} variant="contained" color="primary" fullWidth>
          {actionText}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default NotificationDialog;
