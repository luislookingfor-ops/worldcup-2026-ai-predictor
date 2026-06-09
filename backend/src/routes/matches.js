/**
 * @fileoverview Matches routes.
 *
 * GET  /api/matches              — List matches (with optional filters)
 * GET  /api/matches/:id          — Single match details
 * GET  /api/matches/:id/ai-prediction — AI prediction for a match
 */

const { Router } = require('express');
const footballApi = require('../services/footballApi');
const azureAgent = require('../services/azureAgent');
const { supabaseAdmin } = require('../services/supabase');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

/**
 * GET /api/matches
 * List matches with optional query filters.
 *
 * Query params:
 *   ?status=SCHEDULED|LIVE|FINISHED
 *   ?group=A
 *   ?stage=GROUP_STAGE|ROUND_OF_16|QUARTER_FINAL|SEMI_FINAL|FINAL
 *   ?matchday=1
 *   ?dateFrom=YYYY-MM-DD
 *   ?dateTo=YYYY-MM-DD
 *   ?source=api|db  (default: tries DB first, falls back to API)
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, group, stage, matchday, dateFrom, dateTo, source } =
      req.query;

    // Try Supabase first (if data has been synced)
    if (source !== 'api') {
      let query = supabaseAdmin.from('matches').select('*');

      if (status) query = query.eq('status', status);
      if (group) query = query.eq('group', group);
      if (stage) query = query.eq('stage', stage);
      if (matchday) query = query.eq('matchday', Number(matchday));
      if (dateFrom) query = query.gte('utc_date', dateFrom);
      if (dateTo) query = query.lte('utc_date', dateTo);

      query = query.order('utc_date', { ascending: true });

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return res.json({ success: true, data, source: 'database' });
      }
    }

    // Fall back to Football-Data.org API
    const apiData = await footballApi.getMatches({
      status,
      group,
      stage,
      matchday,
      dateFrom,
      dateTo,
    });

    return res.json({
      success: true,
      data: apiData.matches || apiData,
      filters: apiData.filters || {},
      source: 'api',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id
 * Get a single match by Football-Data.org ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try DB first
    const { data: dbMatch, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('external_id', Number(id))
      .single();

    if (!error && dbMatch) {
      return res.json({ success: true, data: dbMatch, source: 'database' });
    }

    // Fall back to API
    const apiData = await footballApi.getMatch(id);
    return res.json({ success: true, data: apiData, source: 'api' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:id/ai-prediction
 * Get or generate an AI prediction for a specific match.
 * Returns cached prediction from DB if available, otherwise generates one.
 */
router.get('/:id/ai-prediction', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for cached AI prediction in DB
    const { data: cached } = await supabaseAdmin
      .from('ai_predictions')
      .select('*')
      .eq('match_external_id', Number(id))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        source: 'cache',
      });
    }

    // Fetch match details for context
    let matchData;
    const { data: dbMatch } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('external_id', Number(id))
      .single();

    if (dbMatch) {
      matchData = dbMatch;
    } else {
      matchData = await footballApi.getMatch(id);
    }

    const homeTeam =
      matchData.home_team_name ||
      matchData.homeTeam?.name ||
      'Home Team';
    const awayTeam =
      matchData.away_team_name ||
      matchData.awayTeam?.name ||
      'Away Team';

    const context = {
      stage: matchData.stage || matchData.competition?.stage || 'Group Stage',
      group: matchData.group || '',
      matchday: matchData.matchday || '',
      date: matchData.utc_date || matchData.utcDate || '',
      competition: 'FIFA World Cup 2026',
    };

    // Generate prediction via Azure AI agent
    const prediction = await azureAgent.getPrediction(
      homeTeam,
      awayTeam,
      context
    );

    // Cache prediction in Supabase
    try {
      await supabaseAdmin.from('ai_predictions').insert({
        match_external_id: Number(id),
        home_team: homeTeam,
        away_team: awayTeam,
        prediction_text: prediction.response,
        thread_id: prediction.threadId,
        created_at: new Date().toISOString(),
      });
    } catch (cacheErr) {
      console.warn('⚠️  Failed to cache AI prediction:', cacheErr.message);
    }

    return res.json({
      success: true,
      data: {
        match_external_id: Number(id),
        home_team: homeTeam,
        away_team: awayTeam,
        prediction_text: prediction.response,
        thread_id: prediction.threadId,
      },
      source: 'generated',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
