import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Chip,
    IconButton
} from '@mui/material';
import {
    CameraAlt,
    Stop,
    CheckCircle,
    Error,
    Refresh,
    Close
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import checkInService from '../../services/checkInService';
import { useAuth } from '../../contexts/AuthContext';

const QRScanner = () => {
    const { user } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const scannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const startScanning = () => {
        setError('');
        setScanResult(null);
        setScanning(true);

        // Initialize scanner
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA]
        };

        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            config,
            false
        );

        html5QrcodeScannerRef.current.render(
            onScanSuccess,
            onScanFailure
        );
    };

    const stopScanning = () => {
        if (html5QrcodeScannerRef.current) {
            html5QrcodeScannerRef.current.clear().then(() => {
                setScanning(false);
            }).catch(err => {
                console.error("Failed to clear scanner", err);
                setScanning(false);
            });
        } else {
            setScanning(false);
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        setLoading(true);
        
        try {
            // Stop scanning immediately
            if (html5QrcodeScannerRef.current) {
                await html5QrcodeScannerRef.current.clear();
            }
            setScanning(false);

            // Process check-in
            const result = await checkInService.processCheckIn(decodedText, user.id);
            
            if (result.success) {
                setScanResult({
                    success: true,
                    message: result.message,
                    checkIn: result.checkIn
                });
            } else {
                setScanResult({
                    success: false,
                    message: result.message
                });
            }
            
            setShowResult(true);
        } catch (error) {
            setScanResult({
                success: false,
                message: 'Failed to process check-in. Please try again.'
            });
            setShowResult(true);
        } finally {
            setLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Handle scan failure silently - this is called frequently during scanning
        // Only log actual errors, not "No QR code found" messages
        if (!error.includes('No QR code found')) {
            console.warn('QR scan error:', error);
        }
    };

    const handleCloseResult = () => {
        setShowResult(false);
        setScanResult(null);
        setError('');
    };

    const handleScanAgain = () => {
        handleCloseResult();
        startScanning();
    };

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    QR Code Scanner
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={2}>
                    Scan QR codes at program locations to check in automatically.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!scanning && !loading && (
                    <Box textAlign="center">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<CameraAlt />}
                            onClick={startScanning}
                            sx={{ mb: 2 }}
                        >
                            Start Scanning
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            Position the QR code within the camera frame to scan
                        </Typography>
                    </Box>
                )}

                {loading && (
                    <Box textAlign="center" py={4}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" mt={2}>
                            Processing check-in...
                        </Typography>
                    </Box>
                )}

                {scanning && (
                    <Box>
                        <Box textAlign="center" mb={2}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Stop />}
                                onClick={stopScanning}
                            >
                                Stop Scanning
                            </Button>
                        </Box>
                        
                        <Paper 
                            elevation={1} 
                            sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: 'grey.50'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Point your camera at a QR code
                            </Typography>
                            <div id="qr-reader" ref={scannerRef}></div>
                        </Paper>
                    </Box>
                )}
            </Paper>

            {/* Scan Result Dialog */}
            <Dialog
                open={showResult}
                onClose={handleCloseResult}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">
                            {scanResult?.success ? 'Check-in Successful!' : 'Check-in Failed'}
                        </Typography>
                        <IconButton onClick={handleCloseResult}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ textAlign: 'center', py: 3 }}>
                    {scanResult?.success ? (
                        <Box>
                            <CheckCircle 
                                sx={{ 
                                    fontSize: 80, 
                                    color: 'success.main', 
                                    mb: 2 
                                }} 
                            />
                            
                            <Typography variant="h6" gutterBottom>
                                {scanResult.message}
                            </Typography>

                            {scanResult.checkIn && (
                                <Card elevation={1} sx={{ mt: 2, textAlign: 'left' }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Check-in Details:
                                        </Typography>
                                        
                                        <Box mb={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                Program:
                                            </Typography>
                                            <Typography variant="body1">
                                                {scanResult.checkIn.program_name}
                                            </Typography>
                                        </Box>

                                        <Box mb={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                Location:
                                            </Typography>
                                            <Typography variant="body1">
                                                {scanResult.checkIn.location}
                                            </Typography>
                                        </Box>

                                        <Box mb={1}>
                                            <Typography variant="body2" color="text.secondary">
                                                Time:
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(scanResult.checkIn.check_in_time).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Chip 
                                            label="Checked In" 
                                            color="success" 
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            <Error 
                                sx={{ 
                                    fontSize: 80, 
                                    color: 'error.main', 
                                    mb: 2 
                                }} 
                            />
                            
                            <Typography variant="h6" gutterBottom>
                                {scanResult?.message || 'An error occurred'}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary">
                                Please try scanning again or contact support if the problem persists.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    {scanResult?.success ? (
                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                onClick={handleCloseResult}
                            >
                                Done
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Refresh />}
                                onClick={handleScanAgain}
                            >
                                Scan Another
                            </Button>
                        </Box>
                    ) : (
                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                onClick={handleCloseResult}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Refresh />}
                                onClick={handleScanAgain}
                            >
                                Try Again
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QRScanner;
