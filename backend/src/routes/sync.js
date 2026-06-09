/**
 * @fileoverview Admin sync routes.
 *
 * Protected by ADMIN_SECRET header.  These endpoints pull data from
 * Football-Data.org and upsert it into Supabase, and score finished matches.
 *
 * POST /api/sync/matches  — Sync matches
 * POST /api/sync/teams    — Sync teams
 * POST /api/sync/results  — Score finished matches & update leaderboard
 */

const { Router } = require('express');
const footballApi = require('../services/footballApi');
const { supabaseAdmin } = require('../services/supabase');
const { calculatePoints, updateUserPoints } = require('../services/predictionEngine');

const router = Router();

// ---------- Admin Guard ----------

/**
 * Middleware: validate the X-Admin-Secret header.
 */
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Invalid or missing admin secret.',
    });
  }
  next();
};

// Apply to all routes in this router
router.use(requireAdmin);

// ========================================================================
//  POST /api/sync/matches
// ========================================================================

/**
 * Sync World Cup matches from Football-Data.org into Supabase.
 * Performs an upsert keyed on `external_id`.
 */
router.post('/matches', async (req, res, next) => {
  try {
    console.log('🔄 Syncing matches from Football-Data.org...');

    const apiData = await footballApi.getMatches();
    const matches = apiData.matches || [];

    if (!matches.length) {
      return res.json({
        success: true,
        data: { synced: 0 },
        message: 'No matches returned from API.',
      });
    }

    // Map API shape → DB schema
    const rows = matches.map((m) => ({
      external_id: m.id,
      utc_date: m.utcDate,
      status: m.status,
      matchday: m.matchday,
      stage: m.stage,
      group: m.group,
      home_team_id: m.homeTeam?.id || null,
      home_team_name: m.homeTeam?.name || null,
      home_team_crest: m.homeTeam?.crest || null,
      away_team_id: m.awayTeam?.id || null,
      away_team_name: m.awayTeam?.name || null,
      away_team_crest: m.awayTeam?.crest || null,
      home_score:
        m.score?.fullTime?.home !== undefined
          ? m.score.fullTime.home
          : null,
      away_score:
        m.score?.fullTime?.home !== undefined
          ? m.score.fullTime.away
          : null,
      winner: m.score?.winner || null,
      venue: m.venue || null,
      last_updated: m.lastUpdated || new Date().toISOString(),
      synced_at: new Date().toISOString(),
    }));

    // Upsert in batches of 50
    let synced = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabaseAdmin
        .from('matches')
        .upsert(batch, { onConflict: 'external_id' });

      if (error) {
        console.error(`❌ Batch upsert error (offset ${i}):`, error);
        throw error;
      }
      synced += batch.length;
    }

    console.log(`✅ Synced ${synced} matches.`);
    return res.json({
      success: true,
      data: { synced, total: matches.length },
    });
  } catch (err) {
    next(err);
  }
});

// ========================================================================
//  POST /api/sync/teams
// ========================================================================

/**
 * Sync World Cup teams from Football-Data.org into Supabase.
 * Performs an upsert keyed on `external_id`.
 */
router.post('/teams', async (req, res, next) => {
  try {
    console.log('🔄 Syncing teams from Football-Data.org...');

    const apiData = await footballApi.getTeams();
    const teams = apiData.teams || [];

    if (!teams.length) {
      return res.json({
        success: true,
        data: { synced: 0 },
        message: 'No teams returned from API.',
      });
    }

    const rows = teams.map((t) => ({
      external_id: t.id,
      name: t.name,
      short_name: t.shortName || null,
      tla: t.tla || null,
      crest: t.crest || null,
      address: t.address || null,
      website: t.website || null,
      founded: t.founded || null,
      club_colors: t.clubColors || null,
      venue: t.venue || null,
      group: t.group || null,
      coach_name: t.coach?.name || null,
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('teams')
      .upsert(rows, { onConflict: 'external_id' });

    if (error) {
      console.error('❌ Teams upsert error:', error);
      throw error;
    }

    console.log(`✅ Synced ${rows.length} teams.`);
    return res.json({
      success: true,
      data: { synced: rows.length, total: teams.length },
    });
  } catch (err) {
    next(err);
  }
});

// ========================================================================
//  POST /api/sync/results
// ========================================================================

/**
 * Check finished matches, score user predictions, and update the leaderboard.
 *
 * Steps:
 *   1. Fetch all FINISHED matches from DB.
 *   2. For each finished match, find predictions that haven't been scored yet.
 *   3. Calculate points and update each prediction row.
 *   4. Re-calculate affected users' leaderboard totals.
 */
router.post('/results', async (req, res, next) => {
  try {
    console.log('🔄 Scoring finished matches...');

    // 1. Finished matches with actual scores
    const { data: finishedMatches, error: matchErr } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'FINISHED')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (matchErr) throw matchErr;

    if (!finishedMatches || finishedMatches.length === 0) {
      return res.json({
        success: true,
        data: { scored: 0, matchesProcessed: 0 },
        message: 'No finished matches to score.',
      });
    }

    let totalScored = 0;
    const affectedUsers = new Set();

    for (const match of finishedMatches) {
      // 2. Get un-scored predictions for this match
      const { data: predictions, error: predErr } = await supabaseAdmin
        .from('predictions')
        .select('*')
        .eq('match_external_id', match.external_id)
        .is('points_earned', null);

      if (predErr) {
        console.error(
          `❌ Error fetching predictions for match ${match.external_id}:`,
          predErr
        );
        continue;
      }

      if (!predictions || predictions.length === 0) continue;

      // 3. Calculate and persist points
      for (const pred of predictions) {
        const points = calculatePoints(
          {
            homeScore: pred.predicted_home_score,
            awayScore: pred.predicted_away_score,
          },
          {
            homeScore: match.home_score,
            awayScore: match.away_score,
          }
        );

        const { error: updateErr } = await supabaseAdmin
          .from('predictions')
          .update({ points_earned: points, scored_at: new Date().toISOString() })
          .eq('id', pred.id);

        if (updateErr) {
          console.error(
            `❌ Error updating prediction ${pred.id}:`,
            updateErr
          );
          continue;
        }

        totalScored++;
        affectedUsers.add(pred.user_id);
      }
    }

    // 4. Update leaderboard for affected users
    let leaderboardUpdated = 0;
    for (const userId of affectedUsers) {
      try {
        await updateUserPoints(userId, supabaseAdmin);
        leaderboardUpdated++;
      } catch (lbErr) {
        console.error(
          `❌ Leaderboard update failed for user ${userId}:`,
          lbErr.message
        );
      }
    }

    console.log(
      `✅ Scored ${totalScored} predictions across ${finishedMatches.length} matches. Leaderboard updated for ${leaderboardUpdated} users.`
    );

    return res.json({
      success: true,
      data: {
        matchesProcessed: finishedMatches.length,
        predictionsScored: totalScored,
        usersUpdated: leaderboardUpdated,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
