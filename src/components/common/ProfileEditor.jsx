import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Avatar,
    Divider,
    InputAdornment,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader
} from '@mui/material';
import {
    Person,
    Email,
    Phone,
    Edit,
    Save,
    Cancel,
    Visibility,
    VisibilityOff,
    Language,
    AccessTime
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { getTimezonesByRegion, getTimezoneLabel } from '../../data/timezones';
import { timeFormats, dateFormats } from '../../data/timeFormats';

const ProfileEditor = () => {
    const { user, updateProfile } = useAuth();
    const { t, i18n } = useTranslation();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Timezone options - grouped by region
    const timezonesByRegion = getTimezonesByRegion();

    // Language options
    const languages = [
        { value: 'ko', label: t('Korean') },
        { value: 'en', label: t('English') },
        { value: 'ja', label: t('Japanese') }
    ];

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        timezone: '',
        language: '',
        timeFormat: '',
        dateFormat: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (user && !editing) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                timezone: user.timezone || 'Asia/Seoul',
                language: user.language || 'ko',
                timeFormat: user.timeFormat || '12h',
                dateFormat: user.dateFormat || 'long'
            });
        }
    }, [user, editing]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone field allows only numbers
        let processedValue = value;
        if (name === 'phone') {
            processedValue = value.replace(/\D/g, ''); // Remove non-numeric characters
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // 언어 설정이 변경되면 즉시 UI 언어도 변경
        if (name === 'language') {
            i18n.changeLanguage(processedValue);
        }

        // Clear field error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setError('');
        setSuccess('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setError('');
        setSuccess('');
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.full_name?.trim()) {
            errors.full_name = t('Please enter your name');
        }

        if (!formData.email?.trim()) {
            errors.email = t('Please enter your email');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t('Please enter a valid email format');
        }

        if (!formData.phone?.trim()) {
            errors.phone = t('Please enter your phone number');
        } else if (formData.phone.length < 10) {
            errors.phone = t('Please enter a valid phone number');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePasswordForm = () => {
        const errors = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = t('Please enter your current password');
        }

        if (!passwordData.newPassword) {
            errors.newPassword = t('Please enter your new password');
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = t('Password must be at least 6 characters');
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = t('Passwords do not match');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Form submitted with data:', formData);

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('Calling updateProfile with:', formData);
            const result = await updateProfile(formData);
            console.log('UpdateProfile result:', result);

            if (result.success) {
                // 언어 설정이 변경되었다면 i18n 언어도 변경
                if (formData.language && formData.language !== i18n.language) {
                    await i18n.changeLanguage(formData.language);
                }

                setSuccess(t('Profile updated successfully'));
                setEditing(false);
            } else {
                setError(result.message || t('Failed to update profile'));
            }
        } catch (error) {
            console.error('Profile update error in component:', error);
            setError(error.message || t('Failed to update profile'));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );

            if (response.success) {
                setSuccess(t('Password changed successfully'));
                setShowPasswordForm(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setError(response.message || t('Failed to change password'));
            }
        } catch (error) {
            console.error('Password change error:', error);
            // Use server-returned error message or display default message
            setError(error.message || t('Failed to change password'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || ''
        });
        setFormErrors({});
        setError('');
        setSuccess('');
    };

    const handleCancelPassword = () => {
        setShowPasswordForm(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setFormErrors({});
        setError('');
        setSuccess('');
    };

    if (!user) {
        return (
            <Paper elevation={2} sx={{ p: 4 }}>
                <Typography>{t('Loading user information...')}</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {/* Profile Information Card */}
            <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">{t('Profile Information')}</Typography>
                    {!editing && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => {
                                setEditing(true);
                                // 편집 모드 진입 시 현재 i18n 언어를 폼에 반영
                                setFormData(prev => ({
                                    ...prev,
                                    language: i18n.language
                                }));
                            }}
                        >
                            {t('Edit')}
                        </Button>
                    )}
                </Box>

                {(error || success) && (
                    <Alert severity={error ? 'error' : 'success'} sx={{ mb: 3 }}>
                        {error || success}
                    </Alert>
                )}

                {!editing ? (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card elevation={1}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            mx: 'auto',
                                            mb: 2,
                                            bgcolor: 'primary.main'
                                        }}
                                    >
                                        <Person sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Typography variant="h6">{user.full_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.user_type === 'student' ? t('Student') :
                                            user.user_type === 'parent' ? t('Parent') : t('Admin')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Box>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Person color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Name')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.full_name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Email color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Email')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.email}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Phone color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Phone Number')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.phone}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" alignItems="center" mb={2}>
                                    <AccessTime color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Timezone')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {getTimezoneLabel(user.timezone) || user.timezone || 'Seoul (UTC+9)'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" alignItems="center">
                                    <Language color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Language')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {languages.find(lang => lang.value === (editing ? formData.language : user.language))?.label || (editing ? formData.language : user.language) || t('Korean')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="full_name"
                                    label={t('Name')}
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    error={!!formErrors.full_name}
                                    helperText={formErrors.full_name}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="email"
                                    label={t('Email')}
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!formErrors.email}
                                    helperText={formErrors.email}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    label={t('Phone Number')}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={!!formErrors.phone}
                                    helperText={formErrors.phone}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('Timezone')}</InputLabel>
                                    <Select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleChange}
                                        label={t('Timezone')}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <AccessTime />
                                            </InputAdornment>
                                        }
                                    >
                                        {Object.entries(timezonesByRegion).map(([region, timezones]) => [
                                            <ListSubheader key={`region-${region}`}>{region}</ListSubheader>,
                                            ...timezones.map((tz) => (
                                                <MenuItem key={`tz-${tz.value}`} value={tz.value}>
                                                    {tz.label}
                                                </MenuItem>
                                            ))
                                        ])}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('Language')}</InputLabel>
                                    <Select
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        label={t('Language')}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <Language />
                                            </InputAdornment>
                                        }
                                    >
                                        {languages.map((lang) => (
                                            <MenuItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Time Format */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('Time Format')}</InputLabel>
                                    <Select
                                        name="timeFormat"
                                        value={formData.timeFormat}
                                        onChange={handleChange}
                                        label={t('Time Format')}
                                    >
                                        {timeFormats[formData.language]?.map((format) => (
                                            <MenuItem key={format.value} value={format.value}>
                                                {format.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Date Format */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('Date Format')}</InputLabel>
                                    <Select
                                        name="dateFormat"
                                        value={formData.dateFormat}
                                        onChange={handleChange}
                                        label={t('Date Format')}
                                    >
                                        {dateFormats[formData.language]?.map((format) => (
                                            <MenuItem key={format.value} value={format.value}>
                                                {format.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} /> : t('Save')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                {t('Cancel')}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Password Change Card */}
            <Paper elevation={2} sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">{t('Change Password')}</Typography>
                    {!showPasswordForm && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => setShowPasswordForm(true)}
                        >
                            {t('Change Password')}
                        </Button>
                    )}
                </Box>

                {!showPasswordForm ? (
                    <Typography variant="body2" color="text.secondary">
                        {t('We recommend changing your password regularly for security.')}
                    </Typography>
                ) : (
                    <Box component="form" onSubmit={handlePasswordSubmit}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    label={t('Current Password')}
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    error={!!formErrors.currentPassword}
                                    helperText={formErrors.currentPassword}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    edge="end"
                                                >
                                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="newPassword"
                                    label={t('New Password')}
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    error={!!formErrors.newPassword}
                                    helperText={formErrors.newPassword}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    edge="end"
                                                >
                                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    name="confirmPassword"
                                    label={t('Confirm New Password')}
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    error={!!formErrors.confirmPassword}
                                    helperText={formErrors.confirmPassword}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} /> : t('Change Password')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancelPassword}
                                disabled={loading}
                            >
                                {t('Cancel')}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ProfileEditor;
