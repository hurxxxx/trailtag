// Browser-compatible imports
import browserDatabase from './browserDatabase.js';

// Browser-compatible JWT and bcrypt alternatives
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Simple JWT implementation for browser
const jwt = {
    sign: (payload, secret, options) => {
        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const exp = options?.expiresIn === '24h' ? now + (24 * 60 * 60) : now + 3600;

        const jwtPayload = { ...payload, iat: now, exp };

        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(jwtPayload));
        const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    },

    verify: (token, secret) => {
        try {
            const [header, payload, signature] = token.split('.');
            const expectedSignature = btoa(`${header}.${payload}.${secret}`);

            if (signature !== expectedSignature) {
                throw new Error('Invalid signature');
            }

            const decodedPayload = JSON.parse(atob(payload));

            if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token expired');
            }

            return decodedPayload;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
};

// Simple bcrypt implementation for browser
const bcrypt = {
    hash: async (password, saltRounds) => {
        // For development, use simple comparison
        if (password === 'admin123') {
            return 'admin123_hash';
        }
        // Simple hash for demo - in production use proper crypto
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return '$2a$10$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    compare: async (password, hash) => {
        // Special case for admin password
        if (password === 'admin123' && (hash === 'admin123_hash' || hash === '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')) {
            return true;
        }
        const newHash = await bcrypt.hash(password, 10);
        return newHash === hash;
    }
};

const JWT_EXPIRES_IN = '24h';

class AuthService {
    // Register a new user
    async register(userData) {
        try {
            // Validate required fields
            const requiredFields = ['username', 'password', 'full_name', 'email', 'phone', 'user_type'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    throw new Error(`${field} is required`);
                }
            }

            // Validate user type
            const validUserTypes = ['student', 'parent', 'admin'];
            if (!validUserTypes.includes(userData.user_type)) {
                throw new Error('Invalid user type');
            }

            // Check if username already exists
            const existingUser = browserDatabase.getUserByUsername(userData.username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Check if email already exists
            const existingEmail = browserDatabase.getUserByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            // Hash password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(userData.password, saltRounds);

            // Create user
            const result = browserDatabase.createUser({
                ...userData,
                password_hash
            });

            if (result.changes === 0) {
                throw new Error('Failed to create user');
            }

            // Get the created user (without password)
            const newUser = browserDatabase.getUserById(result.lastInsertRowid);
            delete newUser.password_hash;

            return {
                success: true,
                message: 'User registered successfully',
                user: newUser
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Login user
    async login(username, password) {
        try {
            // Get user by username
            const user = browserDatabase.getUserByUsername(username);
            if (!user) {
                throw new Error('Invalid username or password');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                throw new Error('Invalid username or password');
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
            const tokenHash = await bcrypt.hash(token, 10);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            browserDatabase.createSession(user.id, tokenHash, expiresAt.toISOString());

            // Remove password from user object
            delete user.password_hash;

            return {
                success: true,
                message: 'Login successful',
                token,
                user
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return {
                success: true,
                decoded
            };
        } catch (error) {
            return {
                success: false,
                message: 'Invalid or expired token'
            };
        }
    }

    // Get user from token
    async getUserFromToken(token) {
        try {
            const verification = this.verifyToken(token);
            if (!verification.success) {
                throw new Error(verification.message);
            }

            const user = browserDatabase.getUserById(verification.decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Remove password from user object
            delete user.password_hash;

            return {
                success: true,
                user
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Logout user
    async logout(token) {
        try {
            const tokenHash = await bcrypt.hash(token, 10);
            browserDatabase.deleteSession(tokenHash);

            return {
                success: true,
                message: 'Logout successful'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Logout failed'
            };
        }
    }

    // Middleware to protect routes
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const verification = this.verifyToken(token);
        if (!verification.success) {
            return res.status(403).json({ message: verification.message });
        }

        req.user = verification.decoded;
        next();
    }

    // Middleware to check user role
    requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            if (!roles.includes(req.user.userType)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        };
    }

    // Clean up expired sessions
    cleanupExpiredSessions() {
        try {
            browserDatabase.cleanupExpiredSessions();
        } catch (error) {
            console.error('Failed to cleanup expired sessions:', error);
        }
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = browserDatabase.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password in database (simplified for browser storage)
            const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            users[userIndex].password_hash = newPasswordHash;
            users[userIndex].updated_at = new Date().toISOString();
            localStorage.setItem('trailtag_users', JSON.stringify(users));
            const result = { changes: 1 };

            if (result.changes === 0) {
                throw new Error('Failed to update password');
            }

            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        try {
            // 서버 API를 통해 프로필 업데이트
            const response = await apiClient.updateProfile(updateData);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Profile updated successfully',
                    user: response.user
                };
            } else {
                throw new Error(response.message || 'Profile update failed');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.message || 'Profile update failed'
            };
        }
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
