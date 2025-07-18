import React, { useState } from 'react';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            setError('확인을 위해 "DELETE"를 정확히 입력해주세요');
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
            setError('사용자 삭제 중 오류가 발생했습니다');
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
            'admin': '관리자',
            'student': '학생',
            'parent': '부모'
        };
        return types[userType] || userType;
    };

    const getDeletedData = (userType) => {
        const baseData = [
            '사용자 계정 정보',
            '로그인 세션'
        ];

        switch (userType) {
            case 'student':
                return [
                    ...baseData,
                    '모든 체크인 기록',
                    '부모-학생 연결 관계'
                ];
            case 'parent':
                return [
                    ...baseData,
                    '부모-학생 연결 관계'
                ];
            case 'admin':
                return [
                    ...baseData,
                    '생성한 모든 프로그램',
                    '생성한 프로그램의 QR 코드'
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
                            사용자 삭제
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
                        ⚠️ 주의: 이 작업은 되돌릴 수 없습니다!
                    </Typography>
                    <Typography variant="body2">
                        사용자를 삭제하면 관련된 모든 데이터가 영구적으로 삭제됩니다.
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
                    삭제될 데이터:
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
                    계속하려면 아래에 <strong>DELETE</strong>를 입력하세요:
                </Typography>
                <TextField
                    fullWidth
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={loading}
                    error={confirmText !== '' && confirmText !== 'DELETE'}
                    helperText={confirmText !== '' && confirmText !== 'DELETE' ? '"DELETE"를 정확히 입력해주세요' : ''}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                <Button onClick={handleClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="contained"
                    color="error"
                    disabled={loading || confirmText !== 'DELETE'}
                    startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
                >
                    {loading ? '삭제 중...' : '영구 삭제'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteUserDialog;
