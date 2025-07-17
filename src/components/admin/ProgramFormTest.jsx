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
    console.log('ProgramFormTest 렌더링됨:', { open, program });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5" component="h2">
                    테스트 폼 - {program ? '수정' : '생성'}
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                <Typography>
                    이것은 테스트 폼입니다.
                </Typography>
                {program && (
                    <div>
                        <Typography>프로그램 ID: {program.id}</Typography>
                        <Typography>프로그램 이름: {program.name}</Typography>
                    </div>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose}>
                    닫기
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgramFormTest;
