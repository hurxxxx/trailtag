const express = require('express');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Process student check-in via QR code
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { qr_code_data } = req.body;
        const studentId = req.user.userId;

        if (!qr_code_data) {
            return res.status(400).json({
                success: false,
                message: 'QR code data is required'
            });
        }

        // Extract timestamp and program ID from QR code data for validation
        let qrTimestamp = null;
        let programId = null;
        try {
            const url = new URL(qr_code_data);
            qrTimestamp = parseInt(url.searchParams.get('t'));
            programId = parseInt(url.searchParams.get('program'));
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code format'
            });
        }

        // Validate QR code and timestamp
        const qrCode = await database.get(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.program_id = ? AND qr.current_timestamp = ? AND qr.is_active = 1 AND lp.is_active = 1
        `, [programId, qrTimestamp]);

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired QR code. Please request a new QR code.'
            });
        }

        // Extract and validate timestamp from QR code data
        try {
            const url = new URL(qr_code_data);
            const timestamp = url.searchParams.get('t');

            if (timestamp) {
                const qrTimestamp = parseInt(timestamp);
                const currentTime = Date.now();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

                // Check if QR code is too old (older than 24 hours)
                if (currentTime - qrTimestamp > maxAge) {
                    return res.status(410).json({
                        success: false,
                        message: 'QR code has expired. Please request a new QR code.'
                    });
                }
            }
        } catch (error) {
            // If timestamp parsing fails, continue with normal validation
            console.log('QR timestamp validation failed:', error.message);
        }

        // Check if student exists and is a student
        const student = await database.get('SELECT * FROM users WHERE id = ? AND user_type = ?', [studentId, 'student']);
        if (!student) {
            return res.status(403).json({
                success: false,
                message: 'Only students can check in'
            });
        }

        // Check for duplicate check-in (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const recentCheckIn = await database.get(`
            SELECT id FROM check_ins 
            WHERE student_id = ? AND program_id = ? AND check_in_time > ?
        `, [studentId, qrCode.program_id, fiveMinutesAgo]);

        if (recentCheckIn) {
            return res.status(409).json({
                success: false,
                message: 'You have already checked in recently for this program'
            });
        }

        // Create check-in record
        const result = await database.run(`
            INSERT INTO check_ins (student_id, program_id, qr_code_id, location)
            VALUES (?, ?, ?, ?)
        `, [studentId, qrCode.program_id, qrCode.id, 'default']);

        res.status(201).json({
            success: true,
            message: 'Check-in successful!',
            checkIn: {
                id: result.id,
                program_name: qrCode.program_name,
                program_description: qrCode.program_description,
                location: 'default',
                check_in_time: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed'
        });
    }
});

// Get student's check-in history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;

        const checkIns = await database.all(`
            SELECT ci.*, lp.name as program_name, lp.description as program_description
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ?
            ORDER BY ci.check_in_time DESC
            LIMIT ?
        `, [studentId, limit]);

        res.json({
            success: true,
            checkIns
        });

    } catch (error) {
        console.error('Get check-in history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch check-in history'
        });
    }
});

// Get student's check-in history by parent
router.get('/student/:studentId/history', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;

        // Verify parent-student relationship
        const relationship = await database.get(`
            SELECT id FROM parent_student_relationships 
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, studentId]);

        if (!relationship) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this student\'s history'
            });
        }

        const checkIns = await database.all(`
            SELECT ci.*, lp.name as program_name, lp.description as program_description
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ?
            ORDER BY ci.check_in_time DESC
            LIMIT ?
        `, [studentId, limit]);

        res.json({
            success: true,
            checkIns
        });

    } catch (error) {
        console.error('Get student check-in history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student check-in history'
        });
    }
});

// Get today's check-ins for a student
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const checkIns = await database.all(`
            SELECT ci.*, lp.name as program_name, lp.description as program_description
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ? AND date(ci.check_in_time) = ?
            ORDER BY ci.check_in_time DESC
        `, [studentId, today]);

        res.json({
            success: true,
            checkIns
        });

    } catch (error) {
        console.error('Get today check-ins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s check-ins'
        });
    }
});

// Get today's check-ins for a student by parent
router.get('/student/:studentId/today', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentId = req.user.userId;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Verify parent-student relationship
        const relationship = await database.get(`
            SELECT id FROM parent_student_relationships
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, studentId]);

        if (!relationship) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this student\'s check-ins'
            });
        }

        const checkIns = await database.all(`
            SELECT ci.*, lp.name as program_name, lp.description as program_description
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ? AND date(ci.check_in_time) = ?
            ORDER BY ci.check_in_time DESC
        `, [studentId, today]);

        res.json({
            success: true,
            checkIns
        });

    } catch (error) {
        console.error('Get student today check-ins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s check-ins'
        });
    }
});

// Get student statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;

        // Total check-ins
        const totalResult = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const totalCheckIns = totalResult.count;

        // Unique programs
        const programsResult = await database.get('SELECT COUNT(DISTINCT program_id) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const uniquePrograms = programsResult.count;

        // Unique locations
        const locationsResult = await database.get('SELECT COUNT(DISTINCT qr_code_id) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const uniqueLocations = locationsResult.count;

        // Recent check-ins (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentResult = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ? AND check_in_time > ?', [studentId, sevenDaysAgo]);
        const recentCheckIns = recentResult.count;

        // Most visited programs
        const mostVisited = await database.all(`
            SELECT lp.name as program_name, COUNT(*) as visit_count
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            WHERE ci.student_id = ?
            GROUP BY ci.program_id, lp.name
            ORDER BY visit_count DESC
            LIMIT 5
        `, [studentId]);

        // Last check-in
        const lastCheckIn = await database.get('SELECT MAX(check_in_time) as last_check_in FROM check_ins WHERE student_id = ?', [studentId]);

        const stats = {
            totalCheckIns,
            uniquePrograms,
            uniqueLocations,
            recentCheckIns,
            mostVisitedPrograms: mostVisited,
            lastCheckIn: lastCheckIn.last_check_in
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get student stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student statistics'
        });
    }
});

// Get check-in summary for admin dashboard
router.get('/summary', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const dateRange = parseInt(req.query.days) || 7;
        const cutoffDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();

        // Total check-ins in date range
        const totalResult = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE check_in_time > ?', [cutoffDate]);
        const totalCheckIns = totalResult.count;

        // Unique students in date range
        const studentsResult = await database.get('SELECT COUNT(DISTINCT student_id) as count FROM check_ins WHERE check_in_time > ?', [cutoffDate]);
        const uniqueStudents = studentsResult.count;

        // Unique programs in date range
        const programsResult = await database.get('SELECT COUNT(DISTINCT program_id) as count FROM check_ins WHERE check_in_time > ?', [cutoffDate]);
        const uniquePrograms = programsResult.count;

        // Daily breakdown
        const dailyBreakdown = await database.all(`
            SELECT date(check_in_time) as date, COUNT(*) as count
            FROM check_ins 
            WHERE check_in_time > ?
            GROUP BY date(check_in_time)
            ORDER BY date
        `, [cutoffDate]);

        const summary = {
            totalCheckIns,
            uniqueStudents,
            uniquePrograms,
            dailyBreakdown,
            dateRange
        };

        res.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('Get check-in summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate summary'
        });
    }
});

module.exports = router;
