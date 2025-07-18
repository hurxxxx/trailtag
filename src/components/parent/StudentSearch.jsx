import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Alert,
    CircularProgress,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Search,
    Person,
    Phone,
    Email,
    Add,
    Visibility,
    PersonAdd
} from '@mui/icons-material';
import browserDatabase from '../../services/browserDatabase';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const StudentSearch = ({ onStudentSelect }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [phoneSearch, setPhoneSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [myStudents, setMyStudents] = useState([]);

    // Load parent's students on component mount
    React.useEffect(() => {
        loadMyStudents();
    }, [user]);

    const loadMyStudents = async () => {
        try {
            console.log('Loading my students...');
            const response = await apiClient.getMyStudents();
            console.log('My students response:', response);

            if (response.success) {
                setMyStudents(response.students);
            } else {
                console.error('Failed to load students:', response.message);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim() && !phoneSearch.trim()) {
            setError('Please enter a name or phone number to search');
            return;
        }

        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            console.log('Searching for students with:', { name: searchTerm.trim(), phone: phoneSearch.trim() });

            // 서버 API를 통해 학생 검색
            const response = await apiClient.get('/users/students/search', {
                name: searchTerm.trim() || undefined,
                phone: phoneSearch.trim() || undefined
            });

            console.log('Search response:', response);

            if (response.success) {
                // Filter out students already connected to this parent
                const myStudentIds = myStudents.map(s => s.id);
                const filteredResults = response.students.filter(student =>
                    !myStudentIds.includes(student.id)
                );

                setSearchResults(filteredResults);

                if (filteredResults.length === 0) {
                    if (response.students.length > 0) {
                        setError('All matching students are already connected to your account');
                    } else {
                        setError('No students found matching your search criteria');
                    }
                }
            } else {
                setError(response.message || 'Search failed. Please try again.');
            }
        } catch (error) {
            console.error('Student search error:', error);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = (student) => {
        setSelectedStudent(student);
        setShowAddDialog(true);
    };

    const confirmAddStudent = async () => {
        try {
            console.log('Adding student:', selectedStudent);
            const response = await apiClient.addStudent(selectedStudent.id, 'parent');
            console.log('Add student response:', response);

            if (response.success) {
                // Refresh my students list
                await loadMyStudents();

                // Remove from search results
                setSearchResults(prev =>
                    prev.filter(s => s.id !== selectedStudent.id)
                );

                setShowAddDialog(false);
                setSelectedStudent(null);

                // Show success message
                setError('');
            } else {
                setError(response.message || 'Failed to add student. Please try again.');
            }
        } catch (error) {
            console.error('Add student error:', error);
            setError('Failed to add student. Please try again.');
        }
    };

    const handleViewStudent = (student) => {
        if (onStudentSelect) {
            onStudentSelect(student);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="primary">
                    학생 검색
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                    이름이나 전화번호로 학생을 검색하여 학습 활동을 모니터링하세요.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Search Form */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="학생 이름"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="학생의 전체 이름을 입력하세요"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="전화번호"
                            value={phoneSearch}
                            onChange={(e) => setPhoneSearch(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="전화번호를 입력하세요"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                            onClick={handleSearch}
                            disabled={loading || (!searchTerm.trim() && !phoneSearch.trim())}
                            fullWidth
                        >
                            {loading ? '검색 중...' : '학생 검색'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* My Students */}
            {myStudents.length > 0 && (
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        내 학생들 ({myStudents.length})
                    </Typography>
                    <Grid container spacing={2}>
                        {myStudents.map((student) => (
                            <Grid item xs={12} sm={6} md={4} key={student.id}>
                                <Card elevation={1}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {student.full_name}
                                        </Typography>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                {student.email}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Phone fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                {student.phone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={student.relationship_type}
                                            color="primary"
                                            size="small"
                                        />
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => handleViewStudent(student)}
                                        >
                                            View Activity
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Search Results ({searchResults.length})
                    </Typography>
                    <Grid container spacing={2}>
                        {searchResults.map((student) => (
                            <Grid item xs={12} sm={6} md={4} key={student.id}>
                                <Card elevation={1}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {student.full_name}
                                        </Typography>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                {student.email}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Phone fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                {student.phone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label="Available"
                                            color="success"
                                            size="small"
                                        />
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<Add />}
                                            onClick={() => handleAddStudent(student)}
                                            variant="contained"
                                        >
                                            Add Student
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Add Student Confirmation Dialog */}
            <Dialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Add Student
                </DialogTitle>
                <DialogContent>
                    {selectedStudent && (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                Are you sure you want to add this student to your monitoring list?
                            </Typography>

                            <Card variant="outlined" sx={{ mt: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {selectedStudent.full_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Email: {selectedStudent.email}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Phone: {selectedStudent.phone}
                                    </Typography>
                                </CardContent>
                            </Card>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                Once added, you'll be able to monitor this student's learning program participation and check-in history.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmAddStudent}
                        variant="contained"
                        startIcon={<PersonAdd />}
                    >
                        Add Student
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentSearch;
