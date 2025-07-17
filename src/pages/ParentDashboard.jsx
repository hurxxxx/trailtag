import React, { useState } from 'react';
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
    CircularProgress,
    Chip
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
import browserDatabase from '../services/browserDatabase';

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [bottomNavValue, setBottomNavValue] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);

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
                        TrailTag Parent
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        <Logout sx={{ mr: 1 }} />
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

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
                            label="Home"
                            icon={<Home />}
                        />
                        <BottomNavigationAction
                            label="Search"
                            icon={<Search />}
                        />
                        <BottomNavigationAction
                            label="Monitor"
                            icon={<Visibility />}
                        />
                        <BottomNavigationAction
                            label="Profile"
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
        const loadStudents = () => {
            try {
                const students = browserDatabase.getStudentsByParentId(user.id);
                setMyStudents(students);
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
                    Welcome, {user?.full_name}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Monitor your students' learning program participation and activities.
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
                        onClick={() => navigate('/parent/search')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Search sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Find Students
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Search and add students to monitor
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
                        onClick={() => navigate('/parent/monitoring')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <TrendingUp sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Monitor Activity
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View student participation history
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* My Students */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    My Students ({myStudents.length})
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress />
                    </Box>
                ) : myStudents.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No students added yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Search for students to start monitoring their learning activities.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={() => navigate('/parent/search')}
                        >
                            Find Students
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {myStudents.map((student) => (
                            <Grid item xs={12} sm={6} md={4} key={student.id}>
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
                                                Monitor
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

const ParentProfile = () => (
    <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Profile</Typography>
        <Typography>Parent profile management will be implemented here.</Typography>
    </Paper>
);

export default ParentDashboard;
