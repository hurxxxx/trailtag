import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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

        // 전화번호 필드는 숫자만 허용
        let processedValue = value;
        if (name === 'phone') {
            processedValue = value.replace(/\D/g, ''); // 숫자가 아닌 문자 제거
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
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
            errors.username = t('Please enter your login ID');
        } else if (formData.username.length < 3) {
            errors.username = t('Login ID must be at least 3 characters');
        }

        // Password validation
        if (!formData.password) {
            errors.password = t('Please enter your password');
        } else if (formData.password.length < 6) {
            errors.password = t('Password must be at least 6 characters');
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = t('Please confirm your password');
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t('Passwords do not match');
        }

        // Full name validation
        if (!formData.full_name.trim()) {
            errors.full_name = t('Please enter your name');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = t('Please enter your email');
        } else if (!emailRegex.test(formData.email)) {
            errors.email = t('Please enter a valid email address');
        }

        // Phone validation (숫자만, 3자 이상)
        const phoneDigits = formData.phone.replace(/\D/g, ''); // 숫자만 추출
        if (!formData.phone.trim()) {
            errors.phone = t('Please enter your phone number');
        } else if (phoneDigits.length < 3) {
            errors.phone = t('Phone number must be at least 3 digits');
        } else if (!/^\d+$/.test(phoneDigits)) {
            errors.phone = t('Please enter numbers only');
        }

        // User type validation
        if (!formData.user_type) {
            errors.user_type = t('Please select user type');
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
            setSubmitError(t('Registration failed. Please try again.'));
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                {t('Sign Up')}
            </Typography>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                {t('Create your TrailTag account')}
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
                    label={t('Login ID')}
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
                    label={t('Password')}
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
                                        aria-label={t('Toggle password visibility')}
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
                    label={t('Confirm Password')}
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
                    label={t('Name')}
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
                    label={t('Email Address')}
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
                    label={t('Phone Number')}
                    value={formData.phone}
                    onChange={handleChange}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone || t('Numbers only (minimum 3 digits)')}
                    margin="normal"
                    required
                    placeholder="01012345678"
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
                    <InputLabel>{t('User Type')}</InputLabel>
                    <Select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        label={t('User Type')}
                    >
                        <MenuItem value="student">{t('Student')}</MenuItem>
                        <MenuItem value="parent">{t('Parent')}</MenuItem>
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
                    {loading ? <CircularProgress size={24} /> : t('Sign Up')}
                </Button>

                <Box textAlign="center">
                    <Button
                        variant="text"
                        onClick={onSwitchToLogin}
                        disabled={loading}
                    >
                        {t('Already have an account? Login')}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default RegisterForm;
