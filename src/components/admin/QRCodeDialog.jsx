import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Alert,
    CircularProgress,
    Avatar,
    IconButton,
    Divider,
    Paper
} from '@mui/material';
import {
    Close,
    QrCode,
    Download,
    LocationOn,
    Print
} from '@mui/icons-material';
import QRCodeLib from 'qrcode';
import qrCodeService from '../../services/qrCodeService';

const QRCodeDialog = ({ open, onClose, program, qrCode, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationName, setLocationName] = useState('');
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');
    const canvasRef = useRef(null);

    const isCreating = !qrCode; // QR 코드가 없으면 생성 모드

    // QR 코드 이미지 생성
    const generateQRCodeImage = async (qrCodeData) => {
        try {
            // 서버에서 생성한 실제 QR 코드 데이터 사용
            // 형식: trailtag://checkin?program=123&location=Main&t=1234567890
            const qrData = qrCodeData.qr_code_data;

            if (!qrData) {
                throw new Error('QR 코드 데이터가 없습니다');
            }

            console.log('QR 코드 데이터:', qrData);

            // QR 코드 이미지를 Data URL로 생성
            const dataURL = await QRCodeLib.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1976d2', // 파란색
                    light: '#ffffff' // 흰색
                }
            });

            setQrCodeDataURL(dataURL);
        } catch (error) {
            console.error('QR 코드 이미지 생성 실패:', error);
            setError('QR 코드 이미지 생성에 실패했습니다');
        }
    };

    // QR 코드가 있을 때 이미지 생성
    useEffect(() => {
        if (qrCode && open) {
            generateQRCodeImage(qrCode);
        } else {
            setQrCodeDataURL('');
        }
    }, [qrCode, open]);

    const handleSubmit = async () => {
        if (isCreating) {
            // QR 코드 생성
            if (!locationName.trim()) {
                setError('위치명을 입력해주세요');
                return;
            }

            try {
                setLoading(true);
                setError('');

                const result = await qrCodeService.createQRCode(
                    program.id,
                    locationName.trim(),
                    1 // userId - 실제 앱에서는 auth context에서 가져와야 함
                );

                if (result.success) {
                    onSuccess && onSuccess(result.qrCode);
                    onClose();
                } else {
                    setError(result.message || 'QR 코드 생성에 실패했습니다');
                }
            } catch (error) {
                setError('QR 코드 생성 중 오류가 발생했습니다');
            } finally {
                setLoading(false);
            }
        } else {
            // QR 코드 다운로드
            handleDownload();
        }
    };

    const handleDownload = () => {
        if (qrCodeDataURL) {
            const link = document.createElement('a');
            link.download = `QR_${program?.name}_${qrCode?.location_name}.png`;
            link.href = qrCodeDataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePrint = () => {
        if (qrCodeDataURL) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>QR 코드 - ${program?.name}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 20px;
                            }
                            .qr-container {
                                border: 2px solid #1976d2;
                                border-radius: 10px;
                                padding: 20px;
                                display: inline-block;
                                margin: 20px;
                            }
                            .qr-title {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 10px;
                                color: #1976d2;
                            }
                            .qr-subtitle {
                                font-size: 16px;
                                color: #666;
                                margin-bottom: 20px;
                            }
                            .qr-image {
                                margin: 20px 0;
                            }
                            .qr-instructions {
                                font-size: 14px;
                                color: #888;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            <div class="qr-title">${program?.name}</div>
                            <div class="qr-subtitle">${qrCode?.location_name}</div>
                            <div class="qr-image">
                                <img src="${qrCodeDataURL}" alt="QR Code" />
                            </div>
                            <div class="qr-instructions">
                                스마트폰으로 QR 코드를 스캔하여 체크인하세요
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleClose = () => {
        setLocationName('');
        setError('');
        setQrCodeDataURL('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <QrCode />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {isCreating ? 'QR 코드 생성' : 'QR 코드 정보'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {program?.name}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {isCreating ? (
                    // QR 코드 생성 폼
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            이 프로그램을 위한 QR 코드를 생성합니다. 학생들이 이 QR 코드를 스캔하여 프로그램에 체크인할 수 있습니다.
                        </Typography>

                        <TextField
                            fullWidth
                            label="QR 코드 위치명"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="예: 메인 강의실, 실습실 A 등"
                            disabled={loading}
                            helperText="QR 코드가 설치될 위치를 입력해주세요"
                            sx={{ mt: 2 }}
                        />
                    </Box>
                ) : (
                    // QR 코드 정보 표시
                    <Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                borderRadius: 3,
                                textAlign: 'center',
                                mb: 3,
                                bgcolor: 'background.paper'
                            }}
                        >
                            {qrCodeDataURL ? (
                                <Box>
                                    <img
                                        src={qrCodeDataURL}
                                        alt="QR Code"
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                                        {program?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        스마트폰으로 QR 코드를 스캔하여 체크인하세요
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        QR 코드를 생성하는 중...
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <LocationOn color="primary" fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                위치: {qrCode?.location_name}
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            생성일: {qrCode?.created_at && new Date(qrCode.created_at).toLocaleDateString('ko-KR')}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            체크인 URL: {`${window.location.origin}/checkin/${qrCode?.id}`}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                <Button onClick={handleClose} variant="outlined">
                    {isCreating ? '취소' : '닫기'}
                </Button>

                {!isCreating && qrCodeDataURL && (
                    <Button
                        onClick={handlePrint}
                        variant="outlined"
                        startIcon={<Print />}
                    >
                        인쇄
                    </Button>
                )}

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || (isCreating && !locationName.trim()) || (!isCreating && !qrCodeDataURL)}
                    startIcon={loading ? <CircularProgress size={16} /> : (isCreating ? <QrCode /> : <Download />)}
                >
                    {loading ? '처리 중...' : (isCreating ? 'QR 코드 생성' : '다운로드')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeDialog;
