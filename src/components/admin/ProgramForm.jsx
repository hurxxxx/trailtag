import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    Divider
} from '@mui/material';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import programService from '../../services/programService';
import { useAuth } from '../../contexts/AuthContext';

const ProgramForm = ({ open, onClose, program = null, onSuccess }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        start_datetime: '',
        end_datetime: ''
    });

    // Initialize form data when program prop changes
    useEffect(() => {
        console.log('ProgramForm useEffect - program prop changed:', program);
        if (program) {
            const newFormData = {
                name: program.name || '',
                description: program.description || '',
                location: program.location || '',
                start_datetime: program.start_datetime || '',
                end_datetime: program.end_datetime || ''
            };
            console.log('Setting form data for edit:', newFormData);
            setFormData(newFormData);
        } else {
            console.log('Setting form data for new program');
            setFormData({
                name: '',
                description: '',
                location: '',
                start_datetime: '',
                end_datetime: ''
            });
        }
        setError('');
    }, [program, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleDescriptionChange = (e) => {
        setFormData(prev => ({
            ...prev,
            description: e.target.value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError(t('Please enter program name'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Program form submit:', { program, formData, userId: user?.id });

            let result;
            if (program) {
                // Update existing program
                console.log('Program update attempt:', program.id, formData);
                result = await programService.updateProgram(program.id, formData, user.id);
                console.log('Program update result:', result);
            } else {
                // Create new program
                console.log('Program creation attempt:', formData);
                result = await programService.createProgram(formData, user.id);
                console.log('Program creation result:', result);
            }

            if (result.success) {
                console.log('Program processing success:', result.program);
                if (onSuccess) {
                    onSuccess(result.program, program ? 'updated' : 'created');
                }
                onClose();
            } else {
                console.error('Program processing failed:', result.message);
                setError(result.message);
            }
        } catch (error) {
            console.error('Program form error:', error);
            setError(t('An error occurred. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                description: '',
                location: ''
            });
            setError('');
            onClose();
        }
    };

    // Rich text editor configuration removed - using simple textarea instead

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" component="h2">
                    {program ? t('Edit Program') : t('Create New Program')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {program ? t('Edit program information') : t('Add a new learning program')}
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
                    <TextField
                        fullWidth
                        name="name"
                        label={t('Program Name')}
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('Enter program name')}

                    />

                    <TextField
                        fullWidth
                        name="location"
                        label={t('Location')}
                        value={formData.location}
                        onChange={handleChange}
                        margin="normal"
                        disabled={loading}
                        placeholder={t('Enter program location')}

                    />

                    <TextField
                        fullWidth
                        name="start_datetime"
                        label={t('Start Date Time')}
                        type="datetime-local"
                        value={formData.start_datetime}
                        onChange={handleChange}
                        margin="normal"
                        disabled={loading}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <TextField
                        fullWidth
                        name="end_datetime"
                        label="종료 일시"
                        type="datetime-local"
                        value={formData.end_datetime}
                        onChange={handleChange}
                        margin="normal"
                        disabled={loading}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            프로그램 설명
                        </Typography>
                        <TextField
                            fullWidth
                            name="description"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            disabled={loading}
                            placeholder="프로그램에 대한 자세한 설명을 입력하세요..."
                            multiline
                            rows={6}
                            variant="outlined"
                            sx={{ mt: 1 }}
                        />
                    </Box>
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
                    disabled={loading || !formData.name.trim()}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? t('Saving...') : (program ? t('Update Program') : t('Create Program'))}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgramForm;
