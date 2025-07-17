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
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,

    useTheme,
    useMediaQuery,
    Avatar,
    Chip,
    Badge,
    Tooltip,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    School,
    People,
    Person,
    Logout,
    Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ProgramManagement from '../components/admin/ProgramManagement';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const menuItems = [
        { text: '대시보드', icon: <Dashboard />, path: '/admin' },
        { text: '프로그램 관리', icon: <School />, path: '/admin/programs' },
        { text: '사용자 관리', icon: <People />, path: '/admin/users' },
        { text: '프로필', icon: <Person />, path: '/admin/profile' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                            fontSize: '1.25rem',
                            fontWeight: 'bold'
                        }}
                    >
                        T
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            TrailTag
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            관리자 패널
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 메뉴 */}
            <Box sx={{ flex: 1, py: 2 }}>
                <List sx={{ px: 2 }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1.5,
                                        px: 2,
                                        bgcolor: isActive ? 'primary.main' : 'transparent',
                                        color: isActive ? 'primary.contrastText' : 'text.primary',
                                        '&:hover': {
                                            bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: isActive ? 'primary.contrastText' : 'text.secondary',
                                        minWidth: 40
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: isActive ? 600 : 500,
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            {item.text}
                                        </Typography>
                                    </ListItemText>
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* 하단 사용자 정보 */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Card sx={{ bgcolor: 'grey.50', border: 'none' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: 'secondary.main',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {user?.full_name?.charAt(0) || 'A'}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {user?.full_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    관리자
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - 240px)` },
                    ml: { md: '240px' },
                }}
            >
                <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                            TrailTag 관리자
                        </Typography>
                        <Chip
                            label="관리자"
                            size="small"
                            color="secondary"
                            sx={{ display: { xs: 'none', sm: 'flex' } }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="알림">
                            <IconButton color="inherit" size="small">
                                <Badge badgeContent={3} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'secondary.main',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {user?.full_name?.charAt(0) || 'A'}
                            </Avatar>
                            <Typography
                                variant="body2"
                                sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    fontWeight: 500,
                                    color: 'inherit'
                                }}
                            >
                                {user?.full_name}
                            </Typography>
                        </Box>

                        <Button
                            color="inherit"
                            onClick={handleLogout}
                            startIcon={<Logout />}
                            sx={{
                                ml: 1,
                                borderRadius: 2,
                                px: 2,
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
                                로그아웃
                            </Typography>
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - 240px)` },
                    mt: '64px'
                }}
            >
                <Routes>
                    <Route path="/" element={<AdminHome />} />
                    <Route path="/programs" element={<ProgramManagement />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/profile" element={<AdminProfile />} />
                </Routes>
            </Box>
        </Box>
    );
};

// 플레이스홀더 컴포넌트들 - 추후 구현 예정
const AdminHome = () => (
    <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>관리자 홈</Typography>
        <Typography>통계와 함께 관리자 대시보드 개요가 여기에 표시됩니다.</Typography>
    </Paper>
);

// ProgramManagement는 이제 컴포넌트에서 가져옴

// QRCodeManagement는 이제 컴포넌트에서 가져옴

const UserManagement = () => (
    <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>사용자 관리</Typography>
        <Typography>사용자와 역할 관리 기능이 여기에 구현될 예정입니다.</Typography>
    </Paper>
);

const AdminProfile = () => (
    <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>프로필</Typography>
        <Typography>관리자 프로필 관리 기능이 여기에 구현될 예정입니다.</Typography>
    </Paper>
);

export default AdminDashboard;
