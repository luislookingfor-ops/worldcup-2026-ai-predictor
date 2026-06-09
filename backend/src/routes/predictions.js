/**
 * @fileoverview Predictions routes.
 *
 * POST /api/predictions           — Submit a match prediction (auth required)
 * GET  /api/predictions/my        — Get current user's predictions (auth required)
 * GET  /api/predictions/leaderboard — Public leaderboard
 */

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin, createUserClient } = require('../services/supabase');

const router = Router();

/**
 * POST /api/predictions
 * Submit a prediction for a match.
 * Body: { matchId, predictedHomeScore, predictedAwayScore }
 *
 * Requires authentication.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { matchId, predictedHomeScore, predictedAwayScore } = req.body;

    // Validation
    if (
      matchId === undefined ||
      predictedHomeScore === undefined ||
      predictedAwayScore === undefined
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: matchId, predictedHomeScore, predictedAwayScore.',
      });
    }

    const homeScore = Number(predictedHomeScore);
    const awayScore = Number(predictedAwayScore);

    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'Scores must be non-negative integers.',
      });
    }

    // Check if match exists and is still SCHEDULED / TIMED
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('status, external_id, home_team_name, away_team_name, utc_date')
      .eq('external_id', Number(matchId))
      .single();

    if (match && !['SCHEDULED', 'TIMED'].includes(match.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot predict a match that has already started or finished.',
      });
    }

    // Upsert prediction (one per user per match)
    const { data, error } = await supabaseAdmin.from('predictions').upsert(
      {
        user_id: req.user.id,
        match_external_id: Number(matchId),
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_external_id' }
    ).select();

    if (error) {
      console.error('❌ Prediction upsert error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save prediction.',
      });
    }

    console.log(
      `📝 User ${req.user.id} predicted match ${matchId}: ${homeScore}-${awayScore}`
    );

    return res.status(201).json({
      success: true,
      data: data?.[0] || {
        match_external_id: Number(matchId),
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/predictions/my
 * Get the authenticated user's predictions with match details.
 *
 * Requires authentication.
 */
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('predictions')
      .select(`
        *,
        matches:match_external_id (
          external_id,
          home_team_name,
          away_team_name,
          home_score,
          away_score,
          status,
          utc_date,
          stage,
          group
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch user predictions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch predictions.',
      });
    }

    // Map matches to include id
    const mappedData = (data || []).map((p) => {
      if (p.matches) {
        return {
          ...p,
          matches: {
            id: p.matches.external_id,
            ...p.matches,
          },
        };
      }
      return p;
    });

    // Calculate summary stats
    const totalPoints = mappedData.reduce(
      (sum, p) => sum + (p.points_earned || 0),
      0
    );
    const scored = mappedData.filter(
      (p) => p.points_earned !== null && p.points_earned !== undefined
    );

    return res.json({
      success: true,
      data: mappedData,
      summary: {
        total: mappedData.length,
        scored: scored.length,
        pending: mappedData.length - scored.length,
        totalPoints,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/predictions/leaderboard
 * Public leaderboard — no authentication required.
 *
 * Query params:
 *   ?limit=20   — Number of entries (default 50)
 *   ?offset=0   — Pagination offset
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabaseAdmin
      .from('leaderboard')
      .select('*', { count: 'exact' })
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Leaderboard fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard.',
      });
    }

    // Add rank
    const ranked = (data || []).map((entry, index) => ({
      rank: offset + index + 1,
      ...entry,
    }));

    return res.json({
      success: true,
      data: ranked,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
