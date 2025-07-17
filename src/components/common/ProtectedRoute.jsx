import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
    const { user, loading, isAuthenticated, hasRole } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Redirect to auth page if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (requiredRole && !hasRole(requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = user.user_type === 'admin' ? '/admin' 
                           : user.user_type === 'parent' ? '/parent'
                           : user.user_type === 'student' ? '/student'
                           : '/auth';
        
        return <Navigate to={redirectPath} replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = user.user_type === 'admin' ? '/admin' 
                           : user.user_type === 'parent' ? '/parent'
                           : user.user_type === 'student' ? '/student'
                           : '/auth';
        
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
