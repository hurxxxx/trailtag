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
import { Visibility, VisibilityOff, Person, Email, Phone, Home } from '@mui/icons-material';
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
        address: '',
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
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Full name validation
        if (!formData.full_name.trim()) {
            errors.full_name = 'Full name is required';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Phone validation
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
            errors.phone = 'Please enter a valid phone number';
        }

        // Address validation
        if (!formData.address.trim()) {
            errors.address = 'Address is required';
        }

        // User type validation
        if (!formData.user_type) {
            errors.user_type = 'Please select a user type';
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
            setSubmitError('Registration failed. Please try again.');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                Register
            </Typography>
            
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Create your TrailTag account
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
                    label="Username"
                    value={formData.username}
                    onChange={handleChange}
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    margin="normal"
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Person />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    margin="normal"
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={togglePasswordVisibility}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
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
                    label="Full Name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={!!formErrors.full_name}
                    helperText={formErrors.full_name}
                    margin="normal"
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Person />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    margin="normal"
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Email />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    name="phone"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                    margin="normal"
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Phone />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    name="address"
                    label="Address"
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    margin="normal"
                    required
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Home />
                            </InputAdornment>
                        ),
                    }}
                />

                <FormControl fullWidth margin="normal" error={!!formErrors.user_type} required>
                    <InputLabel>User Type</InputLabel>
                    <Select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        label="User Type"
                    >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="parent">Parent</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
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
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                </Button>

                <Box textAlign="center">
                    <Button
                        variant="text"
                        onClick={onSwitchToLogin}
                        disabled={loading}
                    >
                        Already have an account? Sign In
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default RegisterForm;
