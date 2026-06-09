import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic fetch helper with auth token injection
 */
async function fetchApi(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.detail || errorBody.message || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/* ---------- Matches ---------- */
export function getMatches(filters = {}) {
  const params = new URLSearchParams();
  if (filters.group) params.set('group', filters.group);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.date) params.set('date', filters.date);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return fetchApi(`/matches${query ? `?${query}` : ''}`);
}

export function getMatch(id) {
  return fetchApi(`/matches/${id}`);
}

export function getTeams() {
  return fetchApi('/teams');
}

/* ---------- AI Predictions ---------- */
export function getAiPrediction(matchId) {
  return fetchApi(`/matches/${matchId}/ai-prediction`);
}

/* ---------- Chat ---------- */
export function chatWithAgent(message, threadId = null) {
  return fetchApi('/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, threadId }),
  });
}

/* ---------- User Predictions ---------- */
export function submitPrediction(matchId, homeScore, awayScore) {
  return fetchApi('/predictions', {
    method: 'POST',
    body: JSON.stringify({
      matchId,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
    }),
  });
}

export function getMyPredictions() {
  return fetchApi('/predictions/my');
}

/* ---------- Leaderboard ---------- */
export function getLeaderboard() {
  return fetchApi('/predictions/leaderboard');
}

/* ---------- Tournament Stats ---------- */
export function getTournamentStats() {
  return fetchApi('/matches'); // We can fetch all matches as stats context
}
