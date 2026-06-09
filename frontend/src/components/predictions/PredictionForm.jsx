import { useState } from 'react';
import { submitPrediction } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './PredictionForm.css';

export default function PredictionForm({ match, onSuccess }) {
  const { isAuthenticated } = useAuth();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const home = match?.homeTeam || match?.home_team || {};
  const away = match?.awayTeam || match?.away_team || {};

  const isStarted = match?.status && !['SCHEDULED', 'TIMED'].includes(match.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || isStarted) return;

    try {
      setSubmitting(true);
      setError(null);
      await submitPrediction(match.id, homeScore, awayScore);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al enviar predicción');
    } finally {
      setSubmitting(false);
    }
  };

  const adjustScore = (team, delta) => {
    if (team === 'home') {
      setHomeScore(prev => Math.max(0, Math.min(20, prev + delta)));
    } else {
      setAwayScore(prev => Math.max(0, Math.min(20, prev + delta)));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="prediction-form-wrapper glass-card">
        <div className="prediction-login-prompt">
          <span className="prediction-lock">🔒</span>
          <p>Inicia sesión para hacer tu predicción</p>
          <a href="/login" className="btn btn-primary btn-sm">Iniciar Sesión</a>
        </div>
      </div>
    );
  }

  return (
    <form className="prediction-form glass-card" onSubmit={handleSubmit}>
      <h3 className="prediction-form-title">
        🎯 Tu Predicción
      </h3>

      {isStarted && (
        <div className="prediction-notice">
          <span>⚠️</span> El partido ya comenzó. No se pueden enviar predicciones.
        </div>
      )}

      <div className="prediction-scores">
        {/* Home Score */}
        <div className="prediction-team">
          <span className="prediction-team-name">{home.shortName || home.name || 'Local'}</span>
          <div className="score-selector">
            <button
              type="button"
              className="score-btn"
              onClick={() => adjustScore('home', -1)}
              disabled={homeScore <= 0 || isStarted}
              aria-label="Disminuir goles local"
            >
              −
            </button>
            <span className="score-value" aria-live="polite">{homeScore}</span>
            <button
              type="button"
              className="score-btn"
              onClick={() => adjustScore('home', 1)}
              disabled={isStarted}
              aria-label="Aumentar goles local"
            >
              +
            </button>
          </div>
        </div>

        <span className="prediction-divider">—</span>

        {/* Away Score */}
        <div className="prediction-team">
          <span className="prediction-team-name">{away.shortName || away.name || 'Visitante'}</span>
          <div className="score-selector">
            <button
              type="button"
              className="score-btn"
              onClick={() => adjustScore('away', -1)}
              disabled={awayScore <= 0 || isStarted}
              aria-label="Disminuir goles visitante"
            >
              −
            </button>
            <span className="score-value" aria-live="polite">{awayScore}</span>
            <button
              type="button"
              className="score-btn"
              onClick={() => adjustScore('away', 1)}
              disabled={isStarted}
              aria-label="Aumentar goles visitante"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="prediction-success animate-slideUp">
          ✅ ¡Predicción enviada con éxito!
        </div>
      )}
      {error && (
        <div className="prediction-error animate-slideUp">
          ❌ {error}
        </div>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={submitting}
        disabled={isStarted}
        className="prediction-submit"
      >
        🎯 Enviar Predicción
      </Button>
    </form>
  );
}
