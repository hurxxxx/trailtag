// API Client for TrailTag Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (
    import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3001/api'
);

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('trailtag_token');

        // Debug logging
        console.log('API Client initialized:', {
            baseURL: this.baseURL,
            mode: import.meta.env.MODE,
            viteApiUrl: import.meta.env.VITE_API_URL,
            currentURL: window.location.href,
            allEnvVars: import.meta.env
        });
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('trailtag_token', token);
        } else {
            localStorage.removeItem('trailtag_token');
        }
    }

    // Get authentication token
    getToken() {
        return this.token || localStorage.getItem('trailtag_token');
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add authorization header if token exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Convert body to JSON if it's an object
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { message: await response.text() };
            }

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401 || response.status === 403) {
                    console.log('Authentication error, clearing token');
                    this.setToken(null);
                    window.location.href = '/auth';
                    return;
                }

                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET',
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // Upload file
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            method: 'POST',
            body: formData,
            headers: {},
        };

        // Add authorization header if token exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Don't set Content-Type for FormData, let browser set it with boundary

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.setToken(null);
                    window.location.href = '/auth';
                    return;
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            return await this.get('/health');
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'ERROR', message: error.message };
        }
    }

    // Authentication methods
    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async login(username, password) {
        const response = await this.post('/auth/login', { username, password });
        if (response.success && response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.setToken(null);
        }
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', { currentPassword, newPassword });
    }

    async updateProfile(profileData) {
        return this.put('/auth/profile', profileData);
    }

    // Program methods
    async getPrograms() {
        return this.get('/programs');
    }

    async getProgram(id) {
        return this.get(`/programs/${id}`);
    }

    async createProgram(programData) {
        return this.post('/programs', programData);
    }

    async updateProgram(id, programData) {
        return this.put(`/programs/${id}`, programData);
    }

    async deleteProgram(id) {
        return this.delete(`/programs/${id}`);
    }

    async getProgramStats(id) {
        return this.get(`/programs/${id}/stats`);
    }

    // QR Code methods
    async getQRCodes() {
        return this.get('/qrcodes');
    }

    async getQRCodesByProgram(programId) {
        return this.get(`/qrcodes/program/${programId}`);
    }

    async createQRCode(qrCodeData) {
        return this.post('/qrcodes', qrCodeData);
    }

    async updateQRCode(id, qrCodeData) {
        return this.put(`/qrcodes/${id}`, qrCodeData);
    }

    async deleteQRCode(id) {
        return this.delete(`/qrcodes/${id}`);
    }

    async regenerateQRImage(id) {
        return this.put(`/qrcodes/${id}/regenerate-image`);
    }

    async validateQRCode(qrCodeData) {
        return this.post('/qrcodes/validate', { qr_code_data: qrCodeData });
    }

    // Check-in methods
    async checkIn(qrCodeData) {
        return this.post('/checkins', { qr_code_data: qrCodeData });
    }

    async getCheckInHistory(limit = 50) {
        return this.get('/checkins/history', { limit });
    }

    async getTodayCheckIns() {
        return this.get('/checkins/today');
    }

    async getStudentStats() {
        return this.get('/checkins/stats');
    }

    async getStudentCheckInHistory(studentId, limit = 50) {
        return this.get(`/checkins/student/${studentId}/history`, { limit });
    }

    async getStudentTodayCheckIns(studentId) {
        return this.get(`/checkins/student/${studentId}/today`);
    }

    // User methods
    async searchStudents(name, phone) {
        return this.get('/users/students/search', { name, phone });
    }

    async getMyStudents() {
        return this.get('/users/my-students');
    }

    async addStudent(studentId, relationshipType = 'parent') {
        return this.post('/users/add-student', { student_id: studentId, relationship_type: relationshipType });
    }

    async removeStudent(studentId) {
        return this.delete(`/users/remove-student/${studentId}`);
    }

    async getUsers(userType, page = 1, limit = 50) {
        return this.get('/users', { user_type: userType, page, limit });
    }

    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return this.put(`/users/${id}`, userData);
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    // Admin user management methods
    async getAllUsers(params = {}) {
        return this.get('/auth/admin/users', params);
    }

    async createAdminUser(userData) {
        return this.post('/auth/admin/create-admin', userData);
    }

    async createStudentUser(userData) {
        return this.post('/auth/admin/create-student', userData);
    }

    async createParentUser(userData) {
        return this.post('/auth/admin/create-parent', userData);
    }

    async resetUserPassword(userId, newPassword) {
        return this.post('/auth/admin/reset-password', { userId, newPassword });
    }

    async getAdminStudentCheckInHistory(studentId, params = {}) {
        return this.get(`/checkins/admin/student/${studentId}/history`, params);
    }

    async deleteUser(userId) {
        return this.delete(`/auth/admin/delete-user/${userId}`);
    }

    // Admin dashboard methods
    async getDashboardStats() {
        return this.get('/auth/admin/dashboard/stats');
    }

    async getRecentActivity() {
        return this.get('/auth/admin/dashboard/activity');
    }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
