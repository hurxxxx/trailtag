// Browser-compatible imports
import apiClient from './apiClient.js';

// 클라이언트에서는 서버 API만 사용하므로 JWT/bcrypt 구현 제거

class AuthService {
    // Register a new user
    async register(userData) {
        try {
            // 서버 API를 통해 사용자 등록
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
            // 서버 API를 통해 로그인
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
            // 서버 API를 통해 토큰 검증
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
            // 서버 API를 통해 토큰에서 사용자 정보 가져오기
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
            // 서버 API를 통해 로그아웃
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
        // 서버에서 처리하므로 클라이언트에서는 빈 메서드
        console.log('Session cleanup is handled by server');
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // 서버 API를 통해 비밀번호 변경
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

            // 서버 API를 통해 프로필 업데이트
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
