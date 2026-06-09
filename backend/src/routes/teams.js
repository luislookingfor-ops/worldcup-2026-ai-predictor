/**
 * @fileoverview Teams routes.
 *
 * GET  /api/teams       — List all 48 World Cup teams
 * GET  /api/teams/:id   — Get a single team's details
 */

const { Router } = require('express');
const footballApi = require('../services/footballApi');
const { supabaseAdmin } = require('../services/supabase');

const router = Router();

/**
 * GET /api/teams
 * List all World Cup teams with optional group filter.
 *
 * Query params:
 *   ?group=A   — Filter by group letter
 *   ?source=api|db
 */
router.get('/', async (req, res, next) => {
  try {
    const { group, source } = req.query;

    // Try Supabase first
    if (source !== 'api') {
      let query = supabaseAdmin.from('teams').select('*');
      if (group) query = query.eq('group', group);
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mappedData = data.map((t) => ({ id: t.external_id, ...t }));
        return res.json({
          success: true,
          data: mappedData,
          count: data.length,
          source: 'database',
        });
      }
    }

    // Fall back to Football-Data.org API
    const apiData = await footballApi.getTeams();
    let teams = apiData.teams || apiData;

    // Client-side group filter for API response
    if (group && Array.isArray(teams)) {
      teams = teams.filter(
        (t) => t.group && t.group.toUpperCase().endsWith(group.toUpperCase())
      );
    }

    return res.json({
      success: true,
      data: teams,
      count: teams.length,
      source: 'api',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams/:id
 * Get a single team by its Football-Data.org ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try DB first
    const { data: dbTeam, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('external_id', Number(id))
      .single();

    if (!error && dbTeam) {
      const mappedTeam = { id: dbTeam.external_id, ...dbTeam };
      return res.json({ success: true, data: mappedTeam, source: 'database' });
    }

    // Fall back to API – fetch all teams and filter
    const apiData = await footballApi.getTeams();
    const team = (apiData.teams || []).find((t) => t.id === Number(id));

    if (!team) {
      return res.status(404).json({
        success: false,
        error: `Team with id ${id} not found.`,
      });
    }

    return res.json({ success: true, data: team, source: 'api' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
