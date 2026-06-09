/**
 * @fileoverview Authentication middleware.
 *
 * Exports:
 *  - requireAuth   — Rejects unauthenticated requests with 401.
 *  - optionalAuth  — Attaches user if token present, but allows anonymous access.
 */

const { supabaseAdmin } = require('../services/supabase');

/**
 * Extract the Bearer token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

/**
 * Verify a Supabase JWT and return the user object.
 * @param {string} token
 * @returns {Promise<import('@supabase/supabase-js').User|null>}
 */
const verifyToken = async (token) => {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }
  return user;
};

/**
 * Middleware that **requires** a valid Supabase JWT.
 * Attaches the user object to `req.user` and the raw token to `req.token`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a Bearer token.',
      });
    }

    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

/**
 * Middleware that **optionally** attaches the user.
 * If no token is provided or verification fails the request continues
 * anonymously (req.user will be `null`).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await verifyToken(token);
      req.user = user || null;
      req.token = token;
    } else {
      req.user = null;
      req.token = null;
    }
  } catch {
    req.user = null;
    req.token = null;
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
