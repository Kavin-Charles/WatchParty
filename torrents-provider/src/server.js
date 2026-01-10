const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all origins for development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'WatchParty Torrents Provider',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            search: '/api/:site/:query/:page?',
            allSites: '/api/all/:query/:page?',
            sites: '/api/sites'
        },
        supportedSites: [
            '1337x', 'yts', 'eztv', 'tgx', 'torlock', 'piratebay',
            'nyaasi', 'rarbg', 'ettv', 'zooqle', 'kickass', 'bitsearch',
            'glodls', 'magnetdl', 'limetorrent', 'torrentfunk', 'torrentproject'
        ],
        queryParams: {
            quality: 'Filter by quality (720p, 1080p, 2160p, 4k)',
            sortBy: 'Sort results (seeders, leechers, size, date)',
            order: 'Sort order (asc, desc)',
            limit: 'Limit number of results'
        }
    });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: {
            search: '/api/:site/:query/:page?',
            allSites: '/api/all/:query/:page?',
            sites: '/api/sites'
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║       WatchParty Torrents Provider API                    ║
║       Running on http://localhost:${PORT}                    ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
