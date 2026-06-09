/**
 * @fileoverview Global error handling middleware.
 *
 * Catches any error thrown or passed via next(err) and returns a
 * consistent JSON response.  In production the stack trace is omitted.
 */

/**
 * Express error-handling middleware (4-argument signature).
 *
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no status code is set
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log full error server-side
  console.error('─────────────────────────────────────────────');
  console.error(`❌ [${new Date().toISOString()}] Error ${statusCode}`);
  console.error(`   Message: ${err.message}`);
  if (!isProduction && err.stack) {
    console.error(`   Stack:\n${err.stack}`);
  }
  console.error('─────────────────────────────────────────────');

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
