#!/usr/bin/env node

// TrailTag Extended API Test Suite
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:9883/api';
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
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
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

// Setup: Login and create test data
async function setupTestData() {
    console.log('\n🔧 Setting up test data...');

    // Admin login
    const adminResult = await apiRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'admin123'
    });

    if (adminResult.success) {
        adminToken = adminResult.data.token;
        logTest('Admin Login Setup', true);
    } else {
        logTest('Admin Login Setup', false, 'Cannot proceed without admin token');
        return false;
    }

    // Create test student
    const studentResult = await apiRequest('POST', '/auth/register', {
        username: 'teststudent2',
        password: 'password123',
        full_name: 'Test Student 2',
        email: 'student2@test.com',
        phone: '+1234567893',
        address: '123 Test St',
        user_type: 'student'
    });

    if (studentResult.success) {
        // Login as student
        const studentLogin = await apiRequest('POST', '/auth/login', {
            username: 'teststudent2',
            password: 'password123'
        });

        if (studentLogin.success) {
            studentToken = studentLogin.data.token;
            logTest('Student Setup', true);
        }
    }

    // Create test parent
    const parentResult = await apiRequest('POST', '/auth/register', {
        username: 'testparent2',
        password: 'password123',
        full_name: 'Test Parent 2',
        email: 'parent2@test.com',
        phone: '+1234567894',
        address: '123 Test St',
        user_type: 'parent'
    });

    if (parentResult.success) {
        // Login as parent
        const parentLogin = await apiRequest('POST', '/auth/login', {
            username: 'testparent2',
            password: 'password123'
        });

        if (parentLogin.success) {
            parentToken = parentLogin.data.token;
            logTest('Parent Setup', true);
        }
    }

    // Create test program
    const programResult = await apiRequest('POST', '/programs', {
        name: 'Extended Test Program',
        description: 'This is an extended test program with rich content',
        location: 'Extended Test Location'
    }, adminToken);

    if (programResult.success) {
        testProgramId = programResult.data.program.id;
        logTest('Test Program Setup', true, `Program ID: ${testProgramId}`);
    }

    // Create test QR code
    if (testProgramId) {
        const qrResult = await apiRequest('POST', '/qrcodes', {
            program_id: testProgramId,
            location_name: 'Extended Test QR Location'
        }, adminToken);

        if (qrResult.success) {
            testQRCodeId = qrResult.data.qrCode.id;
            logTest('Test QR Code Setup', true, `QR Code ID: ${testQRCodeId}`);
        }
    }

    return true;
}

// Test Dashboard Statistics
async function testDashboardStats() {
    console.log('\n📊 Testing Dashboard Statistics...');

    // Admin dashboard stats
    const adminStatsResult = await apiRequest('GET', '/dashboard/admin/stats?days=30', null, adminToken);
    logTest('Admin Dashboard Stats', adminStatsResult.success && adminStatsResult.data.stats,
        adminStatsResult.success ? 'Stats retrieved' : adminStatsResult.error?.message);

    // Student dashboard stats
    const studentStatsResult = await apiRequest('GET', '/dashboard/student/stats?days=30', null, studentToken);
    logTest('Student Dashboard Stats', studentStatsResult.success && studentStatsResult.data.stats,
        studentStatsResult.success ? 'Stats retrieved' : studentStatsResult.error?.message);

    // Parent dashboard stats
    const parentStatsResult = await apiRequest('GET', '/dashboard/parent/stats?days=30', null, parentToken);
    logTest('Parent Dashboard Stats', parentStatsResult.success && parentStatsResult.data.stats,
        parentStatsResult.success ? 'Stats retrieved' : parentStatsResult.error?.message);

    // System health check
    const healthResult = await apiRequest('GET', '/dashboard/system/health', null, adminToken);
    logTest('System Health Check', healthResult.success && healthResult.data.health,
        healthResult.success ? `Status: ${healthResult.data.health.status}` : healthResult.error?.message);
}

// Test Search Functionality
async function testSearchFunctionality() {
    console.log('\n🔍 Testing Search Functionality...');

    // Global search
    const globalSearchResult = await apiRequest('GET', '/search/global?q=test&limit=10', null, adminToken);
    logTest('Global Search', globalSearchResult.success && globalSearchResult.data.results,
        globalSearchResult.success ? `Found ${globalSearchResult.data.totalResults} results` : globalSearchResult.error?.message);

    // Program search with filters
    const programSearchResult = await apiRequest('GET', '/search/programs?q=test&sort_by=check_in_count&sort_order=DESC&page=1&limit=10', null, adminToken);
    logTest('Advanced Program Search', programSearchResult.success && programSearchResult.data.programs,
        programSearchResult.success ? `Found ${programSearchResult.data.programs.length} programs` : programSearchResult.error?.message);

    // Check-in search
    const checkinSearchResult = await apiRequest('GET', '/search/checkins?page=1&limit=10', null, adminToken);
    logTest('Check-in Search', checkinSearchResult.success && checkinSearchResult.data.checkIns,
        checkinSearchResult.success ? `Found ${checkinSearchResult.data.checkIns.length} check-ins` : checkinSearchResult.error?.message);

    // Student-specific search
    const studentSearchResult = await apiRequest('GET', '/search/checkins?page=1&limit=10', null, studentToken);
    logTest('Student Check-in Search', studentSearchResult.success,
        studentSearchResult.success ? 'Student can search own check-ins' : studentSearchResult.error?.message);
}

