import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, getMyPredictions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PredictionForm from '../components/predictions/PredictionForm';
import AiPrediction from '../components/predictions/AiPrediction';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import './MatchDetail.css';

function getFlagUrl(team, matchCrest) {
  if (team?.crest) return team.crest;
  if (matchCrest) return matchCrest;
  if (team?.flagUrl) return team.flagUrl;
  const code = team?.tla?.substring(0, 2)?.toLowerCase()
    || team?.code?.toLowerCase()
    || team?.iso2?.toLowerCase()
    || '';
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MatchDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [match, setMatch] = useState(null);
  const [userPrediction, setUserPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load match details
      const matchRes = await getMatch(id);
      if (matchRes.success && matchRes.data) {
        setMatch(matchRes.data);
      } else {
        throw new Error('No se pudo encontrar el partido');
      }

      // Load user prediction if logged in
      if (isAuthenticated) {
        const predRes = await getMyPredictions();
        if (predRes.success && predRes.data) {
          const found = predRes.data.find(
            p => p.match_external_id === Number(id) || p.matchId === Number(id)
          );
          setUserPrediction(found || null);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los detalles del partido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="match-detail-page container animate-fadeIn">
        <Loading text="Cargando detalles del partido..." />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="match-detail-page container animate-fadeIn">
        <div className="error-card glass-card">
          <h3>Error</h3>
          <p>{error || 'No se pudieron cargar los datos del partido.'}</p>
          <Link to="/partidos">
            <Button variant="ghost" style={{ marginTop: 'var(--space-4)' }}>Volver a Partidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const home = match.homeTeam || match.home_team || {};
  const away = match.awayTeam || match.away_team || {};
  const score = match.score || {};
  const fullTime = score.fullTime || score.full_time || {};
  const isFinished = match.status === 'FINISHED';
  
  const homeGoals = fullTime.home ?? fullTime.homeTeam ?? match.home_score ?? null;
  const awayGoals = fullTime.away ?? fullTime.awayTeam ?? match.away_score ?? null;

  return (
    <div className="match-detail-page container animate-fadeIn">
      {/* Back Button */}
      <Link to="/partidos" className="back-link">
        ← Volver a partidos
      </Link>

      {/* Match Header Panel */}
      <div className="match-detail-header glass-card">
        <div className="detail-meta">
          <span className="badge badge-primary">{match.stage || 'Mundial 2026'}</span>
          {match.group && <span className="detail-group">Grupo {match.group}</span>}
        </div>

        <div className="detail-scoreboard">
          {/* Home Team */}
          <div className="scoreboard-team">
            <div className="scoreboard-flag-wrapper">
              {getFlagUrl(home, match.home_team_crest || match.homeTeam?.crest) ? (
                <img src={getFlagUrl(home, match.home_team_crest || match.homeTeam?.crest)} alt={home.name} className="scoreboard-flag" />
              ) : (
                <span className="scoreboard-flag-placeholder">🏳️</span>
              )}
            </div>
            <h2 className="scoreboard-team-name">{home.name}</h2>
          </div>

          {/* Goals / VS */}
          <div className="scoreboard-score-section">
            {homeGoals !== null && awayGoals !== null ? (
              <div className="scoreboard-goals">
                <span>{homeGoals}</span>
                <span className="goals-divider">:</span>
                <span>{awayGoals}</span>
              </div>
            ) : (
              <div className="scoreboard-vs">VS</div>
            )}
            <div className={`detail-status detail-status--${match.status?.toLowerCase()}`}>
              {match.status === 'FINISHED' ? 'Finalizado' : ['IN_PLAY', 'PAUSED'].includes(match.status) ? 'En Vivo' : 'Programado'}
            </div>
          </div>

          {/* Away Team */}
          <div className="scoreboard-team">
            <div className="scoreboard-flag-wrapper">
              {getFlagUrl(away, match.away_team_crest || match.awayTeam?.crest) ? (
                <img src={getFlagUrl(away, match.away_team_crest || match.awayTeam?.crest)} alt={away.name} className="scoreboard-flag" />
              ) : (
                <span className="scoreboard-flag-placeholder">🏳️</span>
              )}
            </div>
            <h2 className="scoreboard-team-name">{away.name}</h2>
          </div>
        </div>

        <div className="detail-footer">
          <div className="footer-item">
            <span>📅 Fecha:</span>
            <strong>{formatDate(match.utcDate || match.date)}</strong>
          </div>
          {match.venue && (
            <div className="footer-item">
              <span>🏟️ Estadio:</span>
              <strong>{match.venue}</strong>
            </div>
          )}
        </div>
      </div>

      {/* 2 Column Layout for Predictions */}
      <div className="match-detail-content">
        {/* Column 1: AI Prediction */}
        <div className="detail-column">
          <AiPrediction 
            matchId={match.id} 
            homeTeam={home.name} 
            awayTeam={away.name} 
          />
        </div>

        {/* Column 2: User Prediction */}
        <div className="detail-column">
          {userPrediction ? (
            <div className="user-prediction-status-card glass-card">
              <h3 className="prediction-form-title">🎯 Tu Predicción</h3>
              <div className="status-score-display">
                <div className="status-team">
                  <span>{home.shortName || home.name}</span>
                </div>
                <div className="status-score-box">
                  <span className="status-score-num">{userPrediction.predicted_home_score}</span>
                  <span className="status-score-dash">-</span>
                  <span className="status-score-num">{userPrediction.predicted_away_score}</span>
                </div>
                <div className="status-team">
                  <span>{away.shortName || away.name}</span>
                </div>
              </div>

              {isFinished ? (
                <div className="prediction-points-result">
                  <div className="points-label">Puntos Obtenidos:</div>
                  <div className="points-badge gradient-text">
                    +{userPrediction.points_earned ?? 0} PTS
                  </div>
                  <p className="points-desc">
                    {userPrediction.points_earned === 10 ? '¡Marcador Exacto! (+10 pts)' :
                     userPrediction.points_earned === 5 ? '¡Resultado correcto y diferencia de 1 gol! (+5 pts)' :
                     userPrediction.points_earned === 3 ? '¡Resultado Ganador/Empate correcto! (+3 pts)' :
                     'Pronóstico incorrecto (0 pts)'}
                  </p>
                </div>
              ) : (
                <div className="prediction-pending-result">
                  <p className="pending-badge">⏳ Pendiente de juego</p>
                  <p className="pending-desc">
                    Puedes actualizar tu pronóstico en el siguiente formulario antes de que inicie el partido.
                  </p>
                  <PredictionForm match={match} onSuccess={loadData} />
                </div>
              )}
            </div>
          ) : (
            <div className="user-prediction-form-card">
              <PredictionForm match={match} onSuccess={loadData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
