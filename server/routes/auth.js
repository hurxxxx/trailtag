const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, full_name, email, phone, user_type } = req.body;

        // Validate required fields
        const requiredFields = ['username', 'password', 'full_name', 'email', 'phone', 'user_type'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required`
                });
            }
        }

        // Validate user type
        const validUserTypes = ['student', 'parent', 'admin'];
        if (!validUserTypes.includes(user_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }

        // Validate phone number (숫자만, 3자 이상)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be at least 3 digits'
            });
        }
        if (!/^\d+$/.test(phoneDigits)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must contain only digits'
            });
        }

        // Check if username already exists
        const existingUser = await database.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await database.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await database.run(`
            INSERT INTO users (username, password_hash, full_name, email, phone, user_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [username, password_hash, full_name, email, phoneDigits, user_type]);

        // Get the created user (without password)
        const newUser = await database.get(`
            SELECT id, username, full_name, email, phone, user_type, created_at
            FROM users WHERE id = ?
        `, [result.id]);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Get user by username
        const user = await database.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                userType: user.user_type
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create session in database
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await database.run(`
            INSERT INTO user_sessions (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        `, [user.id, token, expiresAt.toISOString()]);

        // Remove password from user object
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await database.get(`
            SELECT id, username, full_name, email, phone, user_type, created_at, updated_at
            FROM users WHERE id = ?
        `, [req.user.userId]);

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
            message: 'Failed to get user information'
        });
    }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            await database.run('DELETE FROM user_sessions WHERE token_hash = ?', [token]);
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get user
        const user = await database.get('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await database.run(`
            UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [newPasswordHash, req.user.userId]);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, email, phone } = req.body;
        const allowedFields = { full_name, email, phone };

        // Filter out undefined fields
        const updates = {};
        Object.keys(allowedFields).forEach(key => {
            if (allowedFields[key] !== undefined) {
                updates[key] = allowedFields[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Check if email is being updated and if it already exists
        if (updates.email) {
            const existingUser = await database.get('SELECT id FROM users WHERE email = ? AND id != ?', [updates.email, req.user.userId]);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Build update query
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(req.user.userId);

        await database.run(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

        // Get updated user
        const updatedUser = await database.get(`
            SELECT id, username, full_name, email, phone, user_type, created_at, updated_at
            FROM users WHERE id = ?
        `, [req.user.userId]);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Admin: Get all users
router.get('/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, userType, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (userType) {
            whereClause += ' WHERE user_type = ?';
            params.push(userType);
        }

        if (search) {
            whereClause += userType ? ' AND' : ' WHERE';
            whereClause += ' (username LIKE ? OR full_name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const users = await database.all(`
            SELECT id, username, full_name, email, phone, user_type, created_at, updated_at
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const totalCount = await database.get(`
            SELECT COUNT(*) as count FROM users ${whereClause}
        `, params);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Admin: Create new admin user
router.post('/admin/create-admin', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { username, password, full_name, email, phone } = req.body;

        if (!username || !password || !full_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, full name, and email are required'
            });
        }

        // Check if username already exists
        const existingUser = await database.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await database.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create admin user
        const result = await database.run(`
            INSERT INTO users (username, password_hash, full_name, email, phone, user_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [username, passwordHash, full_name, email, phone || '', 'admin']);

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                id: result.id,
                username,
                full_name,
                email,
                phone: phone || '',
                user_type: 'admin'
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin user'
        });
    }
});

// Admin: Reset user password
router.post('/admin/reset-password', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'User ID and new password are required'
            });
        }

        // Check if user exists
        const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await database.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, userId]);

        res.json({
            success: true,
            message: `Password reset successfully for ${user.username}`
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});

// Admin: Delete user
router.delete('/admin/delete-user/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        // Prevent admin from deleting themselves
        if (parseInt(userId) === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check if user exists
        const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Start transaction for safe deletion
        await database.run('BEGIN TRANSACTION');

        try {
            // Delete related data first (foreign key constraints)

            // Delete user sessions
            await database.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);

            // Delete check-ins if user is a student
            if (user.user_type === 'student') {
                await database.run('DELETE FROM check_ins WHERE student_id = ?', [userId]);
            }

            // Delete parent-student relationships
            if (user.user_type === 'parent') {
                await database.run('DELETE FROM parent_student_relationships WHERE parent_id = ?', [userId]);
            } else if (user.user_type === 'student') {
                await database.run('DELETE FROM parent_student_relationships WHERE student_id = ?', [userId]);
            }

            // Delete learning programs created by this user (if admin)
            if (user.user_type === 'admin') {
                // First delete QR codes for programs created by this admin
                await database.run(`
                    DELETE FROM qr_codes
                    WHERE program_id IN (
                        SELECT id FROM learning_programs WHERE created_by = ?
                    )
                `, [userId]);

                // Then delete the programs
                await database.run('DELETE FROM learning_programs WHERE created_by = ?', [userId]);
            }

            // Finally delete the user
            await database.run('DELETE FROM users WHERE id = ?', [userId]);

            // Commit transaction
            await database.run('COMMIT');

            res.json({
                success: true,
                message: `User ${user.username} has been successfully deleted`
            });

        } catch (error) {
            // Rollback transaction on error
            await database.run('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

module.exports = router;
