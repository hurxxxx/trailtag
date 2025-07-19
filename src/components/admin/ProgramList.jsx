import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Grid,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Alert,
    CircularProgress,
    TextField,
    InputAdornment,
    Fab,
    Avatar,
    Tooltip,
    Fade,
    CardHeader
} from '@mui/material';
import {
    MoreVert,
    Edit,
    Delete,
    QrCode,
    Search,
    Add,
    LocationOn,
    Person,
    AccessTime,
    School
} from '@mui/icons-material';
import programService from '../../services/programService';
import qrCodeService from '../../services/qrCodeService';
import { useAuth } from '../../contexts/AuthContext';
import QRCodeDialog from './QRCodeDialog';

const ProgramList = ({ onEditProgram, onCreateProgram, refreshTrigger }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [programQRCodes, setProgramQRCodes] = useState({}); // 프로그램별 QR 코드 정보 (1:1)
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [selectedProgramForQR, setSelectedProgramForQR] = useState(null);

    // Load QR code for each program (1:1 relationship)
    const loadProgramQRCodes = async (programList) => {
        const qrInfo = {};
        for (const program of programList) {
            try {
                const result = await qrCodeService.getQRCodesByProgram(program.id);
                if (result.success && result.qrCodes.length > 0) {
                    qrInfo[program.id] = result.qrCodes[0]; // 유일한 QR 코드
                } else {
                    qrInfo[program.id] = null;
                }
            } catch (error) {
                qrInfo[program.id] = null;
            }
        }
        setProgramQRCodes(qrInfo);
    };

    // Load programs
    const loadPrograms = async () => {
        try {
            setLoading(true);
            console.log('Loading programs...');
            const result = await programService.getAllPrograms();
            console.log('Program service result:', result);

            if (result.success) {
                setPrograms(result.programs);
                setError('');
                console.log('프로그램 로드 성공:', result.programs);

                // Load QR codes for each program
                await loadProgramQRCodes(result.programs);
            } else {
                setError(result.message);
                console.error('프로그램 로드 실패:', result.message);
            }
        } catch (error) {
            console.error('프로그램 로드 오류:', error);
            setError('프로그램을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, [refreshTrigger]);

    // Filter programs based on search term
    const filteredPrograms = programs.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (program.location && program.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleMenuOpen = (event, program) => {
        setAnchorEl(event.currentTarget);
        setSelectedProgram(program);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedProgram(null);
    };

    const handleEdit = () => {
        console.log('ProgramList handleEdit clicked:', selectedProgram);
        if (selectedProgram && onEditProgram) {
            console.log('Calling onEditProgram with:', selectedProgram);
            onEditProgram(selectedProgram);
        } else {
            console.log('No selectedProgram or onEditProgram callback');
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedProgram) {
            try {
                const result = await programService.deleteProgram(selectedProgram.id, user.id);
                if (result.success) {
                    await loadPrograms(); // Refresh the list
                } else {
                    setError(result.message);
                }
            } catch (error) {
                setError('프로그램 삭제에 실패했습니다');
            }
        }
        handleMenuClose();
    };

    const handleManageQRCodes = async (program) => {
        setSelectedProgramForQR(program);

        // QR 코드가 아직 로드되지 않았다면 로드
        if (programQRCodes[program.id] === undefined) {
            try {
                const result = await qrCodeService.getQRCodesByProgram(program.id);
                if (result.success && result.qrCodes.length > 0) {
                    setProgramQRCodes(prev => ({
                        ...prev,
                        [program.id]: result.qrCodes[0]
                    }));
                } else {
                    setProgramQRCodes(prev => ({
                        ...prev,
                        [program.id]: null
                    }));
                }
            } catch (error) {
                setProgramQRCodes(prev => ({
                    ...prev,
                    [program.id]: null
                }));
            }
        }

        setShowQRDialog(true);
    };

    const handleQRDialogClose = () => {
        setShowQRDialog(false);
        setSelectedProgramForQR(null);
    };

    const handleQRSuccess = (qrCode) => {
        // QR 코드 생성 성공 시 목록 업데이트
        setProgramQRCodes(prev => ({
            ...prev,
            [selectedProgramForQR.id]: qrCode
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
                sx={{ textAlign: 'center' }}
            >
                <CircularProgress size={48} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
                    프로그램을 불러오는 중...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    잠시만 기다려주세요
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* 헤더 및 검색 */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            프로그램 목록
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            총 {programs.length}개의 프로그램이 있습니다
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={onCreateProgram}
                        sx={{
                            borderRadius: 1,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }
                        }}
                    >
                        새 프로그램 생성
                    </Button>
                </Box>

                <TextField
                    fullWidth
                    placeholder="프로그램 이름, 설명, 위치로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search color="action" />
                                </InputAdornment>
                            ),
                        }
                    }}
                    sx={theme.mixins.searchField}
                />
            </Box>

            {/* Programs Grid */}
            {filteredPrograms.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        py: 8,
                        textAlign: 'center',
                        bgcolor: 'grey.50'
                    }}
                >
                    <CardContent>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'primary.main',
                                mx: 'auto',
                                mb: 3,
                                fontSize: '2rem'
                            }}
                        >
                            <School />
                        </Avatar>

                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                            {searchTerm ? '검색 결과가 없습니다' : '프로그램이 없습니다'}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                            {searchTerm
                                ? '다른 검색어로 다시 시도해보세요'
                                : '첫 번째 학습 프로그램을 생성하여 시작해보세요'
                            }
                        </Typography>

                        {!searchTerm && (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Add />}
                                onClick={onCreateProgram}
                                sx={{
                                    borderRadius: 1,
                                    px: 4,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                첫 프로그램 생성하기
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {filteredPrograms.map((program) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={program.id}>
                            <Fade in timeout={300 + program.id * 100}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        borderRadius: 1,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <CardHeader
                                        avatar={
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    width: 40,
                                                    height: 40,
                                                    fontSize: '1rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {program.name.charAt(0)}
                                            </Avatar>
                                        }
                                        action={
                                            <Tooltip title="더 보기">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, program)}
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                            transform: 'scale(1.1)'
                                                        },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Tooltip>
                                        }
                                        title={
                                            <Typography
                                                variant="h6"
                                                component="h3"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '1.1rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {program.name}
                                            </Typography>
                                        }
                                        subheader={
                                            program.location && (
                                                <Box display="flex" alignItems="center" mt={0.5}>
                                                    <LocationOn fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary" ml={0.5}>
                                                        {program.location}
                                                    </Typography>
                                                </Box>
                                            )
                                        }
                                        sx={{ pb: 1 }}
                                    />

                                    <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                                        {program.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 3,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.5
                                                }}
                                            >
                                                {stripHtml(program.description)}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                            <Chip
                                                icon={<Person />}
                                                label={program.creator_name}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.75rem' }}
                                            />
                                            <Chip
                                                icon={<AccessTime />}
                                                label={formatDate(program.created_at)}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.75rem' }}
                                            />
                                        </Box>
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<QrCode />}
                                            onClick={() => handleManageQRCodes(program)}
                                            sx={{
                                                borderRadius: 1,
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                flex: 1
                                            }}
                                        >
                                            QR 보기
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Edit />}
                                            onClick={() => onEditProgram && onEditProgram(program)}
                                            sx={{
                                                borderRadius: 1,
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                flex: 1
                                            }}
                                        >
                                            수정
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Fade>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>
                    <Edit fontSize="small" sx={{ mr: 1 }} />
                    프로그램 수정
                </MenuItem>
                <MenuItem onClick={() => handleManageQRCodes(selectedProgram)}>
                    <QrCode fontSize="small" sx={{ mr: 1 }} />
                    QR 코드 관리
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    프로그램 삭제
                </MenuItem>
            </Menu>

            {/* Floating Action Button for mobile */}
            <Fab
                color="primary"
                aria-label="add program"
                onClick={onCreateProgram}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', sm: 'none' }
                }}
            >
                <Add />
            </Fab>

            {/* QR 코드 다이얼로그 */}
            <QRCodeDialog
                open={showQRDialog}
                onClose={handleQRDialogClose}
                program={selectedProgramForQR}
                qrCode={selectedProgramForQR ? programQRCodes[selectedProgramForQR.id] : null}
                onSuccess={handleQRSuccess}
            />
        </Box>
    );
};

export default ProgramList;
