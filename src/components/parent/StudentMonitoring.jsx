import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Avatar
} from '@mui/material';
import {
    CheckCircle,
    LocationOn,
    AccessTime,
    School,
    TrendingUp,
    Today,
    History,
    Person,
    Refresh
} from '@mui/icons-material';
import checkInService from '../../services/checkInService';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocale } from '../../hooks/useUserLocale';
import { formatDateTime } from '../../utils/dateUtils';

const StudentMonitoring = ({ selectedStudent: propSelectedStudent }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { language, timezone } = useUserLocale();
    const [selectedStudent, setSelectedStudent] = useState(propSelectedStudent);
    const [myStudents, setMyStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checkIns, setCheckIns] = useState([]);
    const [todayCheckIns, setTodayCheckIns] = useState([]);
    const [stats, setStats] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        loadMyStudents();
    }, [user]);

    useEffect(() => {
        if (selectedStudent) {
            loadStudentData();
        }
    }, [selectedStudent]);

    useEffect(() => {
        if (propSelectedStudent) {
            setSelectedStudent(propSelectedStudent);
        }
    }, [propSelectedStudent]);

    const loadMyStudents = async () => {
        try {
            console.log('Loading my students for monitoring...');
            const response = await apiClient.getMyStudents();
            console.log('My students response for monitoring:', response);

            if (response.success) {
                setMyStudents(response.students);

                // If no student is selected and we have students, select the first one
                if (!selectedStudent && response.students.length > 0) {
                    setSelectedStudent(response.students[0]);
                }
            } else {
                console.error('Failed to load students:', response.message);
                setError('Failed to load students');
            }
        } catch (error) {
            console.error('Failed to load students:', error);
            setError('Failed to load students');
        }
    };

    const loadStudentData = async () => {
        if (!selectedStudent) return;

        try {
            setLoading(true);
            setError('');

            // Load check-in history
            const historyResult = await checkInService.getStudentCheckInHistory(selectedStudent.id, 50, true);
            if (historyResult.success) {
                setCheckIns(historyResult.checkIns);
            }

            // Load today's check-ins
            const todayResult = await checkInService.getTodayCheckIns(selectedStudent.id, true);
            if (todayResult.success) {
                setTodayCheckIns(todayResult.checkIns);
            }

            // Load statistics
            const statsResult = await checkInService.getStudentStats(selectedStudent.id);
            if (statsResult.success) {
                setStats(statsResult.stats);
            }

        } catch (error) {
            setError('Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentChange = (event) => {
        const studentId = event.target.value;
        const student = myStudents.find(s => s.id === studentId);
        setSelectedStudent(student);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTimeLocalized = (dateString) => {
        return formatDateTime(dateString, timezone, language);
    };

    if (myStudents.length === 0) {
        return (
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    {t('Student Monitoring')}
                </Typography>
                <Alert severity="info">
                    {t('You have not added any students to monitor yet. Use the student search feature to find and add students')}
                </Alert>
            </Paper>
        );
    }

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    {t('Student Monitoring')}
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                    {t('Monitor student participation and activities in learning programs')}
                </Typography>

                {/* Student Selector */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>{t('Select Student')}</InputLabel>
                        <Select
                            value={selectedStudent?.id || ''}
                            onChange={handleStudentChange}
                            label={t('Select Student')}
                        >
                            {myStudents.map((student) => (
                                <MenuItem key={student.id} value={student.id}>
                                    {student.full_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadStudentData}
                        disabled={loading || !selectedStudent}
                    >
                        {t('Refresh')}
                    </Button>
                </Box>

                {/* Selected Student Info */}
                {selectedStudent && (
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <Person />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6">
                                        {selectedStudent.full_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedStudent.email} • {selectedStudent.phone}
                                    </Typography>
                                </Box>
                                <Box sx={{ ml: 'auto' }}>
                                    <Chip
                                        label={selectedStudent.relationship_type}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : selectedStudent && (
                <Box>
                    {/* Statistics Cards */}
                    {stats && (
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card elevation={2}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <CheckCircle sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                        <Typography variant="h4" component="div" color="primary">
                                            {stats.totalCheckIns}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Check-ins
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card elevation={2}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <School sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                                        <Typography variant="h4" component="div" color="secondary">
                                            {stats.uniquePrograms}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Programs Visited
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card elevation={2}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                        <Typography variant="h4" component="div" color="success.main">
                                            {stats.recentCheckIns}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            This Week
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card elevation={2}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Today sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                        <Typography variant="h4" component="div" color="warning.main">
                                            {todayCheckIns.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Today
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Most Visited Programs */}
                    {stats?.mostVisitedPrograms && stats.mostVisitedPrograms.length > 0 && (
                        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Most Visited Programs
                            </Typography>
                            <Grid container spacing={2}>
                                {stats.mostVisitedPrograms.map((program, index) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {program.program_name}
                                                </Typography>
                                                <Chip
                                                    label={`${program.visit_count} visits`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    )}

                    {/* Activity Tabs */}
                    <Paper elevation={2}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab
                                icon={<Today />}
                                label={`Today (${todayCheckIns.length})`}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<History />}
                                label={`All History (${checkIns.length})`}
                                iconPosition="start"
                            />
                        </Tabs>

                        <Box sx={{ p: 3 }}>
                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Today's Activity
                                    </Typography>

                                    {todayCheckIns.length === 0 ? (
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="body1" color="text.secondary">
                                                No check-ins today.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List>
                                            {todayCheckIns.map((checkIn, index) => (
                                                <React.Fragment key={checkIn.id}>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircle color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={checkIn.program_name}
                                                            secondary={
                                                                <Box>
                                                                    <Typography variant="body2" component="span">
                                                                        {checkIn.qr_location} • {formatTime(checkIn.check_in_time)}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <Chip
                                                            label="Today"
                                                            color="primary"
                                                            size="small"
                                                        />
                                                    </ListItem>
                                                    {index < todayCheckIns.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Complete History
                                    </Typography>

                                    {checkIns.length === 0 ? (
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="body1" color="text.secondary">
                                                No check-ins recorded yet.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List>
                                            {checkIns.slice(0, 20).map((checkIn, index) => (
                                                <React.Fragment key={checkIn.id}>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CheckCircle color="success" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={checkIn.program_name}
                                                            secondary={
                                                                <Box>
                                                                    <Typography variant="body2" component="div">
                                                                        <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                                        {checkIn.qr_location}
                                                                    </Typography>
                                                                    <Typography variant="body2" component="div">
                                                                        <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                                        {formatDateTimeLocalized(checkIn.check_in_time)}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {index < Math.min(checkIns.length, 20) - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                            {checkIns.length > 20 && (
                                                <ListItem>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                                                Showing latest 20 check-ins of {checkIns.length} total
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default StudentMonitoring;
