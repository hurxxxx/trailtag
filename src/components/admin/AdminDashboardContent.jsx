import React, { useState, useEffect } from 'react';
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
    Chip,
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
    Settings,
    Timeline
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import adminDashboardService from '../../services/adminDashboardService';

const AdminDashboardContent = () => {
    const { user } = useAuth();
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
            setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다');
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
                    안녕하세요, {user?.full_name}님! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    TrailTag 관리자 대시보드에 오신 것을 환영합니다.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="전체 사용자"
                        value={stats?.totalUsers || 0}
                        icon={<People />}
                        color="primary"
                        subtitle={`관리자 ${stats?.adminCount || 0} | 학생 ${stats?.studentCount || 0} | 부모 ${stats?.parentCount || 0}`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="활성 프로그램"
                        value={stats?.activePrograms || 0}
                        icon={<School />}
                        color="success"
                        subtitle="현재 운영 중인 프로그램"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="오늘 체크인"
                        value={stats?.todayCheckIns || 0}
                        icon={<CheckCircle />}
                        color="info"
                        subtitle="오늘 발생한 체크인"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="이번 주 체크인"
                        value={stats?.weekCheckIns || 0}
                        icon={<TrendingUp />}
                        color="warning"
                        subtitle="지난 7일간 체크인"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Quick Actions */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            빠른 작업
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <QuickActionCard
                                    title="프로그램 생성"
                                    description="새로운 학습 프로그램을 만들어보세요"
                                    icon={<Add />}
                                    onClick={() => window.location.href = '/admin/programs'}
                                    color="primary"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <QuickActionCard
                                    title="관리자 추가"
                                    description="새로운 관리자 계정을 생성하세요"
                                    icon={<PersonAdd />}
                                    onClick={() => window.location.href = '/admin/users'}
                                    color="success"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <QuickActionCard
                                    title="사용자 관리"
                                    description="사용자 계정을 관리하세요"
                                    icon={<People />}
                                    onClick={() => window.location.href = '/admin/users'}
                                    color="info"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <QuickActionCard
                                    title="시스템 설정"
                                    description="시스템 설정을 변경하세요"
                                    icon={<Settings />}
                                    onClick={() => alert('시스템 설정 기능은 준비 중입니다')}
                                    color="warning"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            최근 활동
                        </Typography>
                        {recentActivity.length === 0 ? (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                최근 활동이 없습니다
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
                                            />
                                        </ListItem>
                                        {index < recentActivity.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button variant="outlined" size="small">
                                모든 활동 보기
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboardContent;
