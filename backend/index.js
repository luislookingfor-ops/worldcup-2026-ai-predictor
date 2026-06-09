/**
 * @fileoverview Entry point for the World Cup 2026 AI Predictor API.
 * Loads environment variables, imports the Express app, and starts the server.
 */

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`\n🏆 World Cup 2026 AI Predictor API`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// ---------- Graceful Shutdown ----------

/**
 * Handles graceful shutdown on SIGTERM / SIGINT signals.
 * @param {string} signal - The signal received.
 */
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
