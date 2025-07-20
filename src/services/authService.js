// Browser-compatible imports
import apiClient from './apiClient.js';

// Client only uses server API, so JWT/bcrypt implementation removed

class AuthService {
    // Register a new user
    async register(userData) {
        try {
            // Register user through server API
            const response = await apiClient.register(userData);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'User registered successfully',
                    user: response.user
                };
            } else {
                throw new Error(response.message || 'Registration failed');
            }
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
            // Login through server API
            const response = await apiClient.login(username, password);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Login successful',
                    token: response.token,
                    user: response.user
                };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Verify JWT token
    async verifyToken(token) {
        try {
            // Verify token through server API
            const response = await apiClient.verifyToken(token);

            if (response.success) {
                return {
                    success: true,
                    decoded: response.decoded
                };
            } else {
                throw new Error(response.message || 'Invalid or expired token');
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Invalid or expired token'
            };
        }
    }

    // Get user from token
    async getUserFromToken(token) {
        try {
            // Get user info from token through server API
            const response = await apiClient.getUserFromToken(token);

            if (response.success) {
                return {
                    success: true,
                    user: response.user
                };
            } else {
                throw new Error(response.message || 'Failed to get user from token');
            }
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
            // Logout through server API
            const response = await apiClient.logout(token);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Logout successful'
                };
            } else {
                throw new Error(response.message || 'Logout failed');
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
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
        // Empty method on client side as server handles this
        console.log('Session cleanup is handled by server');
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Change password through server API
            const response = await apiClient.changePassword({
                userId,
                currentPassword,
                newPassword
            });

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Password changed successfully'
                };
            } else {
                throw new Error(response.message || 'Password change failed');
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update user profile
    async updateProfile(updateData) {
        try {
            console.log('AuthService updateProfile called with:', updateData);

            // Update profile through server API
            const response = await apiClient.updateProfile(updateData);
            console.log('API response:', response);

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
            console.error('Update profile error in authService:', error);
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
