#!/usr/bin/env node

// TrailTag API Test Suite
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let adminToken = '';
let studentToken = '';
let parentToken = '';
let testProgramId = '';
let testQRCodeId = '';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(name, success, message = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
    
    results.tests.push({ name, success, message });
    if (success) results.passed++;
    else results.failed++;
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Test 1: Health Check
async function testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    const result = await apiRequest('GET', '/health');
    logTest('Health Check', result.success && result.data.status === 'OK');
}

// Test 2: Admin Login
async function testAdminLogin() {
    console.log('\n🔐 Testing Admin Authentication...');
    
    const result = await apiRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'admin123'
    });
    
    if (result.success && result.data.token) {
        adminToken = result.data.token;
        logTest('Admin Login', true, 'Token received');
    } else {
        logTest('Admin Login', false, result.error?.message || 'No token received');
    }
}

// Test 3: User Registration
async function testUserRegistration() {
    console.log('\n👤 Testing User Registration...');
    
    // Register a student
    const studentResult = await apiRequest('POST', '/auth/register', {
        username: 'teststudent',
        password: 'password123',
        full_name: 'Test Student',
        email: 'student@test.com',
        phone: '+1234567891',
        address: '123 Test St',
        user_type: 'student'
    });
    
    logTest('Student Registration', studentResult.success, 
        studentResult.success ? 'Student created' : studentResult.error?.message);
    
    // Register a parent
    const parentResult = await apiRequest('POST', '/auth/register', {
        username: 'testparent',
        password: 'password123',
        full_name: 'Test Parent',
        email: 'parent@test.com',
        phone: '+1234567892',
        address: '123 Test St',
        user_type: 'parent'
    });
    
    logTest('Parent Registration', parentResult.success,
        parentResult.success ? 'Parent created' : parentResult.error?.message);
}

// Test 4: Student and Parent Login
async function testUserLogins() {
    console.log('\n🔑 Testing User Logins...');
    
    // Student login
    const studentResult = await apiRequest('POST', '/auth/login', {
        username: 'teststudent',
        password: 'password123'
    });
    
    if (studentResult.success && studentResult.data.token) {
        studentToken = studentResult.data.token;
        logTest('Student Login', true, 'Token received');
    } else {
        logTest('Student Login', false, studentResult.error?.message || 'No token received');
    }
    
    // Parent login
    const parentResult = await apiRequest('POST', '/auth/login', {
        username: 'testparent',
        password: 'password123'
    });
    
    if (parentResult.success && parentResult.data.token) {
        parentToken = parentResult.data.token;
        logTest('Parent Login', true, 'Token received');
    } else {
        logTest('Parent Login', false, parentResult.error?.message || 'No token received');
    }
}

// Test 5: Program Management
async function testProgramManagement() {
    console.log('\n📚 Testing Program Management...');
    
    // Create program (admin only)
    const createResult = await apiRequest('POST', '/programs', {
        name: 'Test Learning Program',
        description: 'This is a test program for API testing',
        location: 'Test Location'
    }, adminToken);
    
    if (createResult.success && createResult.data.program) {
        testProgramId = createResult.data.program.id;
        logTest('Create Program', true, `Program ID: ${testProgramId}`);
    } else {
        logTest('Create Program', false, createResult.error?.message);
    }
    
    // Get all programs
    const getResult = await apiRequest('GET', '/programs', null, adminToken);
    logTest('Get Programs', getResult.success && Array.isArray(getResult.data.programs),
        getResult.success ? `Found ${getResult.data.programs.length} programs` : getResult.error?.message);
    
    // Update program
    if (testProgramId) {
        const updateResult = await apiRequest('PUT', `/programs/${testProgramId}`, {
            description: 'Updated test program description'
        }, adminToken);
        
        logTest('Update Program', updateResult.success,
            updateResult.success ? 'Program updated' : updateResult.error?.message);
    }
    
    // Test unauthorized access (student trying to create program)
    const unauthorizedResult = await apiRequest('POST', '/programs', {
        name: 'Unauthorized Program',
        description: 'This should fail'
    }, studentToken);
    
    logTest('Unauthorized Program Creation', !unauthorizedResult.success && unauthorizedResult.status === 403,
        'Correctly blocked unauthorized access');
}

