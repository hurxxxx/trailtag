import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Search,
    Add,
    Refresh,
    VpnKey,
    History,
    PersonAdd,
    Delete,
    School,
    FamilyRestroom,
    AdminPanelSettings,
    Person,
    Group
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';
import CreateAdminDialog from './CreateAdminDialog';
import CreateUserDialog from './CreateUserDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import StudentCheckInHistoryDialog from './StudentCheckInHistoryDialog';
import DeleteUserDialog from './DeleteUserDialog';

const UserManagement = () => {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filters and pagination
    const [search, setSearch] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Dialog states
    const [createAdminOpen, setCreateAdminOpen] = useState(false);
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [checkInHistoryOpen, setCheckInHistoryOpen] = useState(false);
    const [deleteUserOpen, setDeleteUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, [page, rowsPerPage, userTypeFilter, search]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const filters = {
                page: page + 1,
                limit: rowsPerPage
            };

            if (userTypeFilter) {
                filters.userType = userTypeFilter;
            }

            if (search.trim()) {
                filters.search = search.trim();
            }

            const result = await userManagementService.getAllUsers(filters);

            if (result.success) {
                setUsers(result.users);
                setTotalCount(result.pagination?.total || 0);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(t('An error occurred while loading user list'));
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setUserTypeFilter(newValue === 0 ? '' : ['admin', 'student', 'parent'][newValue - 1]);
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(0);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCreateAdmin = () => {
        setCreateAdminOpen(true);
    };

    const handleCreateUser = () => {
        setCreateUserOpen(true);
    };

    const handleResetPassword = (user) => {
        setSelectedUser(user);
        setResetPasswordOpen(true);
    };

    const handleViewCheckInHistory = (user) => {
        setSelectedUser(user);
        setCheckInHistoryOpen(true);
    };

    const handleDeleteUser = (user) => {
        setSelectedUser(user);
        setDeleteUserOpen(true);
    };

    const handleCreateAdminSuccess = () => {
        setCreateAdminOpen(false);
        setSuccess('관리자 계정이 성공적으로 생성되었습니다');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCreateUserSuccess = (message) => {
        setCreateUserOpen(false);
        setSuccess(message);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleResetPasswordSuccess = () => {
        setResetPasswordOpen(false);
        setSelectedUser(null);
        setSuccess('비밀번호가 성공적으로 변경되었습니다');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDeleteUserSuccess = (message) => {
        setDeleteUserOpen(false);
        setSelectedUser(null);
        setSuccess(message);
        loadUsers(); // Reload users list
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCloseDialogs = () => {
        setCreateAdminOpen(false);
        setCreateUserOpen(false);
        setResetPasswordOpen(false);
        setCheckInHistoryOpen(false);
        setDeleteUserOpen(false);
        setSelectedUser(null);
    };

    const getUserTypeColor = (userType) => {
        const colors = {
            'admin': 'error',
            'student': 'primary',
            'parent': 'success'
        };
        return colors[userType] || 'default';
    };

    const formatUserType = (userType) => {
        const types = {
            'admin': '관리자',
            'student': '학생',
            'parent': '부모'
        };
        return types[userType] || userType;
    };

    const getUserTypeIcon = (userType) => {
        switch (userType) {
            case 'admin':
                return <AdminPanelSettings fontSize="small" />;
            case 'student':
                return <School fontSize="small" />;
            case 'parent':
                return <FamilyRestroom fontSize="small" />;
            default:
                return <Person fontSize="small" />;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {t('User Management')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<PersonAdd />}
                            onClick={handleCreateAdmin}
                            sx={{ textTransform: 'none' }}
                        >
                            {t('Create Admin')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<School />}
                            onClick={handleCreateUser}
                            sx={{ textTransform: 'none' }}
                            color="success"
                        >
                            {t('Create Student/Parent')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={loadUsers}
                            disabled={loading}
                            sx={{ textTransform: 'none' }}
                        >
                            {t('Refresh')}
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label={t('All')} />
                        <Tab label={t('Admin')} />
                        <Tab label={t('Student')} />
                        <Tab label={t('Parent')} />
                    </Tabs>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        placeholder={t('Search by username, name, email...')}
                        value={search}
                        onChange={handleSearchChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('Username')}</TableCell>
                                <TableCell>{t('Name')}</TableCell>
                                <TableCell>{t('Email')}</TableCell>
                                <TableCell>{t('Phone Number')}</TableCell>
                                <TableCell>{t('Type')}</TableCell>
                                <TableCell>{t('Created Date')}</TableCell>
                                <TableCell align="center">{t('Actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {t('No users found')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getUserTypeIcon(user.user_type)}
                                                label={formatUserType(user.user_type)}
                                                color={getUserTypeColor(user.user_type)}
                                                size="small"
                                                variant="filled"
                                                sx={{
                                                    fontWeight: 'medium',
                                                    '& .MuiChip-icon': {
                                                        color: 'inherit'
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {(user.user_type === 'student' || user.user_type === 'parent') && (
                                                    <Tooltip title="비밀번호 변경">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleResetPassword(user)}
                                                        >
                                                            <VpnKey fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {user.user_type === 'student' && (
                                                    <Tooltip title="체크인 이력">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewCheckInHistory(user)}
                                                        >
                                                            <History fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="사용자 삭제">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteUser(user)}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="페이지당 행 수:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
            </Paper>

            {/* Dialogs */}
            <CreateAdminDialog
                open={createAdminOpen}
                onClose={handleCloseDialogs}
                onSuccess={handleCreateAdminSuccess}
            />

            <CreateUserDialog
                open={createUserOpen}
                onClose={handleCloseDialogs}
                onSuccess={handleCreateUserSuccess}
            />

            <ResetPasswordDialog
                open={resetPasswordOpen}
                user={selectedUser}
                onClose={handleCloseDialogs}
                onSuccess={handleResetPasswordSuccess}
            />

            <StudentCheckInHistoryDialog
                open={checkInHistoryOpen}
                student={selectedUser}
                onClose={handleCloseDialogs}
            />

            <DeleteUserDialog
                open={deleteUserOpen}
                user={selectedUser}
                onClose={handleCloseDialogs}
                onSuccess={handleDeleteUserSuccess}
            />
        </Box>
    );
};

export default UserManagement;
