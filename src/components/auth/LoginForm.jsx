import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
    const { login, loading, error, clearError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        clearError();
        setSubmitError('');
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.username.trim()) {
            errors.username = '로그인ID 를 입력해주세요';
        }

        if (!formData.password) {
            errors.password = '비밀번호를 입력해주세요';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const result = await login(formData.username, formData.password);

            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setSubmitError(result.message);
            }
        } catch (error) {
            setSubmitError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                로그인
            </Typography>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                TrailTag에 다시 오신 것을 환영합니다
            </Typography>

            {(error || submitError) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || submitError}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    fullWidth
                    name="username"
                    label="로그인ID "
                    value={formData.username}
                    onChange={handleChange}
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    margin="normal"
                    required
                    autoFocus
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Person />
                                </InputAdornment>
                            ),
                        }
                    }}
                />

                <TextField
                    fullWidth
                    name="password"
                    label="비밀번호"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    margin="normal"
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="비밀번호 표시 전환"
                                        onClick={togglePasswordVisibility}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }
                    }}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                    {loading ? <CircularProgress size={24} /> : '로그인'}
                </Button>

                <Box textAlign="center">
                    <Button
                        variant="text"
                        onClick={onSwitchToRegister}
                        disabled={loading}
                    >
                        계정이 없으신가요? 회원가입
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default LoginForm;
