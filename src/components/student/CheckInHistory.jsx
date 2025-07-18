import React, { useState, useEffect } from 'react';
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
    Tabs,
    Tab
} from '@mui/material';
import {
    CheckCircle,
    LocationOn,
    AccessTime,
    School,
    TrendingUp,
    Today,
    History
} from '@mui/icons-material';
import checkInService from '../../services/checkInService';
import { useAuth } from '../../contexts/AuthContext';

const CheckInHistory = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checkIns, setCheckIns] = useState([]);
    const [todayCheckIns, setTodayCheckIns] = useState([]);
    const [stats, setStats] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Load check-in history
            const historyResult = await checkInService.getStudentCheckInHistory();
            if (historyResult.success) {
                setCheckIns(historyResult.checkIns);
            }

            // Load today's check-ins
            const todayResult = await checkInService.getTodayCheckIns();
            if (todayResult.success) {
                setTodayCheckIns(todayResult.checkIns);
            }

            // Load statistics
            const statsResult = await checkInService.getStudentStats(user.id);
            if (statsResult.success) {
                setStats(statsResult.stats);
            }

        } catch (error) {
            setError('Failed to load check-in data');
        } finally {
            setLoading(false);
        }
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

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    Check-in History
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View your participation history and statistics.
                </Typography>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <LocationOn sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                <Typography variant="h4" component="div" color="success.main">
                                    {stats.uniqueLocations}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Unique Locations
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                <Typography variant="h4" component="div" color="warning.main">
                                    {stats.recentCheckIns}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This Week
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
                            <Grid item xs={12} sm={6} md={4} key={index}>
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

            {/* Tabs for Today vs All History */}
            <Paper elevation={2} sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<Today />}
                        label="Today"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<History />}
                        label="All History"
                        iconPosition="start"
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Today's Check-ins ({todayCheckIns.length})
                            </Typography>

                            {todayCheckIns.length === 0 ? (
                                <Box textAlign="center" py={4}>
                                    <Typography variant="body1" color="text.secondary">
                                        No check-ins today yet.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Scan a QR code to check into a program!
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
                                All Check-ins ({checkIns.length})
                            </Typography>

                            {checkIns.length === 0 ? (
                                <Box textAlign="center" py={4}>
                                    <Typography variant="body1" color="text.secondary">
                                        No check-ins recorded yet.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Start participating in programs to build your history!
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {checkIns.map((checkIn, index) => (
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
                                                                {formatDateTime(checkIn.check_in_time)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < checkIns.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Refresh Button */}
            <Box textAlign="center">
                <Button
                    variant="outlined"
                    onClick={loadData}
                    disabled={loading}
                >
                    Refresh Data
                </Button>
            </Box>
        </Box>
    );
};

export default CheckInHistory;
