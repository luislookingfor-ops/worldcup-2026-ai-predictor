/**
 * @fileoverview Supabase client configuration.
 *
 * Exports:
 *  - supabaseAdmin  — Service-role client with full access (server-side only).
 *  - createUserClient(accessToken) — Creates a client scoped to the
 *    authenticated user's Row-Level Security context.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required env vars at startup
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.'
  );
}

/**
 * Admin Supabase client — bypasses Row-Level Security.
 * Use only for server-side operations that need elevated privileges
 * (e.g. syncing data, admin queries).
 */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Creates a Supabase client scoped to the requesting user.
 * RLS policies will be enforced based on the user's JWT.
 *
 * @param {string} accessToken - The user's Supabase access (JWT) token.
 * @returns {import('@supabase/supabase-js').SupabaseClient} A scoped client.
 */
const createUserClient = (accessToken) => {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

module.exports = { supabaseAdmin, createUserClient };
