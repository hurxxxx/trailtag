import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
        const actionText = action === 'created' ? t('created') : action === 'updated' ? t('updated') : t('processed');
        setSnackbar({
            open: true,
            message: t('Program has been successfully {{action}}!', { action: actionText }),
            severity: 'success'
        });
    };



    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    useEffect(() => {
        console.log('ProgramManagement state change:', {
            showProgramForm,
            selectedProgram,
            refreshTrigger
        });
    }, [showProgramForm, selectedProgram, refreshTrigger]);

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    {t('Program Management')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('Create and manage learning programs with rich content and QR code integration')}
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
