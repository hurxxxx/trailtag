import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    Chip,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Close,
    Delete,
    Person,
    Warning,
    CheckCircle,
    Cancel
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';

const DeleteUserDialog = ({ open, user, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            setError(t('Please type "DELETE" exactly to confirm'));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await userManagementService.deleteUser(user.id);

            if (result.success) {
                onSuccess(result.message);
                handleClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(t('An error occurred while deleting user'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmText('');
        setError('');
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

    const getDeletedData = (userType) => {
        const baseData = [
            t('User account information'),
            t('Login sessions')
        ];

        switch (userType) {
            case 'student':
                return [
                    ...baseData,
                    t('All check-in records'),
                    t('Parent-student relationships')
                ];
            case 'parent':
                return [
                    ...baseData,
                    t('Parent-student relationships')
                ];
            case 'admin':
                return [
                    ...baseData,
                    t('All created programs'),
                    t('QR codes of created programs')
                ];
            default:
                return baseData;
        }
    };

    if (!user) return null;

    const deletedData = getDeletedData(user.user_type);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Delete color="error" />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {t('Delete User')}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Warning Alert */}
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('Warning - This action cannot be undone')}
                    </Typography>
                    <Typography variant="body2">
                        {t('Deleting a user will permanently remove all related data')}
                    </Typography>
                </Alert>

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

                {/* Data to be deleted */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('Data to be deleted')}
                </Typography>
                <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
                    {deletedData.map((item, index) => (
                        <ListItem key={index}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Cancel color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={item}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* Confirmation Input */}
                <Typography variant="body2" sx={{ mb: 2 }}>
                    {t('To continue type DELETE below')}
                </Typography>
                <TextField
                    fullWidth
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={loading}
                    error={confirmText !== '' && confirmText !== 'DELETE'}
                    helperText={confirmText !== '' && confirmText !== 'DELETE' ? t('Please enter "DELETE" exactly') : ''}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                <Button onClick={handleClose} disabled={loading}>
                    {t('Cancel')}
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="contained"
                    color="error"
                    disabled={loading || confirmText !== 'DELETE'}
                    startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
                >
                    {loading ? t('Deleting...') : t('Permanently Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteUserDialog;
