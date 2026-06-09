/**
 * @fileoverview Football-Data.org API service.
 *
 * Provides methods to fetch World Cup 2026 data (matches, teams, standings,
 * scorers) from the Football-Data.org v4 REST API.
 *
 * @see https://www.football-data.org/documentation/api
 */

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = 'WC'; // FIFA World Cup

class FootballApiService {
  constructor() {
    this.apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!this.apiKey) {
      console.warn(
        '⚠️  FOOTBALL_DATA_API_KEY is not set. Football-Data.org calls will fail.'
      );
    }
  }

  // ---------- Internal Helpers ----------

  /**
   * Builds default headers for every request.
   * @returns {Record<string, string>}
   */
  _headers() {
    return {
      'X-Auth-Token': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generic GET request to Football-Data.org.
   *
   * @param {string} endpoint - Relative path (e.g. `/competitions/WC/matches`).
   * @param {Record<string, string>} [params={}] - Query-string parameters.
   * @returns {Promise<object>} Parsed JSON body.
   * @throws {Error} On non-2xx responses.
   */
  async _get(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    console.log(`⚽ Football API → GET ${url.pathname}${url.search}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this._headers(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Football-Data.org API error ${response.status}: ${errorBody}`
      );
    }

    return response.json();
  }

  // ---------- Public Methods ----------

  /**
   * Fetch World Cup matches with optional filters.
   *
   * @param {object} [filters={}]
   * @param {string} [filters.status]   - e.g. SCHEDULED, LIVE, FINISHED
   * @param {number} [filters.matchday] - Matchday number
   * @param {string} [filters.group]    - Group letter (e.g. "A")
   * @param {string} [filters.stage]    - Stage name (e.g. GROUP_STAGE)
   * @param {string} [filters.dateFrom] - YYYY-MM-DD
   * @param {string} [filters.dateTo]   - YYYY-MM-DD
   * @returns {Promise<object>}
   */
  async getMatches(filters = {}) {
    return this._get(`/competitions/${COMPETITION}/matches`, filters);
  }

  /**
   * Fetch all World Cup teams.
   * @returns {Promise<object>}
   */
  async getTeams() {
    return this._get(`/competitions/${COMPETITION}/teams`);
  }

  /**
   * Fetch World Cup standings / group tables.
   * @returns {Promise<object>}
   */
  async getStandings() {
    return this._get(`/competitions/${COMPETITION}/standings`);
  }

  /**
   * Fetch top scorers for the World Cup.
   * @param {number} [limit=20] - Maximum number of scorers to return.
   * @returns {Promise<object>}
   */
  async getScorers(limit = 20) {
    return this._get(`/competitions/${COMPETITION}/scorers`, { limit });
  }

  /**
   * Fetch a single match by its Football-Data.org ID.
   *
   * @param {number|string} matchId - The match ID.
   * @returns {Promise<object>}
   */
  async getMatch(matchId) {
    return this._get(`/matches/${matchId}`);
  }
}

// Export singleton instance
module.exports = new FootballApiService();
