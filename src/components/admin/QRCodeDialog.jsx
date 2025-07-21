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
import { useUserLocale } from '../../hooks/useUserLocale';
import { formatDate } from '../../utils/dateUtils';

const QRCodeDialog = ({ open, onClose, program, qrCode, onSuccess }) => {
    const { t } = useTranslation();
    const { language, timezone } = useUserLocale();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');

    // Generate QR code image
    const generateQRCodeImage = async (qrCodeData) => {
        try {
            // Use actual QR code data generated from server
            // Format: trailtag://checkin?program=123&location=Main&t=1234567890
            const qrData = qrCodeData.qr_code_data;

            if (!qrData) {
                throw new Error(t('QR code data not found'));
            }

            console.log('QR code data:', qrData);
            console.log('QR image version:', qrCodeData.qr_image_version);

            // Generate QR code image as Data URL
            const dataURL = await QRCodeLib.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1976d2', // Blue
                    light: '#ffffff' // White
                }
            });

            setQrCodeDataURL(dataURL);
        } catch (error) {
            console.error('Failed to generate QR code image:', error);
            setError(t('Failed to generate QR code image'));
        }
    };

    // Generate image when QR code is available
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
                // Regenerate image since QR code data was updated
                await generateQRCodeImage(result.qrCode);
                onSuccess && onSuccess(result.qrCode);
            } else {
                setError(result.message || t('Failed to regenerate QR image'));
            }
        } catch (error) {
            console.error('QR image regeneration error:', error);
            setError(t('An error occurred while regenerating QR image'));
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
                        <title>${t('QR Code')} - ${program?.name}</title>
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
${t('Scan the QR code with your smartphone to check in')}
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
                    // Display QR code information
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
                                        {t('Scan the QR code with your smartphone to check in')}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {t('Generating QR code...')}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('Created')}: {qrCode?.created_at && formatDate(qrCode.created_at, timezone, language)}
                        </Typography>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                {t('Regenerate QR Code')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t('Generate a new QR code. The existing QR code will be invalidated for enhanced security.')}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRegenerateImage}
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                {t('Issue New QR Code')}
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    // When QR code is not available
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            {t('QR code not found')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('QR code is automatically generated when creating a program.')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                <Button onClick={handleClose} variant="outlined">
                    {t('Close')}
                </Button>

                {qrCode && qrCodeDataURL && (
                    <>
                        <Button
                            onClick={handlePrint}
                            variant="outlined"
                            startIcon={<Print />}
                        >
                            {t('Print')}
                        </Button>
                        <Button
                            onClick={handleDownload}
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <Download />}
                        >
                            {loading ? t('Processing...') : t('Download')}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeDialog;
