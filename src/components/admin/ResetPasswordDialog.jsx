import React, { useState, useEffect } from 'react';
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
            setError('비밀번호는 6자 이상이어야 합니다');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
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
            setError('비밀번호 변경 중 오류가 발생했습니다');
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
            'admin': '관리자',
            'student': '학생',
            'parent': '부모'
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
                            비밀번호 변경
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
                        이 사용자의 비밀번호를 새로 설정합니다. 변경된 비밀번호를 사용자에게 안전하게 전달해주세요.
                    </Typography>

                    <TextField
                        fullWidth
                        label="새 비밀번호"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                    <TextField
                        fullWidth
                        label="비밀번호 확인"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="새 비밀번호를 다시 입력하세요"
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
                            안전한 비밀번호 자동 생성
                        </Button>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !newPassword || !confirmPassword}
                        startIcon={loading ? <CircularProgress size={16} /> : <VpnKey />}
                    >
                        {loading ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ResetPasswordDialog;
