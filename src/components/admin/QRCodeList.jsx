import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Grid,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Alert,
    CircularProgress,
    TextField,
    InputAdornment,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    MoreVert,
    Download,
    Delete,
    Search,
    Add,
    LocationOn,
    School,
    AccessTime,
    Visibility
} from '@mui/icons-material';
import qrCodeService from '../../services/qrCodeService';

const QRCodeList = ({ onCreateQRCode, refreshTrigger, selectedProgram = null }) => {
    const [qrCodes, setQRCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedQRCode, setSelectedQRCode] = useState(null);
    const [previewDialog, setPreviewDialog] = useState(false);

    // Load QR codes
    const loadQRCodes = async () => {
        try {
            setLoading(true);
            let result;

            if (selectedProgram) {
                result = await qrCodeService.getQRCodesByProgram(selectedProgram.id);
            } else {
                result = await qrCodeService.getAllQRCodes();
            }

            if (result.success) {
                setQRCodes(result.qrCodes);
                setError('');
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Failed to load QR codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQRCodes();
    }, [refreshTrigger, selectedProgram]);

    // Filter QR codes based on search term
    const filteredQRCodes = qrCodes.filter(qr =>
        qr.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (qr.program_name && qr.program_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleMenuOpen = (event, qrCode) => {
        setAnchorEl(event.currentTarget);
        setSelectedQRCode(qrCode);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedQRCode(null);
    };

    const handlePreview = () => {
        setPreviewDialog(true);
        handleMenuClose();
    };

    const handleDownload = async () => {
        if (selectedQRCode) {
            try {
                await qrCodeService.downloadQRCode(
                    selectedQRCode.qr_code_data,
                    selectedQRCode.location_name
                );
            } catch (error) {
                setError('Failed to download QR code');
            }
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedQRCode) {
            try {
                const result = await qrCodeService.deleteQRCode(selectedQRCode.id);
                if (result.success) {
                    await loadQRCodes(); // Refresh the list
                } else {
                    setError(result.message);
                }
            } catch (error) {
                setError('Failed to delete QR code');
            }
        }
        handleMenuClose();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Add Button */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    placeholder="Search QR codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onCreateQRCode}
                    sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                    New QR Code
                </Button>
            </Box>

            {/* QR Codes Grid */}
            {filteredQRCodes.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'No QR codes found' : 'No QR codes created yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search terms' : 'Create your first QR code to get started'}
                    </Typography>
                    {!searchTerm && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={onCreateQRCode}
                            sx={{ mt: 2 }}
                        >
                            Create QR Code
                        </Button>
                    )}
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredQRCodes.map((qrCode) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={qrCode.id}>
                            <Card
                                elevation={2}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6" component="h3" noWrap>
                                            {qrCode.location_name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, qrCode)}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    </Box>

                                    {/* QR Code Image */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            mb: 2,
                                            p: 1,
                                            bgcolor: 'grey.50',
                                            borderRadius: 1
                                        }}
                                    >
                                        <img
                                            src={qrCode.qr_code_image}
                                            alt={`QR Code for ${qrCode.location_name}`}
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                    </Box>

                                    {qrCode.program_name && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <School fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" ml={0.5}>
                                                {qrCode.program_name}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box display="flex" alignItems="center" mb={1}>
                                        <LocationOn fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                                            {qrCode.location_name}
                                        </Typography>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={1}>
                                        <AccessTime fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(qrCode.created_at)}
                                        </Typography>
                                    </Box>

                                    <Box mt={1}>
                                        <Chip
                                            label={qrCode.is_active ? 'Active' : 'Inactive'}
                                            color={qrCode.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Visibility />}
                                        onClick={() => {
                                            setSelectedQRCode(qrCode);
                                            setPreviewDialog(true);
                                        }}
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Download />}
                                        onClick={() => {
                                            setSelectedQRCode(qrCode);
                                            handleDownload();
                                        }}
                                    >
                                        Download
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handlePreview}>
                    <Visibility fontSize="small" sx={{ mr: 1 }} />
                    Preview
                </MenuItem>
                <MenuItem onClick={handleDownload}>
                    <Download fontSize="small" sx={{ mr: 1 }} />
                    Download
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Preview Dialog */}
            <Dialog
                open={previewDialog}
                onClose={() => setPreviewDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    QR Code Preview
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 3 }}>
                    {selectedQRCode && (
                        <Box>
                            <img
                                src={selectedQRCode.qr_code_image}
                                alt={`QR Code for ${selectedQRCode.location_name}`}
                                style={{
                                    width: '300px',
                                    height: '300px',
                                    objectFit: 'contain'
                                }}
                            />
                            <Typography variant="h6" mt={2}>
                                {selectedQRCode.location_name}
                            </Typography>
                            {selectedQRCode.program_name && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedQRCode.program_name}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => {
                            handleDownload();
                            setPreviewDialog(false);
                        }}
                    >
                        Download
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Floating Action Button for mobile */}
            <Fab
                color="primary"
                aria-label="add qr code"
                onClick={onCreateQRCode}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', sm: 'none' }
                }}
            >
                <Add />
            </Fab>
        </Box>
    );
};

export default QRCodeList;
