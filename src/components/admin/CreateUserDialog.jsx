import { useState } from 'react';
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
    const { t } = useTranslation();
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

        // Phone number field only allows digits
        let processedValue = value;
        if (name === 'phone') {
            processedValue = value.replace(/\D/g, ''); // Remove non-digit characters
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
            setError(t('Please fill in all required fields'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('Passwords do not match'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('Password must be at least 6 characters long'));
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
                    setError(t('Invalid user type'));
                    return;
            }

            if (result.success) {
                onSuccess(result.message);
                handleClose();
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(t('An error occurred while creating user account'));
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
            case 'student': return t('Student');
            case 'parent': return t('Parent');
            default: return t('User');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getUserTypeIcon(formData.user_type)}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {t('Create New {{userType}} Account', { userType: getUserTypeLabel(formData.user_type) })}
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
                        {t('Create a new user account - Please fill in all required information')}
                    </Typography>

                    <TextField
                        fullWidth
                        name="username"
                        label={t('Login ID')}
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('Letters and numbers (3+ characters)')}
                        helperText={t('Username for login')}
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
                            label={t('Password')}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                            placeholder={t('6+ characters')}
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
                            {t('Auto Generate')}
                        </Button>
                    </Box>

                    <TextField
                        fullWidth
                        name="confirmPassword"
                        label={t('Confirm Password')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('Re-enter password')}
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
                        label={t('Name')}
                        value={formData.full_name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder={t('Enter full name')}
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
                        label={t('Phone Number')}
                        value={formData.phone}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                        placeholder="01012345678"
                        helperText={t('Enter numbers only (minimum 3 characters)')}
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
                        <InputLabel>{t('User Type')}</InputLabel>
                        <Select
                            name="user_type"
                            value={formData.user_type}
                            onChange={handleChange}
                            disabled={loading}
                            label={t('User Type')}
                        >
                            <MenuItem value="student">{t('Student')}</MenuItem>
                            <MenuItem value="parent">{t('Parent')}</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : getUserTypeIcon(formData.user_type)}
                    >
                        {loading ? t('Status: Creating user account...') : t('Create {{userType}}', { userType: getUserTypeLabel(formData.user_type) })}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateUserDialog;
