const express = require('express');
const path = require('path');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload, handleUploadError, getFileInfo, deleteFile } = require('../middleware/upload');

const router = express.Router();

// Get all learning programs
router.get('/', authenticateToken, async (req, res) => {
    try {
        const programs = await database.all(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.is_active = 1
            ORDER BY lp.created_at DESC
        `);

        res.json({
            success: true,
            programs
        });

    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch programs'
        });
    }
});

// Get single program by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const program = await database.get(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.id = ?
        `, [id]);

        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        res.json({
            success: true,
            program
        });

    } catch (error) {
        console.error('Get program error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch program'
        });
    }
});

// Create new learning program (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, description, location } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Program name is required'
            });
        }

        const result = await database.run(`
            INSERT INTO learning_programs (name, description, location, created_by)
            VALUES (?, ?, ?, ?)
        `, [name.trim(), description || '', location || '', req.user.userId]);

        const newProgram = await database.get(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.id = ?
        `, [result.id]);

        res.status(201).json({
            success: true,
            message: 'Program created successfully',
            program: newProgram
        });

    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create program'
        });
    }
});

// Update learning program (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, location } = req.body;

        // Check if program exists
        const program = await database.get('SELECT * FROM learning_programs WHERE id = ?', [id]);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Build update query
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (location !== undefined) updates.location = location;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        await database.run(`UPDATE learning_programs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

        const updatedProgram = await database.get(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Program updated successfully',
            program: updatedProgram
        });

    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update program'
        });
    }
});

// Delete learning program (soft delete, admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if program exists
        const program = await database.get('SELECT * FROM learning_programs WHERE id = ?', [id]);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Soft delete
        await database.run(`
            UPDATE learning_programs 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Program deleted successfully'
        });

    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete program'
        });
    }
});

// Get programs created by current user
router.get('/my/programs', authenticateToken, async (req, res) => {
    try {
        const programs = await database.all(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.created_by = ? AND lp.is_active = 1
            ORDER BY lp.created_at DESC
        `, [req.user.userId]);

        res.json({
            success: true,
            programs
        });

    } catch (error) {
        console.error('Get my programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user programs'
        });
    }
});

// Search programs
router.get('/search/:term', authenticateToken, async (req, res) => {
    try {
        const { term } = req.params;
        const searchTerm = `%${term}%`;

        const programs = await database.all(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.is_active = 1 
            AND (lp.name LIKE ? OR lp.description LIKE ? OR lp.location LIKE ?)
            ORDER BY lp.created_at DESC
        `, [searchTerm, searchTerm, searchTerm]);

        res.json({
            success: true,
            programs
        });

    } catch (error) {
        console.error('Search programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

// Get program statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if program exists
        const program = await database.get('SELECT * FROM learning_programs WHERE id = ?', [id]);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Get QR codes count
        const qrCodesResult = await database.get('SELECT COUNT(*) as count FROM qr_codes WHERE program_id = ? AND is_active = 1', [id]);
        const totalQRCodes = qrCodesResult.count;

        // Get check-ins count
        const checkInsResult = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE program_id = ?', [id]);
        const totalCheckIns = checkInsResult.count;

        // Get unique students count
        const uniqueStudentsResult = await database.get('SELECT COUNT(DISTINCT student_id) as count FROM check_ins WHERE program_id = ?', [id]);
        const uniqueStudents = uniqueStudentsResult.count;

        // Get last check-in
        const lastCheckIn = await database.get('SELECT MAX(check_in_time) as last_check_in FROM check_ins WHERE program_id = ?', [id]);

        const stats = {
            totalQRCodes,
            totalCheckIns,
            uniqueStudents,
            lastCheckIn: lastCheckIn.last_check_in
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get program stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get program statistics'
        });
    }
});

// Upload attachment to program
router.post('/:id/attachments', authenticateToken, requireRole('admin'), upload.array('program_attachment', 5), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if program exists
        const program = await database.get('SELECT * FROM learning_programs WHERE id = ?', [id]);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const attachments = [];

        for (const file of req.files) {
            const fileInfo = getFileInfo(file);

            // Save attachment info to database
            const result = await database.run(`
                INSERT INTO program_attachments (program_id, file_name, file_path, file_type, file_size)
                VALUES (?, ?, ?, ?, ?)
            `, [id, fileInfo.originalname, fileInfo.url, fileInfo.mimetype, fileInfo.size]);

            attachments.push({
                id: result.id,
                ...fileInfo
            });
        }

        res.status(201).json({
            success: true,
            message: 'Files uploaded successfully',
            attachments
        });

    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload attachments'
        });
    }
}, handleUploadError);

// Get program attachments
router.get('/:id/attachments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const attachments = await database.all(`
            SELECT * FROM program_attachments
            WHERE program_id = ?
            ORDER BY uploaded_at DESC
        `, [id]);

        res.json({
            success: true,
            attachments
        });

    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attachments'
        });
    }
});

// Delete program attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id, attachmentId } = req.params;

        // Get attachment info
        const attachment = await database.get(`
            SELECT * FROM program_attachments
            WHERE id = ? AND program_id = ?
        `, [attachmentId, id]);

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', attachment.file_path);
        deleteFile(filePath);

        // Delete from database
        await database.run('DELETE FROM program_attachments WHERE id = ?', [attachmentId]);

        res.json({
            success: true,
            message: 'Attachment deleted successfully'
        });

    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete attachment'
        });
    }
});

module.exports = router;
