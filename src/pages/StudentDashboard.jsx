import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    AppBar,
    Toolbar,
    IconButton,
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
    CircularProgress
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
import QRScanner from '../components/student/QRScanner';
import CheckInHistory from '../components/student/CheckInHistory';
import checkInService from '../services/checkInService';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [bottomNavValue, setBottomNavValue] = useState(0);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const handleBottomNavChange = (event, newValue) => {
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
                            label="홈"
                            icon={<Home />}
                        />
                        <BottomNavigationAction
                            label="스캔"
                            icon={<QrCodeScanner />}
                        />
                        <BottomNavigationAction
                            label="기록"
                            icon={<History />}
                        />
                        <BottomNavigationAction
                            label="프로필"
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
    const navigate = useNavigate();
    const [todayCheckIns, setTodayCheckIns] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                // Load today's check-ins
                const todayResult = await checkInService.getTodayCheckIns(user.id);
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
                    환영합니다, {user?.full_name}님!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    학습 프로그램에 참여할 준비가 되셨나요? QR 코드를 스캔하여 참여를 기록하세요.
                </Typography>
            </Paper>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
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
                                QR 코드 스캔
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                프로그램에 즉시 체크인
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
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
                                참여 기록
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                나의 참여 기록 보기
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Today's Activity */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    오늘의 활동
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress />
                    </Box>
                ) : todayCheckIns.length === 0 ? (
                    <Box textAlign="center" py={3}>
                        <Typography variant="body1" color="text.secondary">
                            아직 오늘 체크인한 프로그램이 없습니다.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<QrCodeScanner />}
                            onClick={() => navigate('/student/scanner')}
                            sx={{ mt: 2 }}
                        >
                            스캔 시작하기
                        </Button>
                    </Box>
                ) : (
                    <List>
                        {todayCheckIns.slice(0, 3).map((checkIn, index) => (
                            <ListItem key={checkIn.id}>
                                <ListItemIcon>
                                    <CheckCircle color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={checkIn.program_name}
                                    secondary={`${checkIn.qr_location} • ${new Date(checkIn.check_in_time).toLocaleTimeString()}`}
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
                    <Grid item xs={6} sm={3}>
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
                    <Grid item xs={6} sm={3}>
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
                    <Grid item xs={6} sm={3}>
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
                    <Grid item xs={6} sm={3}>
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

const StudentProfile = () => (
    <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Profile</Typography>
        <Typography>Student profile management will be implemented here.</Typography>
    </Paper>
);

export default StudentDashboard;
