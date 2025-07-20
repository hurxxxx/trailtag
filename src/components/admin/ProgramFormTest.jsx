import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';

const ProgramFormTest = ({ open, onClose, program }) => {
    console.log('ProgramFormTest rendered:', { open, program });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5" component="h2">
                    Test Form - {program ? 'Edit' : 'Create'}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Typography>
                    This is a test form.
                </Typography>
                {program && (
                    <div>
                        <Typography>Program ID: {program.id}</Typography>
                        <Typography>Program Name: {program.name}</Typography>
                    </div>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgramFormTest;
