import browserDatabase from './browserDatabase.js';
import qrCodeService from './qrCodeService.js';

class CheckInService {
    // Process student check-in via QR code
    async processCheckIn(qrCodeData, studentId) {
        try {
            if (!qrCodeData || !studentId) {
                throw new Error('QR code data and student ID are required');
            }

            // Validate QR code
            const qrValidation = qrCodeService.validateQRCode(qrCodeData);
            if (!qrValidation.valid) {
                throw new Error(qrValidation.message);
            }

            const qrCode = qrValidation.qrCode;

            // Check if student exists
            const student = browserDatabase.getUserById(studentId);
            if (!student || student.user_type !== 'student') {
                throw new Error('Invalid student');
            }

            // Check for duplicate check-in (within last 5 minutes)
            const recentCheckIns = this.getRecentCheckIns(studentId, qrCode.program_id, 5);
            if (recentCheckIns.length > 0) {
                throw new Error('You have already checked in recently for this program');
            }

            // Create check-in record
            const checkInData = {
                student_id: studentId,
                program_id: qrCode.program_id,
                qr_code_id: qrCode.id,
                location: qrCode.location_name
            };

            const result = browserDatabase.createCheckIn(checkInData);
            
            if (result.changes === 0) {
                throw new Error('Failed to record check-in');
            }

            // Get program details for response
            const program = browserDatabase.getLearningProgramById(qrCode.program_id);

            return {
                success: true,
                message: 'Check-in successful!',
                checkIn: {
                    id: result.lastInsertRowid,
                    program_name: program.name,
                    program_description: program.description,
                    location: qrCode.location_name,
                    check_in_time: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get recent check-ins for duplicate detection
    getRecentCheckIns(studentId, programId, minutesBack = 5) {
        const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
        const cutoffTime = new Date(Date.now() - (minutesBack * 60 * 1000));
        
        return checkIns.filter(ci => 
            ci.student_id === studentId &&
            ci.program_id === programId &&
            new Date(ci.check_in_time) > cutoffTime
        );
    }

    // Get student's check-in history
    async getStudentCheckInHistory(studentId, limit = 50) {
        try {
            const checkIns = browserDatabase.getStudentCheckIns(studentId, limit);
            
            return {
                success: true,
                checkIns: checkIns
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to fetch check-in history',
                checkIns: []
            };
        }
    }

    // Get check-in statistics for a student
    async getStudentStats(studentId) {
        try {
            const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
            const studentCheckIns = checkIns.filter(ci => ci.student_id === studentId);
            
            // Calculate statistics
            const totalCheckIns = studentCheckIns.length;
            const uniquePrograms = [...new Set(studentCheckIns.map(ci => ci.program_id))];
            const uniqueLocations = [...new Set(studentCheckIns.map(ci => ci.location))];
            
            // Get recent activity (last 7 days)
            const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
            const recentCheckIns = studentCheckIns.filter(ci => 
                new Date(ci.check_in_time) > sevenDaysAgo
            );

            // Get most visited programs
            const programCounts = {};
            studentCheckIns.forEach(ci => {
                programCounts[ci.program_id] = (programCounts[ci.program_id] || 0) + 1;
            });

            const programs = browserDatabase.getAllLearningPrograms();
            const mostVisitedPrograms = Object.entries(programCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([programId, count]) => {
                    const program = programs.find(p => p.id === parseInt(programId));
                    return {
                        program_name: program ? program.name : 'Unknown',
                        visit_count: count
                    };
                });

            const stats = {
                totalCheckIns,
                uniquePrograms: uniquePrograms.length,
                uniqueLocations: uniqueLocations.length,
                recentCheckIns: recentCheckIns.length,
                mostVisitedPrograms,
                lastCheckIn: studentCheckIns.length > 0 
                    ? Math.max(...studentCheckIns.map(ci => new Date(ci.check_in_time).getTime()))
                    : null
            };

            return {
                success: true,
                stats
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to calculate statistics',
                stats: null
            };
        }
    }

    // Get today's check-ins for a student
    async getTodayCheckIns(studentId) {
        try {
            const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayCheckIns = checkIns.filter(ci => {
                const checkInDate = new Date(ci.check_in_time);
                checkInDate.setHours(0, 0, 0, 0);
                return ci.student_id === studentId && checkInDate.getTime() === today.getTime();
            });

            // Get program details for each check-in
            const programs = browserDatabase.getAllLearningPrograms();
            const qrCodes = JSON.parse(localStorage.getItem('trailtag_qr_codes') || '[]');
            
            const enrichedCheckIns = todayCheckIns.map(ci => {
                const program = programs.find(p => p.id === ci.program_id);
                const qrCode = qrCodes.find(qr => qr.id === ci.qr_code_id);
                
                return {
                    ...ci,
                    program_name: program ? program.name : 'Unknown Program',
                    program_description: program ? program.description : '',
                    qr_location: qrCode ? qrCode.location_name : 'Unknown Location'
                };
            }).sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));

            return {
                success: true,
                checkIns: enrichedCheckIns
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to fetch today\'s check-ins',
                checkIns: []
            };
        }
    }

    // Parse QR code data to extract program information
    parseQRCodeData(qrCodeData) {
        try {
            // Expected format: trailtag://checkin?program=123&location=Main%20Entrance&t=1234567890
            const url = new URL(qrCodeData);
            
            if (url.protocol !== 'trailtag:' || url.pathname !== '//checkin') {
                throw new Error('Invalid QR code format');
            }

            const params = new URLSearchParams(url.search);
            const programId = params.get('program');
            const location = params.get('location');
            const timestamp = params.get('t');

            if (!programId || !location) {
                throw new Error('Missing required QR code parameters');
            }

            return {
                valid: true,
                programId: parseInt(programId),
                location: decodeURIComponent(location),
                timestamp: timestamp ? parseInt(timestamp) : null
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Invalid QR code format'
            };
        }
    }

    // Validate check-in eligibility
    async validateCheckInEligibility(studentId, programId) {
        try {
            // Check if student exists
            const student = browserDatabase.getUserById(studentId);
            if (!student || student.user_type !== 'student') {
                return {
                    eligible: false,
                    message: 'Invalid student'
                };
            }

            // Check if program exists and is active
            const program = browserDatabase.getLearningProgramById(programId);
            if (!program || !program.is_active) {
                return {
                    eligible: false,
                    message: 'Program not found or inactive'
                };
            }

            // Check for recent duplicate check-ins
            const recentCheckIns = this.getRecentCheckIns(studentId, programId, 5);
            if (recentCheckIns.length > 0) {
                return {
                    eligible: false,
                    message: 'Already checked in recently'
                };
            }

            return {
                eligible: true,
                program: program
            };
        } catch (error) {
            return {
                eligible: false,
                message: 'Validation failed'
            };
        }
    }

    // Get check-in summary for admin dashboard
    async getCheckInSummary(dateRange = 7) {
        try {
            const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
            const cutoffDate = new Date(Date.now() - (dateRange * 24 * 60 * 60 * 1000));
            
            const recentCheckIns = checkIns.filter(ci => 
                new Date(ci.check_in_time) > cutoffDate
            );

            const totalCheckIns = recentCheckIns.length;
            const uniqueStudents = [...new Set(recentCheckIns.map(ci => ci.student_id))];
            const uniquePrograms = [...new Set(recentCheckIns.map(ci => ci.program_id))];

            // Daily breakdown
            const dailyBreakdown = {};
            recentCheckIns.forEach(ci => {
                const date = new Date(ci.check_in_time).toDateString();
                dailyBreakdown[date] = (dailyBreakdown[date] || 0) + 1;
            });

            return {
                success: true,
                summary: {
                    totalCheckIns,
                    uniqueStudents: uniqueStudents.length,
                    uniquePrograms: uniquePrograms.length,
                    dailyBreakdown,
                    dateRange
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to generate summary',
                summary: null
            };
        }
    }
}

// Create singleton instance
const checkInService = new CheckInService();

export default checkInService;
