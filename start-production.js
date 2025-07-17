#!/usr/bin/env node

/**
 * TrailTag Production Server Starter
 * This script starts the TrailTag server in production mode
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load production environment variables
require('dotenv').config({ path: '.env.server.production' });

console.log('🚀 Starting TrailTag in Production Mode...');
console.log(`📡 Server will run on port: ${process.env.PORT || 9883}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Ensure required directories exist
const requiredDirs = ['./data', './server/uploads'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Start the server
const serverProcess = spawn('node', ['server/server.js'], {
    stdio: 'inherit',
    env: { ...process.env }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down TrailTag server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down TrailTag server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
});

serverProcess.on('exit', (code) => {
    console.log(`\n📊 Server process exited with code: ${code}`);
    process.exit(code);
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
