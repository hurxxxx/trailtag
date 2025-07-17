const express = require('express');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Advanced search across all entities
router.get('/global', authenticateToken, async (req, res) => {
    try {
        const { q, type, limit = 20 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchTerm = `%${q.trim()}%`;
        const results = {};

        // Search programs (if no type specified or type is 'programs')
        if (!type || type === 'programs') {
            const programs = await database.all(`
                SELECT lp.*, u.full_name as creator_name,
                       COUNT(ci.id) as check_in_count
                FROM learning_programs lp
                JOIN users u ON lp.created_by = u.id
                LEFT JOIN check_ins ci ON lp.id = ci.program_id
                WHERE lp.is_active = 1 
                AND (lp.name LIKE ? OR lp.description LIKE ? OR lp.location LIKE ?)
                GROUP BY lp.id
                ORDER BY check_in_count DESC, lp.created_at DESC
                LIMIT ?
            `, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);
            
            results.programs = programs;
        }

        // Search users (admin only)
        if (req.user.userType === 'admin' && (!type || type === 'users')) {
            const users = await database.all(`
                SELECT id, username, full_name, email, phone, user_type, created_at
                FROM users
                WHERE full_name LIKE ? OR email LIKE ? OR username LIKE ?
                ORDER BY created_at DESC
                LIMIT ?
            `, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);
            
            results.users = users;
        }

        // Search QR codes (admin only)
        if (req.user.userType === 'admin' && (!type || type === 'qrcodes')) {
            const qrCodes = await database.all(`
                SELECT qr.*, lp.name as program_name,
                       COUNT(ci.id) as usage_count
                FROM qr_codes qr
                JOIN learning_programs lp ON qr.program_id = lp.id
                LEFT JOIN check_ins ci ON qr.id = ci.qr_code_id
                WHERE qr.is_active = 1 
                AND (qr.location_name LIKE ? OR lp.name LIKE ?)
                GROUP BY qr.id
                ORDER BY usage_count DESC, qr.created_at DESC
                LIMIT ?
            `, [searchTerm, searchTerm, parseInt(limit)]);
            
            results.qrCodes = qrCodes;
        }

        // Search check-ins (for current user or admin)
        if (!type || type === 'checkins') {
            let checkInQuery = `
                SELECT ci.*, lp.name as program_name, qr.location_name,
                       u.full_name as student_name
                FROM check_ins ci
                JOIN learning_programs lp ON ci.program_id = lp.id
                JOIN qr_codes qr ON ci.qr_code_id = qr.id
                JOIN users u ON ci.student_id = u.id
                WHERE (lp.name LIKE ? OR qr.location_name LIKE ? OR u.full_name LIKE ?)
            `;
            
            const params = [searchTerm, searchTerm, searchTerm];
            
            // If not admin, only show user's own check-ins
            if (req.user.userType !== 'admin') {
                checkInQuery += ' AND ci.student_id = ?';
                params.push(req.user.userId);
            }
            
            checkInQuery += ' ORDER BY ci.check_in_time DESC LIMIT ?';
            params.push(parseInt(limit));
            
            const checkIns = await database.all(checkInQuery, params);
            results.checkIns = checkIns;
        }

        res.json({
            success: true,
            query: q,
            results,
            totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
        });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

// Advanced program search with filters
router.get('/programs', authenticateToken, async (req, res) => {
    try {
        const { 
            q, 
            creator, 
            location, 
            created_after, 
            created_before,
            min_checkins,
            max_checkins,
            sort_by = 'created_at',
            sort_order = 'DESC',
            page = 1,
            limit = 20
        } = req.query;

        let query = `
            SELECT lp.*, u.full_name as creator_name,
                   COUNT(ci.id) as check_in_count,
                   COUNT(DISTINCT ci.student_id) as unique_students,
                   COUNT(qr.id) as qr_code_count
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            LEFT JOIN check_ins ci ON lp.id = ci.program_id
            LEFT JOIN qr_codes qr ON lp.id = qr.program_id AND qr.is_active = 1
            WHERE lp.is_active = 1
        `;
        
        const params = [];
        
        // Add search conditions
        if (q) {
            query += ' AND (lp.name LIKE ? OR lp.description LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (creator) {
            query += ' AND u.full_name LIKE ?';
            params.push(`%${creator}%`);
        }
        
        if (location) {
            query += ' AND lp.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        if (created_after) {
            query += ' AND lp.created_at >= ?';
            params.push(created_after);
        }
        
        if (created_before) {
            query += ' AND lp.created_at <= ?';
            params.push(created_before);
        }
        
        query += ' GROUP BY lp.id';
        
        // Add check-in filters after GROUP BY
        if (min_checkins) {
            query += ' HAVING COUNT(ci.id) >= ?';
            params.push(parseInt(min_checkins));
        }
        
        if (max_checkins) {
            query += ` ${min_checkins ? 'AND' : 'HAVING'} COUNT(ci.id) <= ?`;
            params.push(parseInt(max_checkins));
        }
        
        // Add sorting
        const validSortFields = ['created_at', 'name', 'check_in_count', 'unique_students'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        if (sortField === 'check_in_count') {
            query += ` ORDER BY COUNT(ci.id) ${sortDirection}`;
        } else if (sortField === 'unique_students') {
            query += ` ORDER BY COUNT(DISTINCT ci.student_id) ${sortDirection}`;
        } else {
            query += ` ORDER BY lp.${sortField} ${sortDirection}`;
        }
        
        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const programs = await database.all(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT lp.id) as total
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            LEFT JOIN check_ins ci ON lp.id = ci.program_id
            WHERE lp.is_active = 1
        `;
        
        const countParams = [];
        
        // Add same search conditions for count
        if (q) {
            countQuery += ' AND (lp.name LIKE ? OR lp.description LIKE ?)';
            const searchTerm = `%${q}%`;
            countParams.push(searchTerm, searchTerm);
        }
        
        if (creator) {
            countQuery += ' AND u.full_name LIKE ?';
            countParams.push(`%${creator}%`);
        }
        
        if (location) {
            countQuery += ' AND lp.location LIKE ?';
            countParams.push(`%${location}%`);
        }
        
        if (created_after) {
            countQuery += ' AND lp.created_at >= ?';
            countParams.push(created_after);
        }
        
        if (created_before) {
            countQuery += ' AND lp.created_at <= ?';
            countParams.push(created_before);
        }
        
        const countResult = await database.get(countQuery, countParams);
        const total = countResult.total;
        
        res.json({
            success: true,
            programs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                q, creator, location, created_after, created_before,
                min_checkins, max_checkins, sort_by, sort_order
            }
        });

    } catch (error) {
        console.error('Program search error:', error);
        res.status(500).json({
            success: false,
            message: 'Program search failed'
        });
    }
});

// Search check-ins with advanced filters
router.get('/checkins', authenticateToken, async (req, res) => {
    try {
        const {
            student_id,
            program_id,
            date_from,
            date_to,
            location,
            page = 1,
            limit = 50
        } = req.query;

        let query = `
            SELECT ci.*, lp.name as program_name, qr.location_name,
                   u.full_name as student_name, u.email as student_email
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            JOIN users u ON ci.student_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // If not admin, only show user's own check-ins or their monitored students
        if (req.user.userType === 'student') {
            query += ' AND ci.student_id = ?';
            params.push(req.user.userId);
        } else if (req.user.userType === 'parent') {
            query += ` AND ci.student_id IN (
                SELECT student_id FROM parent_student_relationships 
                WHERE parent_id = ?
            )`;
            params.push(req.user.userId);
        }
        
        // Add filters
        if (student_id && req.user.userType === 'admin') {
            query += ' AND ci.student_id = ?';
            params.push(student_id);
        }
        
        if (program_id) {
            query += ' AND ci.program_id = ?';
            params.push(program_id);
        }
        
        if (date_from) {
            query += ' AND ci.check_in_time >= ?';
            params.push(date_from);
        }
        
        if (date_to) {
            query += ' AND ci.check_in_time <= ?';
            params.push(date_to + ' 23:59:59');
        }
        
        if (location) {
            query += ' AND qr.location_name LIKE ?';
            params.push(`%${location}%`);
        }
        
        query += ' ORDER BY ci.check_in_time DESC';
        
        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const checkIns = await database.all(query, params);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            JOIN users u ON ci.student_id = u.id
            WHERE 1=1
        `;
        
        const countParams = [];
        
        // Apply same filters for count
        if (req.user.userType === 'student') {
            countQuery += ' AND ci.student_id = ?';
            countParams.push(req.user.userId);
        } else if (req.user.userType === 'parent') {
            countQuery += ` AND ci.student_id IN (
                SELECT student_id FROM parent_student_relationships 
                WHERE parent_id = ?
            )`;
            countParams.push(req.user.userId);
        }
        
        if (student_id && req.user.userType === 'admin') {
            countQuery += ' AND ci.student_id = ?';
            countParams.push(student_id);
        }
        
        if (program_id) {
            countQuery += ' AND ci.program_id = ?';
            countParams.push(program_id);
        }
        
        if (date_from) {
            countQuery += ' AND ci.check_in_time >= ?';
            countParams.push(date_from);
        }
        
        if (date_to) {
            countQuery += ' AND ci.check_in_time <= ?';
            countParams.push(date_to + ' 23:59:59');
        }
        
        if (location) {
            countQuery += ' AND qr.location_name LIKE ?';
            countParams.push(`%${location}%`);
        }
        
        const countResult = await database.get(countQuery, countParams);
        const total = countResult.total;
        
        res.json({
            success: true,
            checkIns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                student_id, program_id, date_from, date_to, location
            }
        });

    } catch (error) {
        console.error('Check-in search error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in search failed'
        });
    }
});

module.exports = router;
