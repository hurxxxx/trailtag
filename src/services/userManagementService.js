import apiClient from './apiClient';

class UserManagementService {
    // Get all users with filtering and pagination
    async getAllUsers(filters = {}) {
        try {
            const response = await apiClient.getAllUsers(filters);

            if (response.success) {
                return {
                    success: true,
                    users: response.users,
                    pagination: response.pagination
                };
            } else {
                throw new Error(response.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Get all users error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch users',
                users: [],
                pagination: null
            };
        }
    }

    // Create new admin user
    async createAdminUser(userData) {
        try {
            const response = await apiClient.createAdminUser(userData);

            if (response.success) {
                return {
                    success: true,
                    message: response.message,
                    user: response.user
                };
            } else {
                throw new Error(response.message || 'Failed to create admin user');
            }
        } catch (error) {
            console.error('Create admin user error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create admin user'
            };
        }
    }

    // Reset user password
    async resetUserPassword(userId, newPassword) {
        try {
            const response = await apiClient.resetUserPassword(userId, newPassword);

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                };
            } else {
                throw new Error(response.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: error.message || 'Failed to reset password'
            };
        }
    }

    // Get student check-in history (admin only)
    async getStudentCheckInHistory(studentId, params = {}) {
        try {
            const response = await apiClient.getAdminStudentCheckInHistory(studentId, params);

            if (response.success) {
                return {
                    success: true,
                    student: response.student,
                    checkIns: response.checkIns,
                    pagination: response.pagination
                };
            } else {
                throw new Error(response.message || 'Failed to fetch student check-in history');
            }
        } catch (error) {
            console.error('Get student check-in history error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch student check-in history',
                student: null,
                checkIns: [],
                pagination: null
            };
        }
    }

    // Validate user data
    validateUserData(userData, isAdmin = false) {
        const errors = [];

        if (!userData.username || userData.username.trim().length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!userData.password || userData.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (!userData.full_name || userData.full_name.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push('Valid email address is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Generate random password
    generateRandomPassword(length = 8) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // Format user type for display
    formatUserType(userType) {
        const types = {
            'admin': '관리자',
            'student': '학생',
            'parent': '부모'
        };
        return types[userType] || userType;
    }

    // Get user type color
    getUserTypeColor(userType) {
        const colors = {
            'admin': 'error',
            'student': 'primary',
            'parent': 'success'
        };
        return colors[userType] || 'default';
    }

    // Delete user
    async deleteUser(userId) {
        try {
            const response = await apiClient.deleteUser(userId);

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                };
            } else {
                throw new Error(response.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete user'
            };
        }
    }
}

// Create singleton instance
const userManagementService = new UserManagementService();

export default userManagementService;
