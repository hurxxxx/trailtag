const express = require('express');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin Dashboard Statistics
router.get('/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Total counts
        const totalUsers = await database.get('SELECT COUNT(*) as count FROM users');
        const totalPrograms = await database.get('SELECT COUNT(*) as count FROM learning_programs WHERE is_active = 1');
        const totalQRCodes = await database.get('SELECT COUNT(*) as count FROM qr_codes WHERE is_active = 1');
        const totalCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins');

        // Recent activity
        const recentCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE check_in_time > ?', [cutoffDate]);
        const recentUsers = await database.get('SELECT COUNT(*) as count FROM users WHERE created_at > ?', [cutoffDate]);
        const recentPrograms = await database.get('SELECT COUNT(*) as count FROM learning_programs WHERE created_at > ?', [cutoffDate]);

        // User type breakdown
        const usersByType = await database.all(`
            SELECT user_type, COUNT(*) as count 
            FROM users 
            GROUP BY user_type
        `);

        // Most active programs
        const activePrograms = await database.all(`
            SELECT lp.id, lp.name, COUNT(ci.id) as check_in_count,
                   COUNT(DISTINCT ci.student_id) as unique_students
            FROM learning_programs lp
            LEFT JOIN check_ins ci ON lp.id = ci.program_id
            WHERE lp.is_active = 1
            GROUP BY lp.id, lp.name
            ORDER BY check_in_count DESC
            LIMIT 10
        `);

        // Daily check-in trends
        const dailyTrends = await database.all(`
            SELECT date(check_in_time) as date, COUNT(*) as count
            FROM check_ins 
            WHERE check_in_time > ?
            GROUP BY date(check_in_time)
            ORDER BY date
        `, [cutoffDate]);

        // Most active students
        const activeStudents = await database.all(`
            SELECT u.id, u.full_name, u.email, COUNT(ci.id) as check_in_count,
                   COUNT(DISTINCT ci.program_id) as programs_visited
            FROM users u
            JOIN check_ins ci ON u.id = ci.student_id
            WHERE u.user_type = 'student' AND ci.check_in_time > ?
            GROUP BY u.id, u.full_name, u.email
            ORDER BY check_in_count DESC
            LIMIT 10
        `, [cutoffDate]);

        // QR Code usage
        const qrUsage = await database.all(`
            SELECT qr.id, qr.location_name, lp.name as program_name,
                   COUNT(ci.id) as usage_count
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            LEFT JOIN check_ins ci ON qr.id = ci.qr_code_id
            WHERE qr.is_active = 1
            GROUP BY qr.id, qr.location_name, lp.name
            ORDER BY usage_count DESC
            LIMIT 10
        `);

        const stats = {
            overview: {
                totalUsers: totalUsers.count,
                totalPrograms: totalPrograms.count,
                totalQRCodes: totalQRCodes.count,
                totalCheckIns: totalCheckIns.count,
                recentCheckIns: recentCheckIns.count,
                recentUsers: recentUsers.count,
                recentPrograms: recentPrograms.count
            },
            usersByType: usersByType.reduce((acc, item) => {
                acc[item.user_type] = item.count;
                return acc;
            }, {}),
            activePrograms,
            dailyTrends,
            activeStudents,
            qrUsage,
            period: `${days} days`
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin statistics'
        });
    }
});

// Student Dashboard Statistics
router.get('/student/stats', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Basic stats
        const totalCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const uniquePrograms = await database.get('SELECT COUNT(DISTINCT program_id) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const uniqueLocations = await database.get('SELECT COUNT(DISTINCT qr_code_id) as count FROM check_ins WHERE student_id = ?', [studentId]);
        const recentCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ? AND check_in_time > ?', [studentId, cutoffDate]);

        // Today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const todayCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ? AND date(check_in_time) = ?', [studentId, today]);

        // This week's check-ins
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const weekCheckIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ? AND check_in_time > ?', [studentId, weekAgo]);

        // Most visited programs
        const favoritePrograms = await database.all(`
            SELECT lp.name, COUNT(*) as visit_count
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            WHERE ci.student_id = ?
            GROUP BY lp.id, lp.name
            ORDER BY visit_count DESC
            LIMIT 5
        `, [studentId]);

        // Daily activity for the period
        const dailyActivity = await database.all(`
            SELECT date(check_in_time) as date, COUNT(*) as count
            FROM check_ins 
            WHERE student_id = ? AND check_in_time > ?
            GROUP BY date(check_in_time)
            ORDER BY date
        `, [studentId, cutoffDate]);

        // Recent check-ins with details
        const recentActivity = await database.all(`
            SELECT ci.check_in_time, lp.name as program_name, qr.location_name
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ?
            ORDER BY ci.check_in_time DESC
            LIMIT 10
        `, [studentId]);

        const stats = {
            overview: {
                totalCheckIns: totalCheckIns.count,
                uniquePrograms: uniquePrograms.count,
                uniqueLocations: uniqueLocations.count,
                recentCheckIns: recentCheckIns.count,
                todayCheckIns: todayCheckIns.count,
                weekCheckIns: weekCheckIns.count
            },
            favoritePrograms,
            dailyActivity,
            recentActivity,
            period: `${days} days`
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Student stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student statistics'
        });
    }
});

