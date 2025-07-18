import { useState } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Close,
    Visibility,
    VisibilityOff,
    PersonAdd,
    School,
    FamilyRestroom,
    Person,
    Email,
    Phone
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';

const CreateUserDialog = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        email: '',
        phone: '',
        user_type: 'student'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        // 전화번호 필드는 숫자만 허용
        let processedValue = value;
        if (name === 'phone') {
            processedValue = value.replace(/\D/g, ''); // 숫자가 아닌 문자 제거
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
        setError('');
    };

    const handleGeneratePassword = () => {
        const password = userManagementService.generateRandomPassword(10);
        setFormData(prev => ({
            ...prev,
            password,
            confirmPassword: password
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Basic validation
        if (!formData.username || !formData.password || !formData.full_name || !formData.email) {
            setError('모든 필수 필드를 입력해주세요');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        if (formData.password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다');
            return;
        }

        try {
            setLoading(true);
            setError('');

            let result;
            const userData = {
                username: formData.username,
                password: formData.password,
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone
            };

            switch (formData.user_type) {
                case 'student':
                    result = await userManagementService.createStudentUser(userData);
                    break;
                case 'parent':
                    result = await userManagementService.createParentUser(userData);
                    break;
                default:
                    setError('잘못된 사용자 유형입니다');
                    return;
            }

            if (result.success) {
                onSuccess(result.message);
                handleClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('사용자 계정 생성 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            email: '',
            phone: '',
            user_type: 'student'
        });
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    const getUserTypeIcon = (userType) => {
        switch (userType) {
            case 'student': return <School />;
            case 'parent': return <FamilyRestroom />;
            default: return <PersonAdd />;
        }
    };

    const getUserTypeLabel = (userType) => {
        switch (userType) {
            case 'student': return '학생';
            case 'parent': return '학부모';
            default: return '사용자';
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getUserTypeIcon(formData.user_type)}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            새 {getUserTypeLabel(formData.user_type)} 계정 생성
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

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        새로운 사용자 계정을 생성합니다. 모든 필수 정보를 입력해주세요.
                    </Typography>

                    <TextField
                        fullWidth
                        name="username"
                        label="로그인ID"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="영문, 숫자 조합 (3자 이상)"
                        helperText="로그인 시 사용할 사용자명입니다"
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

                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            name="password"
                            label="비밀번호"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                            placeholder="6자 이상"
                            slotProps={{
                                input: {
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
                                }
                            }}
                        />
                        <Button
                            size="small"
                            onClick={handleGeneratePassword}
                            disabled={loading}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                textTransform: 'none',
                                fontSize: '0.75rem'
                            }}
                        >
                            자동 생성
                        </Button>
                    </Box>

                    <TextField
                        fullWidth
                        name="confirmPassword"
                        label="비밀번호 확인"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="비밀번호를 다시 입력하세요"
                        slotProps={{
                            input: {
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
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        name="full_name"
                        label="이름"
                        value={formData.full_name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="실명을 입력하세요"
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
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="example@domain.com"
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
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="01012345678"
                        helperText="숫자만 입력해주세요 (최소 3자)"
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

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>사용자 유형</InputLabel>
                        <Select
                            name="user_type"
                            value={formData.user_type}
                            onChange={handleChange}
                            disabled={loading}
                            label="사용자 유형"
                        >
                            <MenuItem value="student">학생</MenuItem>
                            <MenuItem value="parent">학부모</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : getUserTypeIcon(formData.user_type)}
                    >
                        {loading ? '생성 중...' : `${getUserTypeLabel(formData.user_type)} 생성`}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateUserDialog;
