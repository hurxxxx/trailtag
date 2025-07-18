import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Close,
    Visibility,
    VisibilityOff,
    PersonAdd
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';

const CreateAdminDialog = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleGeneratePassword = () => {
        const password = userManagementService.generateRandomPassword(12);
        setFormData(prev => ({
            ...prev,
            password
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validate form data
        const validation = userManagementService.validateUserData(formData, true);
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await userManagementService.createAdminUser(formData);

            if (result.success) {
                onSuccess();
                handleClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('관리자 계정 생성 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            username: '',
            password: '',
            full_name: '',
            email: '',
            phone: ''
        });
        setError('');
        setShowPassword(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAdd color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            새 관리자 계정 생성
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        새로운 관리자 계정을 생성합니다. 모든 필수 정보를 입력해주세요.
                    </Typography>

                    <TextField
                        fullWidth
                        name="username"
                        label="사용자명"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="영문, 숫자 조합 (3자 이상)"
                        helperText="로그인 시 사용할 사용자명입니다"
                    />

                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            name="password"
                            label="비밀번호"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                            placeholder="6자 이상"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            size="small"
                            onClick={handleGeneratePassword}
                            disabled={loading}
                            sx={{ 
                                position: 'absolute', 
                                right: 0, 
                                top: '50%',
                                transform: 'translateY(-50%)',
                                textTransform: 'none',
                                fontSize: '0.75rem'
                            }}
                        >
                            자동 생성
                        </Button>
                    </Box>

                    <TextField
                        fullWidth
                        name="full_name"
                        label="이름"
                        value={formData.full_name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="실명을 입력하세요"
                    />

                    <TextField
                        fullWidth
                        name="email"
                        label="이메일"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="example@domain.com"
                    />

                    <TextField
                        fullWidth
                        name="phone"
                        label="전화번호 (선택사항)"
                        value={formData.phone}
                        onChange={handleChange}
                        margin="normal"
                        disabled={loading}
                        placeholder="010-1234-5678"
                    />
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
                    >
                        {loading ? '생성 중...' : '관리자 생성'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateAdminDialog;
