import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
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
    Print
} from '@mui/icons-material';
import QRCodeLib from 'qrcode';
import qrCodeService from '../../services/qrCodeService';

const QRCodeDialog = ({ open, onClose, program, qrCode, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');

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
            console.log('QR 이미지 버전:', qrCodeData.qr_image_version);

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
            setError(t('Failed to generate QR code image'));
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

    const handleDownload = () => {
        if (qrCodeDataURL) {
            const link = document.createElement('a');
            link.download = `QR_${program?.name}.png`;
            link.href = qrCodeDataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRegenerateImage = async () => {
        if (!qrCode?.id) return;

        try {
            setLoading(true);
            setError('');

            const result = await qrCodeService.regenerateQRImage(qrCode.id);

            if (result.success) {
                // QR 코드 데이터가 업데이트되었으므로 이미지 재생성
                await generateQRCodeImage(result.qrCode);
                onSuccess && onSuccess(result.qrCode);
            } else {
                setError(result.message || 'QR 이미지 재생성에 실패했습니다');
            }
        } catch (error) {
            console.error('QR 이미지 재생성 오류:', error);
            setError('QR 이미지 재생성 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
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
                sx: { borderRadius: 2 }
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
                                {t('QR Code Information')}
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

                {qrCode ? (
                    // QR 코드 정보 표시
                    <Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                borderRadius: 2,
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

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            생성일: {qrCode?.created_at && new Date(qrCode.created_at).toLocaleDateString('ko-KR')}
                        </Typography>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                QR 코드 재발급
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                새로운 QR 코드를 생성합니다. 기존 QR 코드는 무효화되어 보안이 강화됩니다.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRegenerateImage}
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                새 QR 코드 발급
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    // QR 코드가 없는 경우
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            QR 코드를 찾을 수 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            프로그램 생성 시 자동으로 QR 코드가 생성됩니다.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                <Button onClick={handleClose} variant="outlined">
                    닫기
                </Button>

                {qrCode && qrCodeDataURL && (
                    <>
                        <Button
                            onClick={handlePrint}
                            variant="outlined"
                            startIcon={<Print />}
                        >
                            인쇄
                        </Button>
                        <Button
                            onClick={handleDownload}
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <Download />}
                        >
                            {loading ? '처리 중...' : '다운로드'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeDialog;
