import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';

const OfflineError = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            sx={{ backgroundColor: '#f5f5f5' }}
        >
            <WifiOffIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ color: '#333' }}>
                No Internet Connection
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Please check your internet connection and try again.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
            >
                Retry Connection
            </Button>
        </Box>
    );
};

export default OfflineError;