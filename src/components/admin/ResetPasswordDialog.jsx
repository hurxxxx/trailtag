import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    InputAdornment,
    Chip
} from '@mui/material';
import {
    Close,
    Visibility,
    VisibilityOff,
    VpnKey,
    Person
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';

const ResetPasswordDialog = ({ open, user, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (open && user) {
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [open, user]);

    const handleGeneratePassword = () => {
        const password = userManagementService.generateRandomPassword(10);
        setNewPassword(password);
        setConfirmPassword(password);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!newPassword || newPassword.length < 6) {
            setError(t('Password must be at least 6 characters long'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('Passwords do not match'));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await userManagementService.resetUserPassword(user.id, newPassword);

            if (result.success) {
                onSuccess();
                handleClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(t('An error occurred while changing password'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    const getUserTypeColor = (userType) => {
        const colors = {
            'admin': 'error',
            'student': 'primary',
            'parent': 'success'
        };
        return colors[userType] || 'default';
    };

    const formatUserType = (userType) => {
        const types = {
            'admin': t('Admin'),
            'student': t('Student'),
            'parent': t('Parent')
        };
        return types[userType] || userType;
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VpnKey color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {t('Change Password')}
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

                    {/* User Info */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Person color="action" />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {user.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user.username} • {user.email}
                            </Typography>
                        </Box>
                        <Chip
                            label={formatUserType(user.user_type)}
                            color={getUserTypeColor(user.user_type)}
                            size="small"
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('Set a new password for this user. Please securely share the changed password with the user.')}
                    </Typography>

                    <TextField
                        fullWidth
                        label={t('New Password')}
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('6+ characters')}
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

                    <TextField
                        fullWidth
                        label={t('Confirm Password')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('Re-enter new password')}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleGeneratePassword}
                            disabled={loading}
                            sx={{ textTransform: 'none' }}
                        >
                            {t('Generate Secure Password')}
                        </Button>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !newPassword || !confirmPassword}
                        startIcon={loading ? <CircularProgress size={16} /> : <VpnKey />}
                    >
                        {loading ? t('Changing...') : t('Change Password')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ResetPasswordDialog;
