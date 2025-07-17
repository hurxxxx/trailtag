import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Paper,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Email, Phone } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
    const { register, loading, error, clearError } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        email: '',
        phone: '',
        user_type: ''
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

        // Username validation
        if (!formData.username.trim()) {
            errors.username = '사용자명을 입력해주세요';
        } else if (formData.username.length < 3) {
            errors.username = '사용자명은 최소 3자 이상이어야 합니다';
        }

        // Password validation
        if (!formData.password) {
            errors.password = '비밀번호를 입력해주세요';
        } else if (formData.password.length < 6) {
            errors.password = '비밀번호는 최소 6자 이상이어야 합니다';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = '비밀번호를 다시 입력해주세요';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        // Full name validation
        if (!formData.full_name.trim()) {
            errors.full_name = '이름을 입력해주세요';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = '이메일을 입력해주세요';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = '올바른 이메일 주소를 입력해주세요';
        }

        // Phone validation
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!formData.phone.trim()) {
            errors.phone = '전화번호를 입력해주세요';
        } else if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
            errors.phone = '올바른 전화번호를 입력해주세요';
        }

        // User type validation
        if (!formData.user_type) {
            errors.user_type = '사용자 유형을 선택해주세요';
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
            const { confirmPassword, ...registrationData } = formData;
            const result = await register(registrationData);

            if (result.success) {
                if (onSuccess) {
                    onSuccess(result.message);
                }
            } else {
                setSubmitError(result.message);
            }
        } catch (error) {
            setSubmitError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                회원가입
            </Typography>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                TrailTag 계정을 생성하세요
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
                    label="사용자명"
                    value={formData.username}
                    onChange={handleChange}
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    margin="normal"
                    required
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

                <TextField
                    fullWidth
                    name="confirmPassword"
                    label="비밀번호 확인"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    margin="normal"
                    required
                />

                <TextField
                    fullWidth
                    name="full_name"
                    label="이름"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={!!formErrors.full_name}
                    helperText={formErrors.full_name}
                    margin="normal"
                    required
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
                    name="email"
                    label="이메일 주소"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    margin="normal"
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email />
                                </InputAdornment>
                            ),
                        }
                    }}
                />

                <TextField
                    fullWidth
                    name="phone"
                    label="전화번호"
                    value={formData.phone}
                    onChange={handleChange}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                    margin="normal"
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Phone />
                                </InputAdornment>
                            ),
                        }
                    }}
                />

                <FormControl fullWidth margin="normal" error={!!formErrors.user_type} required>
                    <InputLabel>사용자 유형</InputLabel>
                    <Select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        label="사용자 유형"
                    >
                        <MenuItem value="student">학생</MenuItem>
                        <MenuItem value="parent">학부모</MenuItem>
                    </Select>
                    {formErrors.user_type && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {formErrors.user_type}
                        </Typography>
                    )}
                </FormControl>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                    {loading ? <CircularProgress size={24} /> : '회원가입'}
                </Button>

                <Box textAlign="center">
                    <Button
                        variant="text"
                        onClick={onSwitchToLogin}
                        disabled={loading}
                    >
                        이미 계정이 있으신가요? 로그인
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default RegisterForm;
