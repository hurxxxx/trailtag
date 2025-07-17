const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, full_name, email, phone, address, user_type } = req.body;

        // Validate required fields
        const requiredFields = ['username', 'password', 'full_name', 'email', 'phone', 'address', 'user_type'];
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
            INSERT INTO users (username, password_hash, full_name, email, phone, address, user_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [username, password_hash, full_name, email, phone, address, user_type]);

        // Get the created user (without password)
        const newUser = await database.get(`
            SELECT id, username, full_name, email, phone, address, user_type, created_at
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
            SELECT id, username, full_name, email, phone, address, user_type, created_at, updated_at
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
        const { full_name, email, phone, address } = req.body;
        const allowedFields = { full_name, email, phone, address };
        
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
            SELECT id, username, full_name, email, phone, address, user_type, created_at, updated_at
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

module.exports = router;
