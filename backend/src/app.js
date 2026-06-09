/**
 * @fileoverview Express application setup.
 * Configures middleware (CORS, Helmet, compression, rate-limiting),
 * mounts API routes, and attaches the global error handler.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

// ---------- Route Imports ----------
const matchesRouter = require('./routes/matches');
const teamsRouter = require('./routes/teams');
const predictionsRouter = require('./routes/predictions');
const agentRouter = require('./routes/agent');
const syncRouter = require('./routes/sync');

const app = express();

// ---------- Security ----------
app.use(helmet());

// ---------- CORS ----------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`⛔ CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
  })
);

// ---------- Body Parsing ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Compression ----------
app.use(compression());

// ---------- Rate Limiting ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again in 15 minutes.',
  },
});

app.use('/api', limiter);

// ---------- Health Check ----------
/**
 * GET /api/health
 * Returns server health status and uptime.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'World Cup 2026 AI Predictor API',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: require('../package.json').version,
    },
  });
});

// ---------- API Routes ----------
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/sync', syncRouter);

// ---------- 404 Catch-all ----------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found. Check the API documentation.',
  });
});

// ---------- Global Error Handler ----------
app.use(errorHandler);

module.exports = app;
