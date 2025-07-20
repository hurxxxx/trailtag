import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Html5Qrcode } from 'html5-qrcode';
import checkInService from '../../services/checkInService';
import { useAuth } from '../../contexts/AuthContext';

const QRScanner = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        // Detect mobile environment
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            setIsMobile(isMobileDevice);
        };

        checkMobile();

        return () => {
            // Cleanup scanner on unmount
            if (html5QrcodeRef.current) {
                try {
                    // Check if scanner is running before cleanup
                    if (html5QrcodeRef.current.getState() === 2) { // SCANNING state
                        html5QrcodeRef.current.stop().catch(err => {
                            console.log('Scanner stop error (cleanup):', err);
                        });
                    }
                } catch (error) {
                    console.log('Scanner cleanup error:', error);
                }
            }
        };
    }, []);

    // Initialize scanner when scanning state changes to true
    useEffect(() => {
        if (scanning) {
            // Initialize scanner after DOM update
            const timer = setTimeout(() => {
                initializeScanner();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [scanning]);

    const checkCameraPermission = async () => {
        try {
            // Check browser compatibility
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(t('This browser does not support camera access. Please access via HTTPS environment.'));
            }

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop stream immediately if permission is granted
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera permission error:', error);
            if (error.name === 'NotAllowedError') {
                setError(t('Camera permission is required. Please allow camera access in settings.'));
            } else if (error.name === 'NotFoundError') {
                setError(t('Camera not found. Please check if another app is using the camera.'));
            } else if (error.name === 'NotSupportedError') {
                setError(t('Camera functionality is not supported in this environment.'));
            } else {
                setError(t('Cannot access camera: {{message}}', { message: error.message }));
            }
            return false;
        }
    };

    const startScanning = async () => {
        setError('');
        setScanResult(null);

        // Check camera permission
        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
            return;
        }

        // Setting scanning to true will initialize scanner in useEffect
        setScanning(true);
    };

    const initializeScanner = async () => {
        try {
            // Check if qr-reader element exists
            const qrReaderElement = document.getElementById('qr-reader');
            if (!qrReaderElement) {
                console.error('qr-reader element not found');
                setError(t('QR scanner initialization failed. Please refresh the page.'));
                setScanning(false);
                return;
            }

            html5QrcodeRef.current = new Html5Qrcode("qr-reader");

            // Use rear camera preferentially in mobile environment
            if (isMobile) {
                try {
                    // Get list of available cameras
                    const cameras = await Html5Qrcode.getCameras();
                    console.log('Available cameras:', cameras);

                    let cameraId = null;

                    // Find rear camera - more accurate detection
                    let backCamera = null;

                    // 1st: Find with clear rear camera keywords
                    backCamera = cameras.find(camera => {
                        const label = camera.label ? camera.label.toLowerCase() : '';
                        return (
                            label.includes('back') ||
                            label.includes('rear') ||
                            label.includes('environment') ||
                            label.includes('후면') // Korean device label for 'rear'
                        );
                    });

                    // 2nd: Find with common patterns on iOS
                    if (!backCamera) {
                        backCamera = cameras.find(camera => {
                            const label = camera.label ? camera.label.toLowerCase() : '';
                            return (
                                label.includes('camera') &&
                                !label.includes('front') &&
                                !label.includes('user') &&
                                !label.includes('face')
                            );
                        });
                    }

                    // 3rd: If there are 2+ cameras, use the last one (usually rear)
                    if (!backCamera && cameras.length > 1) {
                        backCamera = cameras[cameras.length - 1];
                    }

                    // 4th: Use first camera if available
                    if (!backCamera && cameras.length > 0) {
                        backCamera = cameras[0];
                    }

                    if (backCamera) {
                        cameraId = backCamera.id;
                        console.log('Selected camera:', backCamera.label || 'Unknown Camera');
                    }

                    if (cameraId) {
                        const config = {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        };

                        await html5QrcodeRef.current.start(
                            cameraId,
                            config,
                            onScanSuccess,
                            onScanFailure
                        );
                    } else {
                        throw new Error(t('No available cameras found'));
                    }
                } catch (cameraError) {
                    console.error('Camera initialization error:', cameraError);
                    // Try with facingMode if camera selection fails
                    await startWithEnvironmentCamera();
                }
            } else {
                // Use default settings for desktop environment
                await startWithEnvironmentCamera();
            }
        } catch (error) {
            console.error('Scanner initialization error:', error);
            setError(t('Cannot start QR scanner: {{message}}', { message: error.message }));
            setScanning(false);
        }
    };

    const startWithEnvironmentCamera = async () => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        // Force use of rear camera
        const cameraConfig = {
            facingMode: { exact: "environment" } // Use exact to force rear camera
        };

        try {
            await html5QrcodeRef.current.start(
                cameraConfig,
                config,
                onScanSuccess,
                onScanFailure
            );
        } catch (error) {
            console.log('exact environment failed, retrying with ideal:', error);
            // Retry with ideal if exact fails
            const fallbackConfig = {
                facingMode: { ideal: "environment" }
            };

            await html5QrcodeRef.current.start(
                fallbackConfig,
                config,
                onScanSuccess,
                onScanFailure
            );
        }
    };

    const stopScanning = () => {
        if (html5QrcodeRef.current) {
            try {
                // Check if scanner is running
                if (html5QrcodeRef.current.getState() === 2) { // SCANNING state
                    html5QrcodeRef.current.stop().then(() => {
                        setScanning(false);
                    }).catch(err => {
                        console.log("Scanner stop error:", err);
                        setScanning(false);
                    });
                } else {
                    setScanning(false);
                }
            } catch (error) {
                console.log("Scanner state check error:", error);
                setScanning(false);
            }
        } else {
            setScanning(false);
        }
    };

    const onScanSuccess = async (decodedText) => {
        setLoading(true);

        try {
            // Stop scanning immediately
            if (html5QrcodeRef.current) {
                try {
                    if (html5QrcodeRef.current.getState() === 2) { // SCANNING state
                        await html5QrcodeRef.current.stop();
                    }
                } catch (stopError) {
                    console.log('Scanner stop error in onScanSuccess:', stopError);
                }
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
                message: t('Check-in processing failed. Please try again.')
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
                    {t('QR Code Scanner')}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={2}>
                    {t('Scan the QR code at the program location to automatically check in.')}
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
                            {t('Start Scan')}
                        </Button>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('Position the QR code within the camera frame to scan')}
                        </Typography>

                        {/* Mobile camera usage guide */}
                        <Card sx={{ mt: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="body2" color="info.main" sx={{ fontWeight: 500, mb: 1 }}>
                                    {t('📱 Camera Usage Guide')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('• Select "Allow" when camera permission is requested')}<br />
                                    {t('• Close other apps using the camera before trying')}<br />
                                    {t('• Center the QR code on the screen')}<br />
                                    {t('• HTTPS connection is required on mobile devices')}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* HTTPS connection guide (shown only for HTTP) */}
                        {window.location.protocol === 'http:' && (
                            <Card sx={{ mt: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500, mb: 1 }}>
                                        {t('⚠️ HTTPS Connection Required')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('HTTPS connection is required to use camera in mobile browsers.')}<br />
                                        {t('Please change http to https in the address bar.')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}

                {loading && (
                    <Box textAlign="center" py={4}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" mt={2}>
                            {t('Processing check-in...')}
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
                                {t('Stop Scan')}
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
                                {t('Align the QR code within the rectangle in the center of the screen')}
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
                            {scanResult?.success ? t('Check-in Successful!') : t('Check-in Failed')}
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
