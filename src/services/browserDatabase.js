// Browser-compatible database service using localStorage
// This is a temporary solution for development - in production, this would be replaced with a proper backend

class BrowserDatabase {
    constructor() {
        this.initializeData();
    }

    // Reset database for testing
    resetDatabase() {
        localStorage.removeItem('trailtag_users');
        localStorage.removeItem('trailtag_learning_programs');
        localStorage.removeItem('trailtag_qr_codes');
        localStorage.removeItem('trailtag_check_ins');
        localStorage.removeItem('trailtag_parent_student_relationships');
        localStorage.removeItem('trailtag_user_sessions');
        localStorage.removeItem('trailtag_next_id');
        this.initializeData();
        console.log('Database reset complete. Admin login: admin / admin123');
    }

    initializeData() {
        // Initialize default data if not exists
        if (!localStorage.getItem('trailtag_users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password_hash: 'admin123_hash', // admin123
                    full_name: 'System Administrator',
                    email: 'admin@trailtag.com',
                    phone: '+1234567890',
                    address: 'System',
                    user_type: 'admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('trailtag_users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('trailtag_learning_programs')) {
            localStorage.setItem('trailtag_learning_programs', JSON.stringify([]));
        }

        if (!localStorage.getItem('trailtag_qr_codes')) {
            localStorage.setItem('trailtag_qr_codes', JSON.stringify([]));
        }

        if (!localStorage.getItem('trailtag_check_ins')) {
            localStorage.setItem('trailtag_check_ins', JSON.stringify([]));
        }

        if (!localStorage.getItem('trailtag_parent_student_relationships')) {
            localStorage.setItem('trailtag_parent_student_relationships', JSON.stringify([]));
        }

        if (!localStorage.getItem('trailtag_user_sessions')) {
            localStorage.setItem('trailtag_user_sessions', JSON.stringify([]));
        }

        if (!localStorage.getItem('trailtag_next_id')) {
            localStorage.setItem('trailtag_next_id', '2'); // Start from 2 since admin is 1
        }
    }

    getNextId() {
        const nextId = parseInt(localStorage.getItem('trailtag_next_id') || '1');
        localStorage.setItem('trailtag_next_id', (nextId + 1).toString());
        return nextId;
    }

    // User operations
    createUser(userData) {
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
        const newUser = {
            id: this.getNextId(),
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('trailtag_users', JSON.stringify(users));
        return { lastInsertRowid: newUser.id, changes: 1 };
    }

    getUserByUsername(username) {
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
        return users.find(user => user.username === username);
    }

    getUserByEmail(email) {
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
        return users.find(user => user.email === email);
    }

    getUserById(id) {
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
        return users.find(user => user.id === id);
    }

    searchStudentsByNameAndPhone(name, phone) {
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');
        return users.filter(user =>
            user.user_type === 'student' &&
            (user.full_name.toLowerCase().includes(name.toLowerCase()) ||
                user.phone.includes(phone))
        ).map(user => ({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone
        }));
    }

    // Learning program operations
    createLearningProgram(programData) {
        const programs = JSON.parse(localStorage.getItem('trailtag_learning_programs') || '[]');
        const newProgram = {
            id: this.getNextId(),
            ...programData,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        programs.push(newProgram);
        localStorage.setItem('trailtag_learning_programs', JSON.stringify(programs));
        return { lastInsertRowid: newProgram.id, changes: 1 };
    }

    getAllLearningPrograms() {
        const programs = JSON.parse(localStorage.getItem('trailtag_learning_programs') || '[]');
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');

        return programs
            .filter(program => program.is_active)
            .map(program => {
                const creator = users.find(user => user.id === program.created_by);
                return {
                    ...program,
                    creator_name: creator ? creator.full_name : 'Unknown'
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    getLearningProgramById(id) {
        const programs = JSON.parse(localStorage.getItem('trailtag_learning_programs') || '[]');
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');

        const program = programs.find(p => p.id === id);
        if (program) {
            const creator = users.find(user => user.id === program.created_by);
            return {
                ...program,
                creator_name: creator ? creator.full_name : 'Unknown'
            };
        }
        return null;
    }

    // QR code operations
    createQRCode(qrData) {
        const qrCodes = JSON.parse(localStorage.getItem('trailtag_qr_codes') || '[]');
        const newQRCode = {
            id: this.getNextId(),
            ...qrData,
            is_active: true,
            created_at: new Date().toISOString()
        };
        qrCodes.push(newQRCode);
        localStorage.setItem('trailtag_qr_codes', JSON.stringify(qrCodes));
        return { lastInsertRowid: newQRCode.id, changes: 1 };
    }

    getQRCodeByData(qrCodeData) {
        const qrCodes = JSON.parse(localStorage.getItem('trailtag_qr_codes') || '[]');
        const programs = JSON.parse(localStorage.getItem('trailtag_learning_programs') || '[]');

        const qrCode = qrCodes.find(qr => qr.qr_code_data === qrCodeData && qr.is_active);
        if (qrCode) {
            const program = programs.find(p => p.id === qrCode.program_id && p.is_active);
            if (program) {
                return {
                    ...qrCode,
                    program_name: program.name,
                    program_description: program.description
                };
            }
        }
        return null;
    }

    getQRCodesByProgramId(programId) {
        const qrCodes = JSON.parse(localStorage.getItem('trailtag_qr_codes') || '[]');
        return qrCodes
            .filter(qr => qr.program_id === programId && qr.is_active)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Check-in operations
    createCheckIn(checkInData) {
        const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
        const newCheckIn = {
            id: this.getNextId(),
            ...checkInData,
            check_in_time: new Date().toISOString()
        };
        checkIns.push(newCheckIn);
        localStorage.setItem('trailtag_check_ins', JSON.stringify(checkIns));
        return { lastInsertRowid: newCheckIn.id, changes: 1 };
    }

    getStudentCheckIns(studentId, limit = 50) {
        const checkIns = JSON.parse(localStorage.getItem('trailtag_check_ins') || '[]');
        const programs = JSON.parse(localStorage.getItem('trailtag_learning_programs') || '[]');
        const qrCodes = JSON.parse(localStorage.getItem('trailtag_qr_codes') || '[]');

        return checkIns
            .filter(ci => ci.student_id === studentId)
            .map(ci => {
                const program = programs.find(p => p.id === ci.program_id);
                const qrCode = qrCodes.find(qr => qr.id === ci.qr_code_id);
                return {
                    ...ci,
                    program_name: program ? program.name : 'Unknown Program',
                    program_description: program ? program.description : '',
                    qr_location: qrCode ? qrCode.location_name : 'Unknown Location'
                };
            })
            .sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time))
            .slice(0, limit);
    }

    // Parent-student relationship operations
    createParentStudentRelationship(parentId, studentId, relationshipType = 'parent') {
        const relationships = JSON.parse(localStorage.getItem('trailtag_parent_student_relationships') || '[]');

        // Check if relationship already exists
        const existing = relationships.find(r => r.parent_id === parentId && r.student_id === studentId);
        if (existing) {
            return { changes: 0 };
        }

        const newRelationship = {
            id: this.getNextId(),
            parent_id: parentId,
            student_id: studentId,
            relationship_type: relationshipType,
            created_at: new Date().toISOString()
        };
        relationships.push(newRelationship);
        localStorage.setItem('trailtag_parent_student_relationships', JSON.stringify(relationships));
        return { lastInsertRowid: newRelationship.id, changes: 1 };
    }

    getStudentsByParentId(parentId) {
        const relationships = JSON.parse(localStorage.getItem('trailtag_parent_student_relationships') || '[]');
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');

        return relationships
            .filter(r => r.parent_id === parentId)
            .map(r => {
                const student = users.find(u => u.id === r.student_id);
                return student ? {
                    id: student.id,
                    username: student.username,
                    full_name: student.full_name,
                    email: student.email,
                    phone: student.phone,
                    relationship_type: r.relationship_type
                } : null;
            })
            .filter(Boolean);
    }

    // Session management (simplified for browser)
    createSession(userId, tokenHash, expiresAt) {
        const sessions = JSON.parse(localStorage.getItem('trailtag_user_sessions') || '[]');
        const newSession = {
            id: this.getNextId(),
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        };
        sessions.push(newSession);
        localStorage.setItem('trailtag_user_sessions', JSON.stringify(sessions));
        return { lastInsertRowid: newSession.id, changes: 1 };
    }

    getSessionByToken(tokenHash) {
        const sessions = JSON.parse(localStorage.getItem('trailtag_user_sessions') || '[]');
        const users = JSON.parse(localStorage.getItem('trailtag_users') || '[]');

        const session = sessions.find(s => s.token_hash === tokenHash && new Date(s.expires_at) > new Date());
        if (session) {
            const user = users.find(u => u.id === session.user_id);
            return user ? {
                ...session,
                username: user.username,
                user_type: user.user_type,
                full_name: user.full_name
            } : null;
        }
        return null;
    }

    deleteSession(tokenHash) {
        const sessions = JSON.parse(localStorage.getItem('trailtag_user_sessions') || '[]');
        const filteredSessions = sessions.filter(s => s.token_hash !== tokenHash);
        localStorage.setItem('trailtag_user_sessions', JSON.stringify(filteredSessions));
        return { changes: sessions.length - filteredSessions.length };
    }

    cleanupExpiredSessions() {
        const sessions = JSON.parse(localStorage.getItem('trailtag_user_sessions') || '[]');
        const validSessions = sessions.filter(s => new Date(s.expires_at) > new Date());
        localStorage.setItem('trailtag_user_sessions', JSON.stringify(validSessions));
        return { changes: sessions.length - validSessions.length };
    }
}

// Create singleton instance
const browserDatabase = new BrowserDatabase();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    window.resetTrailTagDB = () => browserDatabase.resetDatabase();
}

export default browserDatabase;
