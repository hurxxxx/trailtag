const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const database = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const qrCodeRoutes = require('./routes/qrcodes');
const checkInRoutes = require('./routes/checkins');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting (when behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// Rate limiting - 개발 환경에서는 매우 관대하게 설정
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 1000, // IP당 1분에 1000 요청 허용 (개발용)
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
        // 개발 환경에서는 localhost 요청은 rate limit 제외
        return process.env.NODE_ENV === 'development' &&
            (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.includes('localhost'));
    }
});

// 프로덕션 환경에서만 rate limiting 적용
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
}

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? function (origin, callback) {
            // 프로덕션에서는 같은 서버에서 서빙하므로 origin이 없을 수 있음
            // 또는 특정 도메인들을 허용
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            } else {
                callback(null, true); // 임시로 모든 origin 허용 (보안상 주의!)
            }
        }
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:9883'],
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes (먼저 처리)
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/qrcodes', qrCodeRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

// Serve static files from the React app build (production only)
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '../dist');
    console.log('Static files path:', staticPath);
    app.use(express.static(staticPath, {
        setHeaders: (res, path) => {
            console.log('Serving static file:', path);
            if (path.endsWith('.js')) {
                res.setHeader('Content-Type', 'text/javascript');
            } else if (path.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            }
        }
    }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body'
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File too large'
        });
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Catch all handler: send back React's index.html file (production only)
if (process.env.NODE_ENV === 'production') {
    // Handle React Router routes - serve index.html for all non-API and non-static routes
    app.use((req, res, next) => {
        console.log('Catch-all handler - Request path:', req.path);

        // Skip if it's an API route
        if (req.path.startsWith('/api/')) {
            console.log('Skipping API route:', req.path);
            return next();
        }
        // Skip if it's a static asset (already handled by express.static)
        if (req.path.startsWith('/assets/') || req.path.startsWith('/uploads/')) {
            console.log('Skipping static asset:', req.path);
            return next();
        }

        console.log('Serving index.html for:', req.path);
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrailTag API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`External access: http://[YOUR_IP]:${PORT}/api/health`);
    console.log(`Listening on all interfaces (0.0.0.0:${PORT})`);
});

module.exports = app;
