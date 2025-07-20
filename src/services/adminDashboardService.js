import apiClient from './apiClient';

class AdminDashboardService {
    // Get dashboard statistics
    async getDashboardStats() {
        try {
            const response = await apiClient.getDashboardStats();

            if (response.success) {
                return {
                    success: true,
                    stats: response.stats
                };
            } else {
                throw new Error(response.message || 'Failed to fetch dashboard stats');
            }
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch dashboard stats',
                stats: this.getDefaultStats()
            };
        }
    }

    // Get recent activity
    async getRecentActivity() {
        try {
            const response = await apiClient.getRecentActivity();

            if (response.success) {
                return {
                    success: true,
                    activities: response.activities
                };
            } else {
                throw new Error(response.message || 'Failed to fetch recent activity');
            }
        } catch (error) {
            console.error('Get recent activity error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch recent activity',
                activities: this.getDefaultActivities()
            };
        }
    }

    // Get default stats when API fails
    getDefaultStats() {
        return {
            totalUsers: 0,
            adminCount: 0,
            studentCount: 0,
            parentCount: 0,
            activePrograms: 0,
            todayCheckIns: 0,
            weekCheckIns: 0
        };
    }

    // Get default activities when API fails
    getDefaultActivities() {
        return [
            {
                title: 'System Started',
                description: 'TrailTag system has started successfully',
                time: 'Just now',
                type: 'system'
            }
        ];
    }

    // Format numbers for display
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Format time for display
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hours ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} days ago`;
        }
    }

    // Get activity type icon
    getActivityIcon(type) {
        const icons = {
            'checkin': 'CheckCircle',
            'user': 'Person',
            'program': 'School',
            'system': 'Settings'
        };
        return icons[type] || 'Info';
    }

    // Get activity type color
    getActivityColor(type) {
        const colors = {
            'checkin': 'success',
            'user': 'primary',
            'program': 'info',
            'system': 'warning'
        };
        return colors[type] || 'default';
    }
}

// Create singleton instance
const adminDashboardService = new AdminDashboardService();

export default adminDashboardService;
