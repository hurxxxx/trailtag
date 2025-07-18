const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize database connection
        const dbPath = path.join(dataDir, 'trailtag.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                throw err;
            }
            console.log('Connected to SQLite database');
        });

        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON');

        // Initialize schema
        this.initializeSchema();
    }

    initializeSchema() {
        const schema = `
            -- Users table for students, parents, and admins
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                user_type TEXT CHECK(user_type IN ('student', 'parent', 'admin')) NOT NULL,
                timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
                language VARCHAR(10) DEFAULT 'ko',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Learning programs table
            CREATE TABLE IF NOT EXISTS learning_programs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                location VARCHAR(200),
                start_datetime DATETIME,
                end_datetime DATETIME,
                created_by INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

            -- QR codes table for each program
            CREATE TABLE IF NOT EXISTS qr_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                program_id INTEGER NOT NULL UNIQUE,
                qr_code_data VARCHAR(255) UNIQUE NOT NULL,
                qr_image_version INTEGER DEFAULT 1,
                current_timestamp BIGINT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (program_id) REFERENCES learning_programs(id) ON DELETE CASCADE
            );

            -- Check-ins table to track student participation
            CREATE TABLE IF NOT EXISTS check_ins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                program_id INTEGER NOT NULL,
                qr_code_id INTEGER NOT NULL,
                check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                location VARCHAR(200),
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (program_id) REFERENCES learning_programs(id),
                FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
            );

            -- Parent-student relationships table
            CREATE TABLE IF NOT EXISTS parent_student_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                relationship_type VARCHAR(50) DEFAULT 'parent',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES users(id),
                FOREIGN KEY (student_id) REFERENCES users(id),
                UNIQUE(parent_id, student_id)
            );

            -- Program attachments table for rich text editor files
            CREATE TABLE IF NOT EXISTS program_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                program_id INTEGER NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                file_size INTEGER,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (program_id) REFERENCES learning_programs(id) ON DELETE CASCADE
            );

            -- Sessions table for JWT token management
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
            CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
            CREATE INDEX IF NOT EXISTS idx_check_ins_student ON check_ins(student_id);
            CREATE INDEX IF NOT EXISTS idx_check_ins_program ON check_ins(program_id);
            CREATE INDEX IF NOT EXISTS idx_check_ins_time ON check_ins(check_in_time);
            CREATE INDEX IF NOT EXISTS idx_qr_codes_program ON qr_codes(program_id);
            CREATE INDEX IF NOT EXISTS idx_qr_codes_data ON qr_codes(qr_code_data);
            CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student_relationships(parent_id);
            CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student_relationships(student_id);
        `;

        // Execute schema
        this.db.exec(schema, (err) => {
            if (err) {
                console.error('Error creating schema:', err);
                throw err;
            }
            console.log('Database schema initialized');
            this.runMigrations();
            this.createDefaultAdmin();
            this.createTestUsers();
        });
    }

    runMigrations() {
        // Add timezone and language columns if they don't exist
        this.db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                console.error('Error checking table info:', err);
                return;
            }

            const hasTimezone = columns.some(col => col.name === 'timezone');
            const hasLanguage = columns.some(col => col.name === 'language');

            if (!hasTimezone) {
                this.db.run("ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Seoul'", (err) => {
                    if (err) {
                        console.error('Error adding timezone column:', err);
                    } else {
                        console.log('Added timezone column to users table');
                    }
                });
            }

            if (!hasLanguage) {
                this.db.run("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'ko'", (err) => {
                    if (err) {
                        console.error('Error adding language column:', err);
                    } else {
                        console.log('Added language column to users table');
                    }
                });
            }
        });
    }

    createDefaultAdmin() {
        const bcrypt = require('bcryptjs');

        // Check if admin already exists
        this.db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
            if (err) {
                console.error('Error checking for admin user:', err);
                return;
            }

            if (!row) {
                // Create default admin user
                const saltRounds = 10;
                bcrypt.hash('admin123', saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error hashing admin password:', err);
                        return;
                    }

                    const stmt = this.db.prepare(`
                        INSERT INTO users (username, password_hash, full_name, email, phone, user_type)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `);

                    stmt.run([
                        'admin',
                        hash,
                        'System Administrator',
                        'admin@trailtag.com',
                        '1234567890',
                        'admin'
                    ], function (err) {
                        if (err) {
                            console.error('Error creating admin user:', err);
                        } else {
                            console.log('Default admin user created (username: admin, password: admin123)');
                        }
                    });

                    stmt.finalize();
                });
            } else {
                console.log('Admin user already exists');
            }
        });
    }

    createTestUsers() {
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;

        // Test users to create
        const testUsers = [
            {
                username: 'user1',
                password: 'test1234!',
                full_name: '허건우',
                email: 'user1@example.com',
                phone: '01012341234',
                address: '서울시 강남구',
                user_type: 'student'
            },
            {
                username: 'parent1',
                password: 'test1234!',
                full_name: '김학부모',
                email: 'parent1@example.com',
                phone: '01012345678',
                address: '서울시 서초구',
                user_type: 'parent'
            }
        ];

        testUsers.forEach(userData => {
            // Check if user already exists
            this.db.get('SELECT id FROM users WHERE username = ?', [userData.username], (err, row) => {
                if (err) {
                    console.error(`Error checking for user ${userData.username}:`, err);
                    return;
                }

                if (!row) {
                    // Create user
                    bcrypt.hash(userData.password, saltRounds, (err, hash) => {
                        if (err) {
                            console.error(`Error hashing password for ${userData.username}:`, err);
                            return;
                        }

                        const stmt = this.db.prepare(`
                            INSERT INTO users (username, password_hash, full_name, email, phone, user_type)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `);

                        stmt.run([
                            userData.username,
                            hash,
                            userData.full_name,
                            userData.email,
                            userData.phone,
                            userData.user_type
                        ], function (err) {
                            if (err) {
                                console.error(`Error creating user ${userData.username}:`, err);
                            } else {
                                console.log(`Test user created: ${userData.username} (${userData.user_type})`);
                            }
                        });

                        stmt.finalize();
                    });
                }
            });
        });
    }

    // Helper method to run queries with promises
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper method to get single row with promises
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Helper method to get all rows with promises
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

// Create singleton instance
const database = new Database();

module.exports = database;
