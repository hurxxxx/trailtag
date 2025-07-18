-- TrailTag Database Schema
-- SQLite database for learning program tracking application

-- Users table for students, parents, and admins
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    user_type ENUM('student', 'parent', 'admin') NOT NULL,
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
    created_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- QR codes table for each program location
CREATE TABLE IF NOT EXISTS qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    qr_code_data VARCHAR(255) UNIQUE NOT NULL,
    location_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, full_name, email, phone, address, user_type) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@trailtag.com', '+1234567890', 'System', 'admin');
