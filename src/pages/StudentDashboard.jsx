import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Typography,
    Paper,
    AppBar,
    Toolbar,

    Button,
    BottomNavigation,
    BottomNavigationAction,
    useTheme,
    useMediaQuery,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import {
    QrCodeScanner,
    History,
    Home,
    Person,
    Logout,
    CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useUserLocale } from '../hooks/useUserLocale';
import { formatTime } from '../utils/dateUtils';
import QRScanner from '../components/student/QRScanner';
import CheckInHistory from '../components/student/CheckInHistory';
import checkInService from '../services/checkInService';

const StudentDashboard = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { language, timezone } = useUserLocale();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [bottomNavValue, setBottomNavValue] = useState(0);

    // Set tab value based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path === '/student' || path === '/student/') {
            setBottomNavValue(0);
        } else if (path === '/student/scanner') {
            setBottomNavValue(1);
        } else if (path === '/student/history') {
            setBottomNavValue(2);
        } else if (path === '/student/profile') {
            setBottomNavValue(3);
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const handleBottomNavChange = (_event, newValue) => {
        setBottomNavValue(newValue);
        switch (newValue) {
            case 0:
                navigate('/student');
                break;
            case 1:
                navigate('/student/scanner');
                break;
            case 2:
                navigate('/student/history');
                break;
            case 3:
                navigate('/student/profile');
                break;
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
            pb: isMobile ? 7 : 0 // Add padding for bottom navigation on mobile
        }}>
            {/* Top App Bar */}
            <AppBar position="sticky" elevation={2}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        TrailTag Student
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        <Logout sx={{ mr: 1 }} />
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Desktop Navigation Tabs */}
            {!isMobile && (
                <Paper elevation={1}>
                    <Container maxWidth="lg">
                        <Tabs
                            value={bottomNavValue}
                            onChange={handleBottomNavChange}
                            variant="fullWidth"
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab
                                icon={<Home />}
                                label={t('Home')}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<QrCodeScanner />}
                                label={t('QR Scan')}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<History />}
                                label={t('History')}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Person />}
                                label={t('Profile')}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Container>
                </Paper>
            )}

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Routes>
                    <Route path="/" element={<StudentHome />} />
                    <Route path="/scanner" element={<QRScanner />} />
                    <Route path="/history" element={<CheckInHistory />} />
                    <Route path="/profile" element={<StudentProfile />} />
                </Routes>
            </Container>

            {/* Bottom Navigation for Mobile */}
            {isMobile && (
                <Paper
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000
                    }}
                    elevation={3}
                >
                    <BottomNavigation
                        value={bottomNavValue}
                        onChange={handleBottomNavChange}
                        showLabels
                    >
                        <BottomNavigationAction
                            label={t('Home')}
                            icon={<Home />}
                        />
                        <BottomNavigationAction
                            label={t('Scan')}
                            icon={<QrCodeScanner />}
                        />
                        <BottomNavigationAction
                            label={t('History')}
                            icon={<History />}
                        />
                        <BottomNavigationAction
                            label={t('Profile')}
                            icon={<Person />}
                        />
                    </BottomNavigation>
                </Paper>
            )}
        </Box>
    );
};

// Student Home Component
const StudentHome = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [todayCheckIns, setTodayCheckIns] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                // Load today's check-ins
                const todayResult = await checkInService.getTodayCheckIns();
                if (todayResult.success) {
                    setTodayCheckIns(todayResult.checkIns);
                }

                // Load basic stats
                const statsResult = await checkInService.getStudentStats(user.id);
                if (statsResult.success) {
                    setStats(statsResult.stats);
                }
            } catch (error) {
                console.error('Failed to load home data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHomeData();
    }, [user]);

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    {t('Welcome, {{name}}!', { name: user?.full_name })}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('Ready to participate in learning programs? Scan QR codes to record your participation')}
                </Typography>
            </Paper>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                        elevation={2}
                        sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}
                        onClick={() => navigate('/student/scanner')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <QrCodeScanner sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {t('QR Code Scan')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('Instant check-in to programs')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                        elevation={2}
                        sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}
                        onClick={() => navigate('/student/history')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <History sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {t('Participation History')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('View my participation history')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Today's Activity */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('Today\'s Activities')}
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress />
                    </Box>
                ) : todayCheckIns.length === 0 ? (
                    <Box textAlign="center" py={3}>
                        <Typography variant="body1" color="text.secondary">
                            {t('No programs checked in today yet')}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<QrCodeScanner />}
                            onClick={() => navigate('/student/scanner')}
                            sx={{ mt: 2 }}
                        >
                            {t('Start Scanning')}
                        </Button>
                    </Box>
                ) : (
                    <List>
                        {todayCheckIns.slice(0, 3).map((checkIn) => (
                            <ListItem key={checkIn.id}>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={checkIn.program_name}
                                    secondary={`${checkIn.qr_location || 'Unknown Location'} • ${formatTime(checkIn.check_in_time, timezone, language)}`}
                                />
                            </ListItem>
                        ))}
                        {todayCheckIns.length > 3 && (
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Button
                                            variant="text"
                                            onClick={() => navigate('/student/history')}
                                        >
                                            View all {todayCheckIns.length} check-ins today
                                        </Button>
                                    }
                                />
                            </ListItem>
                        )}
                    </List>
                )}
            </Paper>

            {/* Quick Stats */}
            {stats && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" color="primary">
                                    {stats.totalCheckIns}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total Check-ins
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" color="secondary">
                                    {stats.uniquePrograms}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Programs
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" color="success.main">
                                    {stats.recentCheckIns}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    This Week
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card elevation={1}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" color="warning.main">
                                    {todayCheckIns.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Today
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

const StudentProfile = () => {
    const ProfileEditor = React.lazy(() => import('../components/common/ProfileEditor'));

    return (
        <React.Suspense fallback={<CircularProgress />}>
            <ProfileEditor />
        </React.Suspense>
    );
};

export default StudentDashboard;
