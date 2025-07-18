import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('trailtag_token');
                const storedUser = localStorage.getItem('trailtag_user');

                if (storedToken) {
                    // Set token in API client
                    apiClient.setToken(storedToken);

                    // Verify token is still valid
                    const result = await apiClient.getCurrentUser();
                    if (result.success) {
                        setToken(storedToken);
                        setUser(result.user);
                    } else {
                        // Token is invalid, clear storage
                        apiClient.setToken(null);
                        localStorage.removeItem('trailtag_user');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                apiClient.setToken(null);
                localStorage.removeItem('trailtag_user');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiClient.login(username, password);

            if (result.success) {
                setToken(result.token);
                setUser(result.user);

                // Store user in localStorage (token is handled by apiClient)
                localStorage.setItem('trailtag_user', JSON.stringify(result.user));

                return { success: true, message: result.message };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            const errorMessage = 'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiClient.register(userData);

            if (result.success) {
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            const errorMessage = 'Registration failed. Please try again.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear state and localStorage regardless of API call result
            setUser(null);
            setToken(null);
            setError(null);
            localStorage.removeItem('trailtag_user');
        }
    };

    const updateProfile = async (updateData) => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('No user logged in');
            }

            console.log('Updating profile with data:', updateData);
            const result = await authService.updateProfile(updateData);
            console.log('Profile update result:', result);

            if (result.success) {
                setUser(result.user);
                localStorage.setItem('trailtag_user', JSON.stringify(result.user));
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Profile update error in AuthContext:', error);
            const errorMessage = error.message || 'Profile update failed. Please try again.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('No user logged in');
            }

            const result = await authService.changePassword(user.id, currentPassword, newPassword);

            if (result.success) {
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Password change error:', error);
            const errorMessage = error.message || 'Password change failed. Please try again.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const isAuthenticated = () => {
        return !!(user && token);
    };

    const hasRole = (roles) => {
        if (!user) return false;
        if (typeof roles === 'string') {
            return user.user_type === roles;
        }
        if (Array.isArray(roles)) {
            return roles.includes(user.user_type);
        }
        return false;
    };

    const isStudent = () => hasRole('student');
    const isParent = () => hasRole('parent');
    const isAdmin = () => hasRole('admin');

    const value = {
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        clearError,
        isAuthenticated,
        hasRole,
        isStudent,
        isParent,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
