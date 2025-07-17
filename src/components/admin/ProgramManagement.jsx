import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import ProgramList from './ProgramList';
import ProgramForm from './ProgramForm';

const ProgramManagement = () => {
    const navigate = useNavigate();
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [showProgramForm, setShowProgramForm] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCreateProgram = () => {
        setSelectedProgram(null);
        setShowProgramForm(true);
    };

    const handleEditProgram = (program) => {
        console.log('ProgramManagement handleEditProgram called with:', program);
        setSelectedProgram(program);
        setShowProgramForm(true);
        console.log('Set selectedProgram and showProgramForm to true');
    };

    const handleProgramFormClose = () => {
        setShowProgramForm(false);
        setSelectedProgram(null);
    };

    const handleProgramSuccess = (program, action) => {
        setRefreshTrigger(prev => prev + 1);
        const actionText = action === 'created' ? '생성' : action === 'updated' ? '수정' : '처리';
        setSnackbar({
            open: true,
            message: `프로그램이 성공적으로 ${actionText}되었습니다!`,
            severity: 'success'
        });
    };



    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // 상태 변화 추적
    useEffect(() => {
        console.log('ProgramManagement 상태 변화:', {
            showProgramForm,
            selectedProgram,
            refreshTrigger
        });
    }, [showProgramForm, selectedProgram, refreshTrigger]);

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    프로그램 관리
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    풍부한 콘텐츠와 QR 코드 통합을 통해 학습 프로그램을 생성하고 관리합니다.
                </Typography>
            </Paper>

            <ProgramList
                onEditProgram={handleEditProgram}
                onCreateProgram={handleCreateProgram}
                refreshTrigger={refreshTrigger}
            />

            <ProgramForm
                open={showProgramForm}
                onClose={handleProgramFormClose}
                program={selectedProgram}
                onSuccess={handleProgramSuccess}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProgramManagement;
