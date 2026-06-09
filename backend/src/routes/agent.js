/**
 * @fileoverview AI Agent chat routes.
 *
 * POST /api/agent/chat — Send a message to the Azure AI agent.
 */

const { Router } = require('express');
const azureAgent = require('../services/azureAgent');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

/**
 * POST /api/agent/chat
 * Send a message to the AI agent and get a response.
 *
 * Body: {
 *   message: string,    — The user's message
 *   threadId?: string    — Optional thread ID to continue a conversation
 * }
 *
 * Response: {
 *   success: true,
 *   data: { threadId, response, role }
 * }
 */
router.post('/chat', optionalAuth, async (req, res, next) => {
  try {
    const { message, threadId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty "message" string is required.',
      });
    }

    // Limit message length to prevent abuse
    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 4000 characters.',
      });
    }

    console.log(
      `💬 Agent chat request | user: ${req.user?.id || 'anonymous'} | thread: ${threadId || 'new'}`
    );

    const result = await azureAgent.chat(message.trim(), threadId || null);

    // Optionally log the conversation in Supabase
    try {
      const { supabaseAdmin } = require('../services/supabase');
      await supabaseAdmin.from('agent_conversations').insert({
        user_id: req.user?.id || null,
        thread_id: result.threadId,
        user_message: message.trim(),
        agent_response: result.response,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      // Non-critical — don't fail the request if logging fails
      console.warn('⚠️  Failed to log agent conversation:', logErr.message);
    }

    return res.json({
      success: true,
      data: {
        threadId: result.threadId,
        response: result.response,
        role: result.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
