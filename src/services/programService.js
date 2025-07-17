import apiClient from './apiClient.js';

class ProgramService {
    // Create a new learning program
    async createProgram(programData, userId) {
        try {
            if (!programData.name || !programData.name.trim()) {
                throw new Error('Program name is required');
            }

            const response = await apiClient.createProgram({
                name: programData.name.trim(),
                description: programData.description || '',
                location: programData.location || ''
            });

            return {
                success: response.success,
                message: response.message || 'Program created successfully',
                program: response.program
            };
        } catch (error) {
            console.error('Create program error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create program'
            };
        }
    }

    // Get all learning programs
    async getAllPrograms() {
        try {
            const response = await apiClient.getPrograms();

            return {
                success: response.success,
                programs: response.programs || []
            };
        } catch (error) {
            console.error('Get programs error:', error);
            return {
                success: false,
                message: 'Failed to fetch programs',
                programs: []
            };
        }
    }

    // Get a specific program by ID
    async getProgramById(programId) {
        try {
            const response = await apiClient.getProgram(programId);

            return {
                success: response.success,
                program: response.program
            };
        } catch (error) {
            console.error('Get program error:', error);
            return {
                success: false,
                message: error.message || 'Program not found'
            };
        }
    }

    // Update a learning program
    async updateProgram(programId, updateData, userId) {
        try {
            const response = await apiClient.updateProgram(programId, updateData);

            return {
                success: response.success,
                message: response.message || 'Program updated successfully',
                program: response.program
            };
        } catch (error) {
            console.error('Update program error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update program'
            };
        }
    }

    // Delete a learning program (soft delete)
    async deleteProgram(programId, userId) {
        try {
            const response = await apiClient.deleteProgram(programId);

            return {
                success: response.success,
                message: response.message || 'Program deleted successfully'
            };
        } catch (error) {
            console.error('Delete program error:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete program'
            };
        }
    }

    // Get programs created by a specific user
    async getProgramsByCreator(userId) {
        try {
            // Use the general getPrograms and filter on frontend if needed
            const response = await apiClient.getPrograms();

            return {
                success: response.success,
                programs: response.programs || []
            };
        } catch (error) {
            console.error('Get user programs error:', error);
            return {
                success: false,
                message: 'Failed to fetch user programs',
                programs: []
            };
        }
    }

    // Search programs by name or description
    async searchPrograms(searchTerm) {
        try {
            // Use the search API endpoint
            const response = await apiClient.get(`/search/programs?q=${encodeURIComponent(searchTerm)}`);

            return {
                success: response.success,
                programs: response.programs || []
            };
        } catch (error) {
            console.error('Search programs error:', error);
            return {
                success: false,
                message: 'Search failed',
                programs: []
            };
        }
    }

    // Get program statistics
    async getProgramStats(programId) {
        try {
            const response = await apiClient.getProgramStats(programId);

            return {
                success: response.success,
                stats: response.stats
            };
        } catch (error) {
            console.error('Get program stats error:', error);
            return {
                success: false,
                message: error.message || 'Failed to get program statistics',
                stats: null
            };
        }
    }

    // Handle file uploads for program attachments
    async uploadAttachment(programId, file) {
        try {
            const formData = new FormData();
            formData.append('program_attachment', file);

            const response = await apiClient.upload(`/programs/${programId}/attachments`, formData);

            return {
                success: response.success,
                message: response.message || 'File uploaded successfully',
                attachment: response.attachments?.[0]
            };
        } catch (error) {
            console.error('Upload attachment error:', error);
            return {
                success: false,
                message: error.message || 'File upload failed'
            };
        }
    }

    // Get attachments for a program
    async getProgramAttachments(programId) {
        try {
            const response = await apiClient.get(`/programs/${programId}/attachments`);

            return {
                success: response.success,
                attachments: response.attachments || []
            };
        } catch (error) {
            console.error('Get attachments error:', error);
            return {
                success: false,
                message: 'Failed to fetch attachments',
                attachments: []
            };
        }
    }
}

// Create singleton instance
const programService = new ProgramService();

export default programService;
