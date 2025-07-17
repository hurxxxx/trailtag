const jwt = require('jsonwebtoken');
const database = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired token' 
            });
        }

        req.user = user;
        next();
    });
};

// Middleware to check user role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        if (!userRoles.includes(req.user.userType)) {
            return res.status(403).json({ 
                success: false,
                message: 'Insufficient permissions' 
            });
        }

        next();
    };
};

// Middleware to validate session in database
const validateSession = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Access token required' 
            });
        }

        // Check if session exists and is not expired
        const session = await database.get(`
            SELECT us.*, u.username, u.user_type, u.full_name
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.token_hash = ? AND us.expires_at > datetime('now')
        `, [token]);

        if (!session) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired session' 
            });
        }

        // Verify JWT token
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Invalid or expired token' 
                });
            }

            req.user = user;
            req.session = session;
            next();
        });

    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Session validation failed' 
        });
    }
};

// Cleanup expired sessions
const cleanupExpiredSessions = async () => {
    try {
        await database.run('DELETE FROM user_sessions WHERE expires_at <= datetime("now")');
    } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
    authenticateToken,
    requireRole,
    validateSession,
    cleanupExpiredSessions
};