// Test File Upload (if program exists)
async function testFileUpload() {
    console.log('\n📁 Testing File Upload...');

    if (!testProgramId) {
        logTest('File Upload Tests', false, 'No test program available');
        return;
    }

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload testing.');

    try {
        // Note: This is a simplified test. In a real scenario, you'd use FormData
        // For now, we'll test the endpoint exists and handles missing files correctly
        const uploadResult = await apiRequest('POST', `/programs/${testProgramId}/attachments`, {}, adminToken);
        logTest('File Upload Endpoint', !uploadResult.success && uploadResult.status === 400,
            'Correctly handles missing files');

        // Test get attachments
        const getAttachmentsResult = await apiRequest('GET', `/programs/${testProgramId}/attachments`, null, adminToken);
        logTest('Get Program Attachments', getAttachmentsResult.success && Array.isArray(getAttachmentsResult.data.attachments),
            getAttachmentsResult.success ? `Found ${getAttachmentsResult.data.attachments.length} attachments` : getAttachmentsResult.error?.message);

    } finally {
        // Clean up test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

// Test Advanced Program Features
async function testAdvancedProgramFeatures() {
    console.log('\n🎓 Testing Advanced Program Features...');

    if (!testProgramId) {
        logTest('Advanced Program Tests', false, 'No test program available');
        return;
    }

    // Get program statistics
    const statsResult = await apiRequest('GET', `/programs/${testProgramId}/stats`, null, adminToken);
    logTest('Program Statistics', statsResult.success && statsResult.data.stats,
        statsResult.success ? 'Program stats retrieved' : statsResult.error?.message);

    // Search programs
    const searchResult = await apiRequest('GET', '/programs/search/Extended', null, adminToken);
    logTest('Program Search', searchResult.success && Array.isArray(searchResult.data.programs),
        searchResult.success ? `Found ${searchResult.data.programs.length} programs` : searchResult.error?.message);

    // Get user's programs
    const myProgramsResult = await apiRequest('GET', '/programs/my/programs', null, adminToken);
    logTest('My Programs', myProgramsResult.success && Array.isArray(myProgramsResult.data.programs),
        myProgramsResult.success ? `Found ${myProgramsResult.data.programs.length} user programs` : myProgramsResult.error?.message);
}

// Test QR Code Advanced Features
async function testAdvancedQRCodeFeatures() {
    console.log('\n📱 Testing Advanced QR Code Features...');

    if (!testQRCodeId) {
        logTest('Advanced QR Code Tests', false, 'No test QR code available');
        return;
    }

    // Get QR code statistics
    const statsResult = await apiRequest('GET', `/qrcodes/${testQRCodeId}/stats`, null, adminToken);
    logTest('QR Code Statistics', statsResult.success && statsResult.data.stats,
        statsResult.success ? 'QR code stats retrieved' : statsResult.error?.message);

    // Update QR code
    const updateResult = await apiRequest('PUT', `/qrcodes/${testQRCodeId}`, {
        location_name: 'Updated Extended Test QR Location'
    }, adminToken);
    logTest('Update QR Code', updateResult.success,
        updateResult.success ? 'QR code updated' : updateResult.error?.message);
}

// Test Check-in Summary (Admin)
async function testCheckInSummary() {
    console.log('\n📈 Testing Check-in Summary...');

    const summaryResult = await apiRequest('GET', '/checkins/summary?days=7', null, adminToken);
    logTest('Check-in Summary', summaryResult.success && summaryResult.data.summary,
        summaryResult.success ? 'Summary retrieved' : summaryResult.error?.message);
}

// Test Error Handling
async function testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');

    // Test invalid endpoints
    const invalidResult = await apiRequest('GET', '/invalid/endpoint', null, adminToken);
    logTest('Invalid Endpoint', !invalidResult.success && invalidResult.status === 404,
        'Correctly returns 404 for invalid endpoints');

    // Test unauthorized access
    const unauthorizedResult = await apiRequest('GET', '/dashboard/admin/stats', null, studentToken);
    logTest('Unauthorized Access', !unauthorizedResult.success && unauthorizedResult.status === 403,
        'Correctly blocks unauthorized access');

    // Test invalid data
    const invalidDataResult = await apiRequest('POST', '/programs', {
        name: '', // Empty name should fail
        description: 'Test'
    }, adminToken);
    logTest('Invalid Data Handling', !invalidDataResult.success && invalidDataResult.status === 400,
        'Correctly validates required fields');
}

// Main test runner
async function runExtendedTests() {
    console.log('🚀 Starting TrailTag Extended API Test Suite...\n');

    try {
        const setupSuccess = await setupTestData();
        if (!setupSuccess) {
            console.log('❌ Setup failed, aborting tests');
            return;
        }

        await testDashboardStats();
        await testSearchFunctionality();
        await testFileUpload();
        await testAdvancedProgramFeatures();
        await testAdvancedQRCodeFeatures();
        await testCheckInSummary();
        await testErrorHandling();

        // Summary
        console.log('\n📊 Extended Test Summary:');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.tests.filter(t => !t.success).forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        }

        console.log('\n🎉 Extended API testing completed!');

    } catch (error) {
        console.error('Extended test suite failed:', error);
    }
}

// Run tests
if (require.main === module) {
    runExtendedTests();
}

module.exports = { runExtendedTests };
