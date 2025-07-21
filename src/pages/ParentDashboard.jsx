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
    IconButton,
    Button,
    BottomNavigation,
    BottomNavigationAction,
    useTheme,
    useMediaQuery,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import {
    Search,
    Visibility,
    Home,
    Person,
    Logout,
    People,
    TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import StudentSearch from '../components/parent/StudentSearch';
import StudentMonitoring from '../components/parent/StudentMonitoring';
import apiClient from '../services/apiClient';

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { t } = useTranslation();
    const [bottomNavValue, setBottomNavValue] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Set tab value based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path === '/parent' || path === '/parent/') {
            setBottomNavValue(0);
        } else if (path === '/parent/search') {
            setBottomNavValue(1);
        } else if (path === '/parent/monitoring') {
            setBottomNavValue(2);
        } else if (path === '/parent/profile') {
            setBottomNavValue(3);
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const handleBottomNavChange = (event, newValue) => {
        setBottomNavValue(newValue);
        switch (newValue) {
            case 0:
                navigate('/parent');
                break;
            case 1:
                navigate('/parent/search');
                break;
            case 2:
                navigate('/parent/monitoring');
                break;
            case 3:
                navigate('/parent/profile');
                break;
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        navigate('/parent/monitoring');
        setBottomNavValue(2);
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
                        {t('TrailTag Parent')}
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        <Logout sx={{ mr: 1 }} />
                        {t('Logout')}
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
                                icon={<Search />}
                                label={t('Student Search')}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Visibility />}
                                label={t('Activity History')}
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
                    <Route path="/" element={<ParentHome onStudentSelect={handleStudentSelect} />} />
                    <Route path="/search" element={<StudentSearch onStudentSelect={handleStudentSelect} />} />
                    <Route path="/monitoring" element={<StudentMonitoring selectedStudent={selectedStudent} />} />
                    <Route path="/profile" element={<ParentProfile />} />
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
                            label={t('Search')}
                            icon={<Search />}
                        />
                        <BottomNavigationAction
                            label={t('Monitoring')}
                            icon={<Visibility />}
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

// Parent Home Component
const ParentHome = ({ onStudentSelect }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myStudents, setMyStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const loadStudents = async () => {
            try {
                console.log('Loading my students for parent home...');
                const response = await apiClient.getMyStudents();
                console.log('My students response for parent home:', response);

                if (response.success) {
                    setMyStudents(response.students);
                } else {
                    console.error('Failed to load students:', response.message);
                }
            } catch (error) {
                console.error('Failed to load students:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStudents();
    }, [user]);

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    {t('Welcome, {{name}}!', { name: user?.full_name })}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('Monitor your child\'s learning program participation and activities')}
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
                        onClick={() => navigate('/parent/search')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Search sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {t('Find Students')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('Search and add students to monitor')}
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
                        onClick={() => navigate('/parent/monitoring')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <TrendingUp sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {t('Activity Monitoring')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('Check student participation records')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* My Students */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('My Students (Total: {{count}})', { count: myStudents.length })}
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress />
                    </Box>
                ) : myStudents.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('No students added yet')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            {t('Search for students to start monitoring their learning activities.')}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={() => navigate('/parent/search')}
                        >
                            {t('Find Students')}
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {myStudents.map((student) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={student.id}>
                                <Card
                                    elevation={1}
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-2px)' }
                                    }}
                                    onClick={() => onStudentSelect && onStudentSelect(student)}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {student.full_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={1}>
                                            {student.email}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            {student.phone}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Chip
                                                label={student.relationship_type}
                                                color="primary"
                                                size="small"
                                            />
                                            <Button
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onStudentSelect && onStudentSelect(student);
                                                }}
                                            >
                                                {t('Monitor')}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

const ParentProfile = () => {
    const ProfileEditor = React.lazy(() => import('../components/common/ProfileEditor'));

    return (
        <React.Suspense fallback={<CircularProgress />}>
            <ProfileEditor />
        </React.Suspense>
    );
};

export default ParentDashboard;
