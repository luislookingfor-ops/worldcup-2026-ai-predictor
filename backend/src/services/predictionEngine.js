/**
 * @fileoverview Prediction scoring engine.
 *
 * Scoring rules:
 *   10 pts — Exact score
 *    5 pts — Correct result AND within 1 goal on each team
 *    3 pts — Correct result (win / draw / loss)
 *    0 pts — Wrong prediction
 */

/**
 * Determine the match result from scores.
 * @param {number} home
 * @param {number} away
 * @returns {'HOME'|'DRAW'|'AWAY'}
 */
const getResult = (home, away) => {
  if (home > away) return 'HOME';
  if (home < away) return 'AWAY';
  return 'DRAW';
};

/**
 * Calculate the points earned for a single prediction.
 *
 * @param {{ homeScore: number, awayScore: number }} predicted - User's prediction.
 * @param {{ homeScore: number, awayScore: number }} actual    - Real match result.
 * @returns {number} Points earned (0, 3, 5, or 10).
 *
 * @example
 * calculatePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }); // 10
 * calculatePoints({ homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 0 }); // 5
 * calculatePoints({ homeScore: 1, awayScore: 0 }, { homeScore: 3, awayScore: 2 }); // 3
 * calculatePoints({ homeScore: 2, awayScore: 0 }, { homeScore: 0, awayScore: 1 }); // 0
 */
const calculatePoints = (predicted, actual) => {
  const pH = Number(predicted.homeScore);
  const pA = Number(predicted.awayScore);
  const aH = Number(actual.homeScore);
  const aA = Number(actual.awayScore);

  // Exact score → 10 pts
  if (pH === aH && pA === aA) {
    return 10;
  }

  const predictedResult = getResult(pH, pA);
  const actualResult = getResult(aH, aA);

  // Result must be correct for 3+ points
  if (predictedResult !== actualResult) {
    return 0;
  }

  // Correct result AND each team within 1 goal → 5 pts
  const homeDiff = Math.abs(pH - aH);
  const awayDiff = Math.abs(pA - aA);
  if (homeDiff <= 1 && awayDiff <= 1) {
    return 5;
  }

  // Correct result only → 3 pts
  return 3;
};

/**
 * Re-calculate and persist total points for a user.
 *
 * Sums the `points_earned` column of all scored predictions for the user
 * and upserts the total into the `leaderboard` table.
 *
 * @param {string} userId  - UUID of the user.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Admin client.
 * @returns {Promise<{ totalPoints: number, predictionCount: number }>}
 */
const updateUserPoints = async (userId, supabase) => {
  // Fetch all scored predictions
  const { data: predictions, error } = await supabase
    .from('predictions')
    .select('points_earned')
    .eq('user_id', userId)
    .not('points_earned', 'is', null);

  if (error) {
    console.error(`❌ Error fetching predictions for user ${userId}:`, error);
    throw error;
  }

  const totalPoints = (predictions || []).reduce(
    (sum, p) => sum + (p.points_earned || 0),
    0
  );

  // Upsert leaderboard row
  const { error: upsertError } = await supabase.from('leaderboard').upsert(
    {
      user_id: userId,
      total_points: totalPoints,
      predictions_count: predictions.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    console.error(`❌ Error upserting leaderboard for user ${userId}:`, upsertError);
    throw upsertError;
  }

  console.log(
    `📊 User ${userId}: ${totalPoints} pts from ${predictions.length} predictions`
  );

  return { totalPoints, predictionCount: predictions.length };
};

module.exports = { calculatePoints, updateUserPoints };