// Test 6: QR Code Management
async function testQRCodeManagement() {
    console.log('\n📱 Testing QR Code Management...');
    
    if (!testProgramId) {
        logTest('QR Code Tests', false, 'No test program available');
        return;
    }
    
    // Create QR code
    const createResult = await apiRequest('POST', '/qrcodes', {
        program_id: testProgramId,
        location_name: 'Test QR Location'
    }, adminToken);
    
    if (createResult.success && createResult.data.qrCode) {
        testQRCodeId = createResult.data.qrCode.id;
        logTest('Create QR Code', true, `QR Code ID: ${testQRCodeId}`);
    } else {
        logTest('Create QR Code', false, createResult.error?.message);
    }
    
    // Get QR codes
    const getResult = await apiRequest('GET', '/qrcodes', null, adminToken);
    logTest('Get QR Codes', getResult.success && Array.isArray(getResult.data.qrCodes),
        getResult.success ? `Found ${getResult.data.qrCodes.length} QR codes` : getResult.error?.message);
    
    // Get QR codes by program
    const getByProgramResult = await apiRequest('GET', `/qrcodes/program/${testProgramId}`, null, adminToken);
    logTest('Get QR Codes by Program', getByProgramResult.success,
        getByProgramResult.success ? `Found ${getByProgramResult.data.qrCodes.length} QR codes for program` : getByProgramResult.error?.message);
}

// Test 7: Check-in System
async function testCheckInSystem() {
    console.log('\n✅ Testing Check-in System...');
    
    if (!testQRCodeId) {
        logTest('Check-in Tests', false, 'No test QR code available');
        return;
    }
    
    // First get the QR code data
    const qrResult = await apiRequest('GET', '/qrcodes', null, adminToken);
    if (!qrResult.success || !qrResult.data.qrCodes.length) {
        logTest('Check-in Tests', false, 'No QR codes found');
        return;
    }
    
    const qrCodeData = qrResult.data.qrCodes[0].qr_code_data;
    
    // Validate QR code
    const validateResult = await apiRequest('POST', '/qrcodes/validate', {
        qr_code_data: qrCodeData
    }, studentToken);
    
    logTest('Validate QR Code', validateResult.success,
        validateResult.success ? 'QR code is valid' : validateResult.error?.message);
    
    // Student check-in
    const checkInResult = await apiRequest('POST', '/checkins', {
        qr_code_data: qrCodeData
    }, studentToken);
    
    logTest('Student Check-in', checkInResult.success,
        checkInResult.success ? 'Check-in successful' : checkInResult.error?.message);
    
    // Get check-in history
    const historyResult = await apiRequest('GET', '/checkins/history', null, studentToken);
    logTest('Get Check-in History', historyResult.success && Array.isArray(historyResult.data.checkIns),
        historyResult.success ? `Found ${historyResult.data.checkIns.length} check-ins` : historyResult.error?.message);
    
    // Get today's check-ins
    const todayResult = await apiRequest('GET', '/checkins/today', null, studentToken);
    logTest('Get Today Check-ins', todayResult.success,
        todayResult.success ? `Found ${todayResult.data.checkIns.length} today's check-ins` : todayResult.error?.message);
    
    // Get student stats
    const statsResult = await apiRequest('GET', '/checkins/stats', null, studentToken);
    logTest('Get Student Stats', statsResult.success,
        statsResult.success ? 'Stats retrieved' : statsResult.error?.message);
}

