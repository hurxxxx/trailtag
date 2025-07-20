import React, { useState } from 'react';
import { Box, Container, Typography, Alert, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (user) {
            // Redirect based on user type
            switch (user.user_type) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'parent':
                    navigate('/parent');
                    break;
                case 'student':
                    navigate('/student');
                    break;
                default:
                    navigate('/');
            }
        }
    }, [user, navigate]);

    const handleLoginSuccess = () => {
        // Navigation will be handled by the useEffect above
    };

    const handleRegisterSuccess = (message) => {
        setSuccessMessage(message);
        setIsLogin(true); // Switch to login form after successful registration
    };

    const switchToLogin = () => {
        setIsLogin(true);
        setSuccessMessage('');
    };

    const switchToRegister = () => {
        setIsLogin(false);
        setSuccessMessage('');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}
        >
            {/* Language Switcher */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LanguageSwitcher variant="compact" />
            </Box>

            <Container maxWidth="sm">
                <Box textAlign="center" mb={4}>
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            mb: 2,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        {t('TrailTag')}
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}
                    >
                        {t('Learning Program Participation Tracking System')}
                    </Typography>
                </Box>

                {successMessage && (
                    <Fade in={!!successMessage}>
                        <Alert
                            severity="success"
                            sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}
                            onClose={() => setSuccessMessage('')}
                        >
                            {successMessage}
                        </Alert>
                    </Fade>
                )}

                <Fade in={isLogin} timeout={300}>
                    <Box sx={{ display: isLogin ? 'block' : 'none' }}>
                        <LoginForm
                            onSuccess={handleLoginSuccess}
                            onSwitchToRegister={switchToRegister}
                        />
                    </Box>
                </Fade>

                <Fade in={!isLogin} timeout={300}>
                    <Box sx={{ display: !isLogin ? 'block' : 'none' }}>
                        <RegisterForm
                            onSuccess={handleRegisterSuccess}
                            onSwitchToLogin={switchToLogin}
                        />
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
};

export default AuthPage;
