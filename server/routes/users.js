const express = require('express');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Search students by name and phone (for parents)
router.get('/students/search', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { name, phone } = req.query;

        if (!name && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name or phone parameter is required'
            });
        }

        let query = `
            SELECT id, username, full_name, email, phone
            FROM users 
            WHERE user_type = 'student'
        `;
        const params = [];

        if (name && phone) {
            query += ' AND (full_name LIKE ? OR phone LIKE ?)';
            params.push(`%${name}%`, `%${phone}%`);
        } else if (name) {
            query += ' AND full_name LIKE ?';
            params.push(`%${name}%`);
        } else if (phone) {
            query += ' AND phone LIKE ?';
            params.push(`%${phone}%`);
        }

        query += ' ORDER BY full_name';

        const students = await database.all(query, params);

        res.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Search students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search students'
        });
    }
});

// Get students connected to parent
router.get('/my-students', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const parentId = req.user.userId;

        const students = await database.all(`
            SELECT u.id, u.username, u.full_name, u.email, u.phone, psr.relationship_type
            FROM users u
            JOIN parent_student_relationships psr ON u.id = psr.student_id
            WHERE psr.parent_id = ? AND u.user_type = 'student'
            ORDER BY u.full_name
        `, [parentId]);

        res.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Get my students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students'
        });
    }
});

// Add student to parent's monitoring list
router.post('/add-student', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { student_id, relationship_type = 'parent' } = req.body;
        const parentId = req.user.userId;

        if (!student_id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Check if student exists
        const student = await database.get('SELECT id FROM users WHERE id = ? AND user_type = ?', [student_id, 'student']);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if relationship already exists
        const existing = await database.get(`
            SELECT id FROM parent_student_relationships 
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, student_id]);

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Student is already in your monitoring list'
            });
        }

        // Create relationship
        await database.run(`
            INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
            VALUES (?, ?, ?)
        `, [parentId, student_id, relationship_type]);

        res.status(201).json({
            success: true,
            message: 'Student added to monitoring list successfully'
        });

    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add student'
        });
    }
});

// Remove student from parent's monitoring list
router.delete('/remove-student/:studentId', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentId = req.user.userId;

        // Check if relationship exists
        const relationship = await database.get(`
            SELECT id FROM parent_student_relationships 
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, studentId]);

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message: 'Student not found in your monitoring list'
            });
        }

        // Remove relationship
        await database.run(`
            DELETE FROM parent_student_relationships 
            WHERE parent_id = ? AND student_id = ?
        `, [parentId, studentId]);

        res.json({
            success: true,
            message: 'Student removed from monitoring list successfully'
        });

    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove student'
        });
    }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { user_type, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT id, username, full_name, email, phone, address, user_type, created_at, updated_at
            FROM users
        `;
        const params = [];

        if (user_type) {
            query += ' WHERE user_type = ?';
            params.push(user_type);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const users = await database.all(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        const countParams = [];
        if (user_type) {
            countQuery += ' WHERE user_type = ?';
            countParams.push(user_type);
        }

        const countResult = await database.get(countQuery, countParams);
        const total = countResult.total;

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const user = await database.get(`
            SELECT id, username, full_name, email, phone, address, user_type, created_at, updated_at
            FROM users WHERE id = ?
        `, [id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, address, user_type } = req.body;

        // Check if user exists
        const user = await database.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build update query
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (user_type !== undefined) {
            const validTypes = ['student', 'parent', 'admin'];
            if (!validTypes.includes(user_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user type'
                });
            }
            updates.user_type = user_type;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Check if email is being updated and if it already exists
        if (updates.email) {
            const existingUser = await database.get('SELECT id FROM users WHERE email = ? AND id != ?', [updates.email, id]);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        await database.run(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

        // Get updated user
        const updatedUser = await database.get(`
            SELECT id, username, full_name, email, phone, address, user_type, created_at, updated_at
            FROM users WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await database.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting the current user
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Delete user (this will cascade to related records due to foreign key constraints)
        await database.run('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

module.exports = router;
