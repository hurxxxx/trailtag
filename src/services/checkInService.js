import apiClient from './apiClient.js';

class CheckInService {
    // Process student check-in via QR code
    async processCheckIn(qrCodeData, studentId) {
        try {
            if (!qrCodeData || !studentId) {
                throw new Error('QR code data and student ID are required');
            }

            // Process check-in through API (server handles QR code verification and check-in)
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
    async getRecentCheckIns(studentId, programId, minutesBack = 5) {
        try {
            const response = await apiClient.getRecentCheckIns(studentId, programId, minutesBack);
            return response.success ? response.checkIns : [];
        } catch (error) {
            console.error('Failed to get recent check-ins:', error);
            return [];
        }
    }

    // Get student's check-in history
    async getStudentCheckInHistory(studentId, limit = 50, isParentRequest = false) {
        try {
            console.log('Getting check-in history for student:', studentId, 'isParentRequest:', isParentRequest);

            // When parent queries specific student
            if (studentId && isParentRequest) {
                const response = await apiClient.getStudentCheckInHistory(studentId, limit);
                console.log('Student check-in history response:', response);

                if (response.success) {
                    return {
                        success: true,
                        checkIns: response.checkIns
                    };
                } else {
                    throw new Error(response.message || 'Failed to fetch student check-in history');
                }
            } else {
                // When student queries their own records
                const response = await apiClient.getCheckInHistory(limit);

                if (response.success) {
                    return {
                        success: true,
                        checkIns: response.checkIns
                    };
                } else {
                    throw new Error(response.message || 'Failed to fetch check-in history');
                }
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
            // Get student statistics through API
            const response = await apiClient.getStudentStats(studentId);

            if (response.success) {
                return {
                    success: true,
                    stats: response.stats
                };
            } else {
                throw new Error(response.message || 'Failed to get student statistics');
            }
        } catch (error) {
            console.error('Error getting student stats:', error);
            return {
                success: false,
                message: error.message || 'Failed to get student statistics',
                stats: null
            };
        }
    }

    // Get today's check-ins for a student
    async getTodayCheckIns(studentId, isParentRequest = false) {
        try {
            console.log('Getting today check-ins for student:', studentId, 'isParentRequest:', isParentRequest);

            // When parent queries specific student
            if (studentId && isParentRequest) {
                const response = await apiClient.getStudentTodayCheckIns(studentId);
                console.log('Student today check-ins response:', response);

                if (response.success) {
                    return {
                        success: true,
                        checkIns: response.checkIns
                    };
                } else {
                    throw new Error(response.message || 'Failed to fetch student today\'s check-ins');
                }
            } else {
                // When student queries their own records
                const response = await apiClient.getTodayCheckIns();

                if (response.success) {
                    return {
                        success: true,
                        checkIns: response.checkIns
                    };
                } else {
                    throw new Error(response.message || 'Failed to fetch today\'s check-ins');
                }
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
            // Validate check-in eligibility through API
            const response = await apiClient.validateCheckInEligibility(studentId, programId);

            if (response.success) {
                return {
                    eligible: response.eligible,
                    message: response.message
                };
            } else {
                return {
                    eligible: false,
                    message: response.message || 'Validation failed'
                };
            }
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
            // Get check-in summary information through API
            const response = await apiClient.getCheckInSummary(dateRange);

            if (response.success) {
                return {
                    success: true,
                    summary: response.summary
                };
            } else {
                throw new Error(response.message || 'Failed to get check-in summary');
            }
        } catch (error) {
            console.error('Error getting check-in summary:', error);
            return {
                success: false,
                message: error.message || 'Failed to generate summary',
                summary: null
            };
        }
    }
}

// Create singleton instance
const checkInService = new CheckInService();

export default checkInService;