// Test 8: Parent-Student Relationship
async function testParentStudentRelationship() {
    console.log('\n👨‍👩‍👧‍👦 Testing Parent-Student Relationships...');
    
    // Search for students
    const searchResult = await apiRequest('GET', '/users/students/search?name=Test Student', null, parentToken);
    logTest('Search Students', searchResult.success && Array.isArray(searchResult.data.students),
        searchResult.success ? `Found ${searchResult.data.students.length} students` : searchResult.error?.message);
    
    if (searchResult.success && searchResult.data.students.length > 0) {
        const studentId = searchResult.data.students[0].id;
        
        // Add student to parent's monitoring list
        const addResult = await apiRequest('POST', '/users/add-student', {
            student_id: studentId,
            relationship_type: 'parent'
        }, parentToken);
        
        logTest('Add Student to Parent', addResult.success,
            addResult.success ? 'Student added to monitoring list' : addResult.error?.message);
        
        // Get parent's students
        const myStudentsResult = await apiRequest('GET', '/users/my-students', null, parentToken);
        logTest('Get My Students', myStudentsResult.success && Array.isArray(myStudentsResult.data.students),
            myStudentsResult.success ? `Found ${myStudentsResult.data.students.length} monitored students` : myStudentsResult.error?.message);
        
        // Get student's check-in history (as parent)
        const studentHistoryResult = await apiRequest('GET', `/checkins/student/${studentId}/history`, null, parentToken);
        logTest('Get Student History (Parent)', studentHistoryResult.success,
            studentHistoryResult.success ? `Found ${studentHistoryResult.data.checkIns.length} check-ins` : studentHistoryResult.error?.message);
    }
}

// Test 9: Admin User Management
async function testAdminUserManagement() {
    console.log('\n👑 Testing Admin User Management...');
    
    // Get all users
    const getUsersResult = await apiRequest('GET', '/users', null, adminToken);
    logTest('Get All Users', getUsersResult.success && Array.isArray(getUsersResult.data.users),
        getUsersResult.success ? `Found ${getUsersResult.data.users.length} users` : getUsersResult.error?.message);
    
    // Get users by type
    const getStudentsResult = await apiRequest('GET', '/users?user_type=student', null, adminToken);
    logTest('Get Students Only', getStudentsResult.success,
        getStudentsResult.success ? `Found ${getStudentsResult.data.users.length} students` : getStudentsResult.error?.message);
}

// Test 10: Authentication and Authorization
async function testAuthAndAuth() {
    console.log('\n🔒 Testing Authentication & Authorization...');
    
    // Test accessing protected route without token
    const noTokenResult = await apiRequest('GET', '/programs');
    logTest('No Token Access', !noTokenResult.success && noTokenResult.status === 401,
        'Correctly blocked access without token');
    
    // Test accessing admin route with student token
    const wrongRoleResult = await apiRequest('POST', '/programs', {
        name: 'Should Fail',
        description: 'This should fail'
    }, studentToken);
    logTest('Wrong Role Access', !wrongRoleResult.success && wrongRoleResult.status === 403,
        'Correctly blocked student from admin function');
    
    // Test token verification
    const meResult = await apiRequest('GET', '/auth/me', null, adminToken);
    logTest('Token Verification', meResult.success && meResult.data.user,
        meResult.success ? `Verified user: ${meResult.data.user.username}` : meResult.error?.message);
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting TrailTag API Test Suite...\n');
    
    try {
        await testHealthCheck();
        await testAdminLogin();
        await testUserRegistration();
        await testUserLogins();
        await testProgramManagement();
        await testQRCodeManagement();
        await testCheckInSystem();
        await testParentStudentRelationship();
        await testAdminUserManagement();
        await testAuthAndAuth();
        
        // Summary
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
        
        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.tests.filter(t => !t.success).forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        }
        
    } catch (error) {
        console.error('Test suite failed:', error);
    }
}

// Install axios if not available and run tests
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };
