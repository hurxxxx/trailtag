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
    Divider
} from '@mui/material';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import programService from '../../services/programService';
import { useAuth } from '../../contexts/AuthContext';

const ProgramForm = ({ open, onClose, program = null, onSuccess }) => {
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
            setError('프로그램 이름을 입력해주세요');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('프로그램 폼 제출:', { program, formData, userId: user?.id });

            let result;
            if (program) {
                // Update existing program
                console.log('프로그램 수정 시도:', program.id, formData);
                result = await programService.updateProgram(program.id, formData, user.id);
                console.log('프로그램 수정 결과:', result);
            } else {
                // Create new program
                console.log('프로그램 생성 시도:', formData);
                result = await programService.createProgram(formData, user.id);
                console.log('프로그램 생성 결과:', result);
            }

            if (result.success) {
                console.log('프로그램 처리 성공:', result.program);
                if (onSuccess) {
                    onSuccess(result.program, program ? 'updated' : 'created');
                }
                onClose();
            } else {
                console.error('프로그램 처리 실패:', result.message);
                setError(result.message);
            }
        } catch (error) {
            console.error('프로그램 폼 오류:', error);
            setError('오류가 발생했습니다. 다시 시도해주세요.');
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
                    {program ? '프로그램 수정' : '새 프로그램 생성'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {program ? '프로그램 정보를 수정합니다' : '새로운 학습 프로그램을 추가합니다'}
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
                        label="프로그램 이름"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="프로그램 이름을 입력하세요"

                    />

                    <TextField
                        fullWidth
                        name="location"
                        label="위치"
                        value={formData.location}
                        onChange={handleChange}
                        margin="normal"
                        disabled={loading}
                        placeholder="프로그램 위치를 입력하세요"

                    />

                    <TextField
                        fullWidth
                        name="start_datetime"
                        label="시작 일시"
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
                    {loading ? '저장 중...' : (program ? '프로그램 수정' : '프로그램 생성')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgramForm;