// Parent Dashboard Statistics
router.get('/parent/stats', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const parentId = req.user.userId;
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Get parent's students
        const students = await database.all(`
            SELECT u.id, u.full_name, u.email
            FROM users u
            JOIN parent_student_relationships psr ON u.id = psr.student_id
            WHERE psr.parent_id = ? AND u.user_type = 'student'
        `, [parentId]);

        if (students.length === 0) {
            return res.json({
                success: true,
                stats: {
                    overview: { monitoredStudents: 0 },
                    studentActivity: [],
                    message: 'No students being monitored'
                }
            });
        }

        const studentIds = students.map(s => s.id);
        const placeholders = studentIds.map(() => '?').join(',');

        // Overall stats for all monitored students
        const totalCheckIns = await database.get(`SELECT COUNT(*) as count FROM check_ins WHERE student_id IN (${placeholders})`, studentIds);
        const recentCheckIns = await database.get(`SELECT COUNT(*) as count FROM check_ins WHERE student_id IN (${placeholders}) AND check_in_time > ?`, [...studentIds, cutoffDate]);
        const uniquePrograms = await database.get(`SELECT COUNT(DISTINCT program_id) as count FROM check_ins WHERE student_id IN (${placeholders})`, studentIds);

        // Individual student activity
        const studentActivity = await Promise.all(students.map(async (student) => {
            const checkIns = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ?', [student.id]);
            const recentActivity = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE student_id = ? AND check_in_time > ?', [student.id, cutoffDate]);
            const lastCheckIn = await database.get('SELECT MAX(check_in_time) as last_check_in FROM check_ins WHERE student_id = ?', [student.id]);
            
            return {
                student: student,
                totalCheckIns: checkIns.count,
                recentCheckIns: recentActivity.count,
                lastCheckIn: lastCheckIn.last_check_in
            };
        }));

        // Most active programs among monitored students
        const popularPrograms = await database.all(`
            SELECT lp.name, COUNT(*) as check_in_count,
                   COUNT(DISTINCT ci.student_id) as student_count
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            WHERE ci.student_id IN (${placeholders}) AND ci.check_in_time > ?
            GROUP BY lp.id, lp.name
            ORDER BY check_in_count DESC
            LIMIT 5
        `, [...studentIds, cutoffDate]);

        const stats = {
            overview: {
                monitoredStudents: students.length,
                totalCheckIns: totalCheckIns.count,
                recentCheckIns: recentCheckIns.count,
                uniquePrograms: uniquePrograms.count
            },
            studentActivity,
            popularPrograms,
            period: `${days} days`
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Parent stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parent statistics'
        });
    }
});

// System Health and Performance
router.get('/system/health', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        // Database health checks
        const dbCheck = await database.get('SELECT 1 as test');
        const dbHealthy = dbCheck && dbCheck.test === 1;

        // Get database size (SQLite specific)
        const dbStats = await database.get(`
            SELECT 
                COUNT(*) as table_count
            FROM sqlite_master 
            WHERE type='table'
        `);

        // Check for recent errors (this would be more sophisticated in production)
        const recentErrors = 0; // Placeholder

        // Performance metrics
        const avgResponseTime = Math.random() * 100 + 50; // Placeholder
        const uptime = process.uptime();

        const health = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            database: {
                connected: dbHealthy,
                tables: dbStats.table_count
            },
            performance: {
                uptime: Math.floor(uptime),
                avgResponseTime: Math.round(avgResponseTime),
                recentErrors
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            health
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            health: {
                status: 'unhealthy',
                error: error.message
            }
        });
    }
});

module.exports = router;
