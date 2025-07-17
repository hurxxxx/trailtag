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

    const initializeScanner = () => {
        try {
            // qr-reader 엘리먼트가 존재하는지 확인
            const qrReaderElement = document.getElementById('qr-reader');
            if (!qrReaderElement) {
                console.error('qr-reader 엘리먼트를 찾을 수 없습니다');
                setError('QR 스캐너 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
                setScanning(false);
                return;
            }

            // Initialize scanner with minimal config
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
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
        } catch (error) {
            console.error('스캐너 초기화 오류:', error);
            setError('QR 스캐너를 시작할 수 없습니다: ' + error.message);
            setScanning(false);
        }
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
                            스캔 시작
                        </Button>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            QR 코드를 카메라 프레임 안에 위치시켜 스캔하세요
                        </Typography>

                        {/* 모바일 카메라 사용 안내 */}
                        <Card sx={{ mt: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="body2" color="info.main" sx={{ fontWeight: 500, mb: 1 }}>
                                    📱 카메라 사용 안내
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    • 카메라 권한 요청 시 "허용"을 선택해주세요<br />
                                    • 다른 앱에서 카메라 사용 중이면 종료 후 시도하세요<br />
                                    • QR 코드를 화면 중앙에 맞춰주세요
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {loading && (
                    <Box textAlign="center" py={4}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" mt={2}>
                            체크인 처리 중...
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
                                스캔 중지
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
                                QR 코드를 화면 중앙의 사각형 안에 맞춰주세요
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
