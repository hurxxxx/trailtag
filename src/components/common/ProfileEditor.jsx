import React, { useState, useEffect } from 'react';
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
    IconButton
} from '@mui/material';
import {
    Person,
    Email,
    Phone,
    Edit,
    Save,
    Cancel,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';

const ProfileEditor = () => {
    const { user, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

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
            errors.full_name = '이름을 입력해주세요';
        }

        if (!formData.email?.trim()) {
            errors.email = '이메일을 입력해주세요';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '올바른 이메일 형식을 입력해주세요';
        }

        if (!formData.phone?.trim()) {
            errors.phone = '전화번호를 입력해주세요';
        } else if (formData.phone.length < 10) {
            errors.phone = '올바른 전화번호를 입력해주세요';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePasswordForm = () => {
        const errors = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = '현재 비밀번호를 입력해주세요';
        }

        if (!passwordData.newPassword) {
            errors.newPassword = '새 비밀번호를 입력해주세요';
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다';
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await updateProfile(formData);

            if (result.success) {
                setSuccess('프로필이 성공적으로 업데이트되었습니다');
                setEditing(false);
            } else {
                setError(result.message || '프로필 업데이트에 실패했습니다');
            }
        } catch (error) {
            setError('프로필 업데이트에 실패했습니다');
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
                setSuccess('비밀번호가 성공적으로 변경되었습니다');
                setShowPasswordForm(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setError(response.message || '비밀번호 변경에 실패했습니다');
            }
        } catch (error) {
            setError('비밀번호 변경에 실패했습니다');
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
                <Typography>사용자 정보를 불러오는 중...</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {/* Profile Information Card */}
            <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">프로필 정보</Typography>
                    {!editing && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => setEditing(true)}
                        >
                            편집
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
                        <Grid item xs={12} md={4}>
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
                                        {user.user_type === 'student' ? '학생' :
                                            user.user_type === 'parent' ? '학부모' : '관리자'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Box>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Person color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            이름
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
                                            이메일
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.email}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" alignItems="center">
                                    <Phone color="action" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            전화번호
                                        </Typography>
                                        <Typography variant="body1">
                                            {user.phone}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="full_name"
                                    label="이름"
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="이메일"
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    label="전화번호"
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
                        </Grid>

                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} /> : '저장'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                취소
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Password Change Card */}
            <Paper elevation={2} sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">비밀번호 변경</Typography>
                    {!showPasswordForm && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => setShowPasswordForm(true)}
                        >
                            비밀번호 변경
                        </Button>
                    )}
                </Box>

                {!showPasswordForm ? (
                    <Typography variant="body2" color="text.secondary">
                        보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
                    </Typography>
                ) : (
                    <Box component="form" onSubmit={handlePasswordSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    label="현재 비밀번호"
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="newPassword"
                                    label="새 비밀번호"
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="confirmPassword"
                                    label="새 비밀번호 확인"
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
                                {loading ? <CircularProgress size={20} /> : '비밀번호 변경'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancelPassword}
                                disabled={loading}
                            >
                                취소
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ProfileEditor;
