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
        // 모바일 환경 감지
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
                    // 스캐너가 실행 중인지 확인 후 정리
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

    // scanning 상태가 true로 변경되면 스캐너 초기화
    useEffect(() => {
        if (scanning) {
            // DOM 업데이트 후 스캐너 초기화
            const timer = setTimeout(() => {
                initializeScanner();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [scanning]);

    const checkCameraPermission = async () => {
        try {
            // 브라우저 호환성 체크
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('이 브라우저는 카메라 접근을 지원하지 않습니다. HTTPS 환경에서 접속해주세요.');
            }

            // 카메라 권한 요청
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // 권한이 있으면 스트림을 즉시 중지
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('카메라 권한 오류:', error);
            if (error.name === 'NotAllowedError') {
                setError('카메라 권한이 필요합니다. 설정에서 카메라 권한을 허용해주세요.');
            } else if (error.name === 'NotFoundError') {
                setError('카메라를 찾을 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.');
            } else if (error.name === 'NotSupportedError') {
                setError('카메라 기능을 지원하지 않는 환경입니다.');
            } else {
                setError('카메라에 접근할 수 없습니다: ' + error.message);
            }
            return false;
        }
    };

    const startScanning = async () => {
        setError('');
        setScanResult(null);

        // 카메라 권한 확인
        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
            return;
        }

        // scanning을 true로 설정하면 useEffect에서 스캐너 초기화
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

            // 모바일 환경에서는 후면 카메라 우선 사용
            if (isMobile) {
                try {
                    // 사용 가능한 카메라 목록 가져오기
                    const cameras = await Html5Qrcode.getCameras();
                    console.log('사용 가능한 카메라:', cameras);

                    let cameraId = null;

                    // 후면 카메라 찾기 - 더 정확한 감지
                    let backCamera = null;

                    // 1차: 명확한 후면 카메라 키워드로 찾기
                    backCamera = cameras.find(camera => {
                        const label = camera.label ? camera.label.toLowerCase() : '';
                        return (
                            label.includes('back') ||
                            label.includes('rear') ||
                            label.includes('environment') ||
                            label.includes('후면')
                        );
                    });

                    // 2차: iOS에서 일반적인 패턴으로 찾기
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

                    // 3차: 카메라가 2개 이상이면 마지막 카메라 (보통 후면)
                    if (!backCamera && cameras.length > 1) {
                        backCamera = cameras[cameras.length - 1];
                    }

                    // 4차: 첫 번째 카메라라도 사용
                    if (!backCamera && cameras.length > 0) {
                        backCamera = cameras[0];
                    }

                    if (backCamera) {
                        cameraId = backCamera.id;
                        console.log('선택된 카메라:', backCamera.label || 'Unknown Camera');
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
                        throw new Error('사용 가능한 카메라가 없습니다');
                    }
                } catch (cameraError) {
                    console.error('카메라 초기화 오류:', cameraError);
                    // 카메라 선택에 실패하면 facingMode로 시도
                    await startWithEnvironmentCamera();
                }
            } else {
                // 데스크톱 환경에서는 기본 설정 사용
                await startWithEnvironmentCamera();
            }
        } catch (error) {
            console.error('스캐너 초기화 오류:', error);
            setError('QR 스캐너를 시작할 수 없습니다: ' + error.message);
            setScanning(false);
        }
    };

    const startWithEnvironmentCamera = async () => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        // 후면 카메라 강제 사용
        const cameraConfig = {
            facingMode: { exact: "environment" } // exact를 사용하여 후면 카메라 강제
        };

        try {
            await html5QrcodeRef.current.start(
                cameraConfig,
                config,
                onScanSuccess,
                onScanFailure
            );
        } catch (error) {
            console.log('exact environment 실패, ideal로 재시도:', error);
            // exact가 실패하면 ideal로 재시도
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
                // 스캐너가 실행 중인지 확인
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
                message: '체크인 처리에 실패했습니다. 다시 시도해주세요.'
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
                    QR 코드 스캐너
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={2}>
                    프로그램 위치의 QR 코드를 스캔하여 자동으로 체크인하세요.
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
                            {scanResult?.success ? '체크인 성공!' : '체크인 실패'}
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
