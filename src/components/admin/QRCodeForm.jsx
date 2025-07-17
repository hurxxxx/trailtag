import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Typography,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import qrCodeService from '../../services/qrCodeService';
import programService from '../../services/programService';

const QRCodeForm = ({ open, onClose, selectedProgram = null, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [programs, setPrograms] = useState([]);
    const [formData, setFormData] = useState({
        program_id: '',
        location_name: ''
    });

    // Load programs when component mounts
    useEffect(() => {
        const loadPrograms = async () => {
            const result = await programService.getAllPrograms();
            if (result.success) {
                setPrograms(result.programs);
            }
        };
        loadPrograms();
    }, []);

    // Initialize form data when dialog opens
    useEffect(() => {
        if (open) {
            if (selectedProgram) {
                setFormData({
                    program_id: selectedProgram.id,
                    location_name: ''
                });
            } else {
                setFormData({
                    program_id: '',
                    location_name: ''
                });
            }
            setError('');
        }
    }, [open, selectedProgram]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.program_id) {
            setError('프로그램을 선택해주세요');
            return;
        }

        if (!formData.location_name.trim()) {
            setError('위치명을 입력해주세요');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await qrCodeService.createQRCode(
                formData.program_id,
                formData.location_name.trim(),
                1 // userId - in real app this would come from auth context
            );

            if (result.success) {
                if (onSuccess) {
                    onSuccess(result.qrCode);
                }
                onClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                program_id: '',
                location_name: ''
            });
            setError('');
            onClose();
        }
    };

    const selectedProgramData = programs.find(p => p.id === formData.program_id);

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
                <Typography variant="h5" component="h2">
                    QR 코드 생성
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    프로그램 체크인을 위한 새로운 QR 코드를 생성합니다
                </Typography>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>프로그램 선택</InputLabel>
                        <Select
                            name="program_id"
                            value={formData.program_id}
                            onChange={handleChange}
                            label="프로그램 선택"
                            disabled={loading || !!selectedProgram}
                        >
                            {programs.map((program) => (
                                <MenuItem key={program.id} value={program.id}>
                                    {program.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedProgramData && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                선택된 프로그램:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedProgramData.name}
                            </Typography>
                            {selectedProgramData.location && (
                                <Typography variant="body2" color="text.secondary">
                                    위치: {selectedProgramData.location}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        name="location_name"
                        label="QR 코드 위치명"
                        value={formData.location_name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="예: 정문, 101호실, 도서관 데스크"
                        helperText="QR 코드가 설치될 정확한 위치를 입력해주세요"
                    />
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                >
                    취소
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.program_id || !formData.location_name.trim()}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? '생성 중...' : 'QR 코드 생성'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRCodeForm;
