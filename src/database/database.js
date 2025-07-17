import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        try {
            // Create database directory if it doesn't exist
            const dbDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Initialize database connection
            const dbPath = path.join(dbDir, 'trailtag.db');
            this.db = new Database(dbPath);
            
            // Enable foreign keys
            this.db.pragma('foreign_keys = ON');
            
            // Initialize schema
            this.initializeSchema();
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    initializeSchema() {
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Split schema into individual statements and execute
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    this.db.exec(statement);
                }
            }
            
            console.log('Database schema initialized');
        } catch (error) {
            console.error('Schema initialization failed:', error);
            throw error;
        }
    }

    // User operations
    createUser(userData) {
        const stmt = this.db.prepare(`
            INSERT INTO users (username, password_hash, full_name, email, phone, address, user_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        return stmt.run(
            userData.username,
            userData.password_hash,
            userData.full_name,
            userData.email,
            userData.phone,
            userData.address,
            userData.user_type
        );
    }

    getUserByUsername(username) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username);
    }

    getUserByEmail(email) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }

    getUserById(id) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    }

    searchStudentsByNameAndPhone(name, phone) {
        const stmt = this.db.prepare(`
            SELECT id, username, full_name, email, phone 
            FROM users 
            WHERE user_type = 'student' 
            AND (full_name LIKE ? OR phone LIKE ?)
        `);
        return stmt.all(`%${name}%`, `%${phone}%`);
    }

    // Learning program operations
    createLearningProgram(programData) {
        const stmt = this.db.prepare(`
            INSERT INTO learning_programs (name, description, location, created_by)
            VALUES (?, ?, ?, ?)
        `);
        
        return stmt.run(
            programData.name,
            programData.description,
            programData.location,
            programData.created_by
        );
    }

    getAllLearningPrograms() {
        const stmt = this.db.prepare(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.is_active = 1
            ORDER BY lp.created_at DESC
        `);
        return stmt.all();
    }

    getLearningProgramById(id) {
        const stmt = this.db.prepare(`
            SELECT lp.*, u.full_name as creator_name 
            FROM learning_programs lp
            JOIN users u ON lp.created_by = u.id
            WHERE lp.id = ?
        `);
        return stmt.get(id);
    }

    // QR code operations
    createQRCode(qrData) {
        const stmt = this.db.prepare(`
            INSERT INTO qr_codes (program_id, qr_code_data, location_name)
            VALUES (?, ?, ?)
        `);
        
        return stmt.run(
            qrData.program_id,
            qrData.qr_code_data,
            qrData.location_name
        );
    }

    getQRCodeByData(qrCodeData) {
        const stmt = this.db.prepare(`
            SELECT qr.*, lp.name as program_name, lp.description as program_description
            FROM qr_codes qr
            JOIN learning_programs lp ON qr.program_id = lp.id
            WHERE qr.qr_code_data = ? AND qr.is_active = 1 AND lp.is_active = 1
        `);
        return stmt.get(qrCodeData);
    }

    getQRCodesByProgramId(programId) {
        const stmt = this.db.prepare(`
            SELECT * FROM qr_codes 
            WHERE program_id = ? AND is_active = 1
            ORDER BY created_at DESC
        `);
        return stmt.all(programId);
    }

    // Check-in operations
    createCheckIn(checkInData) {
        const stmt = this.db.prepare(`
            INSERT INTO check_ins (student_id, program_id, qr_code_id, location)
            VALUES (?, ?, ?, ?)
        `);
        
        return stmt.run(
            checkInData.student_id,
            checkInData.program_id,
            checkInData.qr_code_id,
            checkInData.location
        );
    }

    getStudentCheckIns(studentId, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT ci.*, lp.name as program_name, lp.description as program_description,
                   qr.location_name as qr_location
            FROM check_ins ci
            JOIN learning_programs lp ON ci.program_id = lp.id
            JOIN qr_codes qr ON ci.qr_code_id = qr.id
            WHERE ci.student_id = ?
            ORDER BY ci.check_in_time DESC
            LIMIT ?
        `);
        return stmt.all(studentId, limit);
    }

    // Parent-student relationship operations
    createParentStudentRelationship(parentId, studentId, relationshipType = 'parent') {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO parent_student_relationships (parent_id, student_id, relationship_type)
            VALUES (?, ?, ?)
        `);
        
        return stmt.run(parentId, studentId, relationshipType);
    }

    getStudentsByParentId(parentId) {
        const stmt = this.db.prepare(`
            SELECT u.id, u.username, u.full_name, u.email, u.phone,
                   psr.relationship_type
            FROM parent_student_relationships psr
            JOIN users u ON psr.student_id = u.id
            WHERE psr.parent_id = ?
        `);
        return stmt.all(parentId);
    }

    // Session management
    createSession(userId, tokenHash, expiresAt) {
        const stmt = this.db.prepare(`
            INSERT INTO user_sessions (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        `);
        
        return stmt.run(userId, tokenHash, expiresAt);
    }

    getSessionByToken(tokenHash) {
        const stmt = this.db.prepare(`
            SELECT us.*, u.username, u.user_type, u.full_name
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.token_hash = ? AND us.expires_at > datetime('now')
        `);
        return stmt.get(tokenHash);
    }

    deleteSession(tokenHash) {
        const stmt = this.db.prepare('DELETE FROM user_sessions WHERE token_hash = ?');
        return stmt.run(tokenHash);
    }

    // Cleanup expired sessions
    cleanupExpiredSessions() {
        const stmt = this.db.prepare('DELETE FROM user_sessions WHERE expires_at <= datetime("now")');
        return stmt.run();
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

export default dbManager;
