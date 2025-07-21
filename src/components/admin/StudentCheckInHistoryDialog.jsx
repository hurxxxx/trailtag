import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Paper
} from '@mui/material';
import {
    Close,
    History,
    Person,
    CheckCircle,
    CalendarToday
} from '@mui/icons-material';

import userManagementService from '../../services/userManagementService';
import { useUserLocale } from '../../hooks/useUserLocale';
import { formatDate, formatTime } from '../../utils/dateUtils';

const StudentCheckInHistoryDialog = ({ open, student, onClose }) => {
    const { t } = useTranslation();
    const { language, timezone } = useUserLocale();
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (open && student) {
            loadCheckInHistory();
        }
    }, [open, student, page, rowsPerPage]);

    const loadCheckInHistory = async () => {
        if (!student) return;

        try {
            setLoading(true);
            setError('');

            const params = {
                page: page + 1,
                limit: rowsPerPage
            };

            const result = await userManagementService.getStudentCheckInHistory(student.id, params);

            if (result.success) {
                setCheckIns(result.checkIns);
                setTotalCount(result.pagination?.total || 0);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError(t('An error occurred while loading check-in history'));
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClose = () => {
        setCheckIns([]);
        setError('');
        setPage(0);
        onClose();
    };

    const formatDateTime = (dateTimeString) => {
        return {
            date: formatDate(dateTimeString, timezone, language),
            time: formatTime(dateTimeString, timezone, language)
        };
    };

    if (!student) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <History color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {t('Check-in History')}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Student Info */}
                <Box sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Person color="action" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {student.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {student.username} • {student.email}
                        </Typography>
                    </Box>
                    <Chip
                        label={t('Student')}
                        color="primary"
                        size="small"
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('Program')}</TableCell>
                                        <TableCell>{t('Description')}</TableCell>
                                        <TableCell>{t('Check-in Time')}</TableCell>
                                        <TableCell align="center">{t('Status')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {checkIns.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">
                                                    {t('No check-in history')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        checkIns.map((checkIn) => {
                                            const dateTime = formatDateTime(checkIn.check_in_time);
                                            return (
                                                <TableRow key={checkIn.id} hover>
                                                    <TableCell>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {checkIn.program_name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {checkIn.program_description || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CalendarToday fontSize="small" color="action" />
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {dateTime.date}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {dateTime.time}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={<CheckCircle />}
                                                            label={t('Completed')}
                                                            color="success"
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {checkIns.length > 0 && (
                            <TablePagination
                                component="div"
                                count={totalCount}
                                page={page}
                                onPageChange={handlePageChange}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleRowsPerPageChange}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                labelRowsPerPage={t('Rows per page')}
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                            />
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={handleClose} variant="outlined">
                    {t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentCheckInHistoryDialog;
