import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    People,
    School,
    CheckCircle,
    TrendingUp,
    PersonAdd,
    Add,
    Settings
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import adminDashboardService from '../../services/adminDashboardService';

const AdminDashboardContent = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsResult, activityResult] = await Promise.all([
                adminDashboardService.getDashboardStats(),
                adminDashboardService.getRecentActivity()
            ]);

            if (statsResult.success) {
                setStats(statsResult.stats);
            }

            if (activityResult.success) {
                setRecentActivity(activityResult.activities);
            }

        } catch (error) {
            setError(t('An error occurred while loading dashboard data'));
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="h6">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: `${color}.main` }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const QuickActionCard = ({ title, description, icon, onClick, color = 'primary' }) => (
        <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: `${color}.main`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    {icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('Hello, {{name}}! 👋', { name: user?.full_name })}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('Welcome to the TrailTag Admin Dashboard.')}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title={t('Total Users')}
                        value={stats?.totalUsers || 0}
                        icon={<People />}
                        color="primary"
                        subtitle={t('Admin {{admin}} | Student {{student}} | Parent {{parent}}', {
                            admin: stats?.adminCount || 0,
                            student: stats?.studentCount || 0,
                            parent: stats?.parentCount || 0
                        })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title={t('Active Programs')}
                        value={stats?.activePrograms || 0}
                        icon={<School />}
                        color="success"
                        subtitle={t('Currently running programs')}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title={t('Today Check-ins')}
                        value={stats?.todayCheckIns || 0}
                        icon={<CheckCircle />}
                        color="info"
                        subtitle={t('Check-ins occurred today')}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title={t('This Week Check-ins')}
                        value={stats?.weekCheckIns || 0}
                        icon={<TrendingUp />}
                        color="warning"
                        subtitle={t('Check-ins in the last 7 days')}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Quick Actions */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            {t('Quick Actions')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <QuickActionCard
                                    title={t('Create Program')}
                                    description={t('Create a new learning program')}
                                    icon={<Add />}
                                    onClick={() => window.location.href = '/admin/programs'}
                                    color="primary"
                                />
                            </Grid>
                            <Grid size={6}>
                                <QuickActionCard
                                    title={t('Add Admin')}
                                    description={t('Create new admin account')}
                                    icon={<PersonAdd />}
                                    onClick={() => window.location.href = '/admin/users'}
                                    color="success"
                                />
                            </Grid>
                            <Grid size={6}>
                                <QuickActionCard
                                    title={t('User Management')}
                                    description={t('Manage user accounts')}
                                    icon={<People />}
                                    onClick={() => window.location.href = '/admin/users'}
                                    color="info"
                                />
                            </Grid>
                            <Grid size={6}>
                                <QuickActionCard
                                    title={t('System Settings')}
                                    description={t('Change system settings')}
                                    icon={<Settings />}
                                    onClick={() => alert(t('System settings feature is under development'))}
                                    color="warning"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            {t('Recent Activity')}
                        </Typography>
                        {recentActivity.length === 0 ? (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                {t('No recent activity')}
                            </Typography>
                        ) : (
                            <List>
                                {recentActivity.slice(0, 5).map((activity, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    <CheckCircle />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={activity.title}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {activity.description}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {activity.time}
                                                        </Typography>
                                                    </Box>
                                                }
                                                slotProps={{ secondary: { component: 'div' } }}
                                            />
                                        </ListItem>
                                        {index < recentActivity.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button variant="outlined" size="small">
                                {t('View All Activities')}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboardContent;
