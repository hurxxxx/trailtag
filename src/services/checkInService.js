import browserDatabase from './browserDatabase.js';
import apiClient from './apiClient.js';

class CheckInService {
    // Process student check-in via QR code
    async processCheckIn(qrCodeData, studentId) {
        try {
            if (!qrCodeData || !studentId) {
                throw new Error('QR code data and student ID are required');
            }

            // API를 통해 체크인 처리 (서버에서 QR 코드 검증 및 체크인 처리)
            const response = await apiClient.checkIn(qrCodeData);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Check-in successful!',
                    checkIn: response.checkIn
                };
            } else {
                throw new Error(response.message || 'Check-in failed');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            return {
                success: false,
                message: error.message || 'Check-in processing failed'
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
            // 서버 API를 통해 체크인 기록 조회
            const response = await apiClient.getCheckInHistory(limit);

            if (response.success) {
                return {
                    success: true,
                    checkIns: response.checkIns
                };
            } else {
                throw new Error(response.message || 'Failed to fetch check-in history');
            }
        } catch (error) {
            console.error('Get check-in history error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch check-in history',
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
                .sort(([, a], [, b]) => b - a)
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
            // 서버 API를 통해 오늘의 체크인 기록 조회
            const response = await apiClient.getTodayCheckIns();

            if (response.success) {
                return {
                    success: true,
                    checkIns: response.checkIns
                };
            } else {
                throw new Error(response.message || 'Failed to fetch today\'s check-ins');
            }
        } catch (error) {
            console.error('Get today check-ins error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch today\'s check-ins',
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
