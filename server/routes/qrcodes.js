const express = require('express');
const database = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate QR code data string
const generateQRData = (programId, timestamp = null) => {
    const ts = timestamp || Date.now();
    return `trailtag://checkin?program=${programId}&t=${ts}`;
};

// Get all QR codes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const qrCodes = await database.all(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.is_active = 1 AND lp.is_active = 1
            ORDER BY qr.created_at DESC
        `);

        res.json({
            success: true,
            qrCodes
        });

    } catch (error) {
        console.error('Get QR codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch QR codes'
        });
    }
});

// Get QR codes for a specific program
router.get('/program/:programId', authenticateToken, async (req, res) => {
    try {
        const { programId } = req.params;

        const qrCodes = await database.all(`
            SELECT * FROM qr_codes 
            WHERE program_id = ? AND is_active = 1
            ORDER BY created_at DESC
        `, [programId]);

        res.json({
            success: true,
            qrCodes
        });

    } catch (error) {
        console.error('Get program QR codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch QR codes'
        });
    }
});

// Create new QR code (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { program_id } = req.body;

        if (!program_id) {
            return res.status(400).json({
                success: false,
                message: 'Program ID is required'
            });
        }

        // Check if program exists
        const program = await database.get('SELECT * FROM learning_programs WHERE id = ? AND is_active = 1', [program_id]);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        // Generate unique QR code data
        const timestamp = Date.now();
        const qrCodeData = generateQRData(program_id, timestamp);

        // Check if QR code already exists for this program
        const existingQR = await database.get('SELECT id FROM qr_codes WHERE program_id = ?', [program_id]);
        if (existingQR) {
            return res.status(409).json({
                success: false,
                message: 'QR code for this program already exists'
            });
        }

        // Create QR code record
        const result = await database.run(`
            INSERT INTO qr_codes (program_id, qr_code_data, qr_image_version, current_timestamp)
            VALUES (?, ?, ?, ?)
        `, [program_id, qrCodeData, 1, timestamp]);

        const newQRCode = await database.get(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.id = ?
        `, [result.id]);

        res.status(201).json({
            success: true,
            message: 'QR code created successfully',
            qrCode: newQRCode
        });

    } catch (error) {
        console.error('Create QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create QR code'
        });
    }
});

// Update QR code (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { location_name, is_active } = req.body;

        // Check if QR code exists
        const qrCode = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }

        // Build update query
        const updates = {};
        if (location_name !== undefined) {
            updates.location_name = location_name;
            // If location name changed, regenerate QR data
            updates.qr_code_data = generateQRData(qrCode.program_id, location_name);
        }
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        await database.run(`UPDATE qr_codes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

        const updatedQRCode = await database.get(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'QR code updated successfully',
            qrCode: updatedQRCode
        });

    } catch (error) {
        console.error('Update QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update QR code'
        });
    }
});

// Regenerate QR image (admin only) - generates new QR with new timestamp
router.put('/:id/regenerate-image', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if QR code exists
        const qrCode = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }

        // Generate new QR code data with new timestamp (invalidates old QR codes)
        const newTimestamp = Date.now();
        const newQRCodeData = generateQRData(qrCode.program_id, newTimestamp);
        const newVersion = (qrCode.qr_image_version || 1) + 1;

        await database.run(`
            UPDATE qr_codes
            SET qr_code_data = ?, qr_image_version = ?, current_timestamp = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newQRCodeData, newVersion, newTimestamp, id]);

        const updatedQRCode = await database.get(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'QR image regenerated successfully (old QR codes are now invalid)',
            qrCode: updatedQRCode
        });

    } catch (error) {
        console.error('Regenerate QR image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate QR image'
        });
    }
});

// Delete QR code (soft delete, admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if QR code exists
        const qrCode = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }

        // Soft delete
        await database.run('UPDATE qr_codes SET is_active = 0 WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'QR code deleted successfully'
        });

    } catch (error) {
        console.error('Delete QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete QR code'
        });
    }
});

// Validate QR code for check-in
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        const { qr_code_data } = req.body;

        if (!qr_code_data) {
            return res.status(400).json({
                success: false,
                message: 'QR code data is required'
            });
        }

        const qrCode = await database.get(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.qr_code_data = ? AND qr.is_active = 1 AND lp.is_active = 1
        `, [qr_code_data]);

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or inactive QR code'
            });
        }

        res.json({
            success: true,
            valid: true,
            qrCode
        });

    } catch (error) {
        console.error('Validate QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'QR code validation failed'
        });
    }
});

// Get QR code statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if QR code exists
        const qrCode = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }

        // Get check-ins count
        const checkInsResult = await database.get('SELECT COUNT(*) as count FROM check_ins WHERE qr_code_id = ?', [id]);
        const totalCheckIns = checkInsResult.count;

        // Get unique students count
        const uniqueStudentsResult = await database.get('SELECT COUNT(DISTINCT student_id) as count FROM check_ins WHERE qr_code_id = ?', [id]);
        const uniqueStudents = uniqueStudentsResult.count;

        // Get last check-in
        const lastCheckIn = await database.get('SELECT MAX(check_in_time) as last_check_in FROM check_ins WHERE qr_code_id = ?', [id]);

        const stats = {
            totalCheckIns,
            uniqueStudents,
            lastCheckIn: lastCheckIn.last_check_in
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get QR code stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get QR code statistics'
        });
    }
});

module.exports = router;
