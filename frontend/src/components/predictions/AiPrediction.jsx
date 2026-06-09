import { useState, useEffect } from 'react';
import { getAiPrediction } from '../../services/api';
import Loading from '../common/Loading';
import './AiPrediction.css';

export default function AiPrediction({ matchId, homeTeam, awayTeam }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadPrediction() {
      try {
        setLoading(true);
        setError(null);
        const res = await getAiPrediction(matchId);
        if (active) {
          setPrediction(res.data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'No se pudo cargar el pronóstico de la IA');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrediction();
    return () => {
      active = false;
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="ai-prediction-loading glass-card">
        <Loading text="Copa26 AI está analizando el partido..." />
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="ai-prediction-error glass-card">
        <span className="ai-error-icon">🤖⚠️</span>
        <h4>Pronóstico no disponible</h4>
        <p className="error-msg">{error || 'La IA no tiene datos suficientes para este partido.'}</p>
      </div>
    );
  }

  // Parse structured prediction text if it is in JSON string format
  let parsed = {
    predictedHomeScore: 0,
    predictedAwayScore: 0,
    confidence: 50,
    analysis: prediction.prediction_text || '',
    keyFactors: ['Historial de partidos', 'Rendimiento reciente', 'Fortaleza de plantilla'],
    homeWinProb: 40,
    drawProb: 30,
    awayWinProb: 30,
  };

  try {
    if (prediction.prediction_text && prediction.prediction_text.includes('{')) {
      const startJson = prediction.prediction_text.indexOf('{');
      const endJson = prediction.prediction_text.lastIndexOf('}') + 1;
      const jsonStr = prediction.prediction_text.substring(startJson, endJson);
      const data = JSON.parse(jsonStr);
      
      parsed.predictedHomeScore = data.predictedHomeScore ?? data.predicted_home_score ?? 0;
      parsed.predictedAwayScore = data.predictedAwayScore ?? data.predicted_away_score ?? 0;
      parsed.confidence = data.confidence ?? 50;
      parsed.analysis = data.analysis || prediction.prediction_text;
      parsed.keyFactors = data.keyFactors || data.key_factors || parsed.keyFactors;
      parsed.homeWinProb = data.homeWinProb ?? data.home_win_prob ?? 40;
      parsed.drawProb = data.drawProb ?? data.draw_prob ?? 30;
      parsed.awayWinProb = data.awayWinProb ?? data.away_win_prob ?? 30;
    }
  } catch (err) {
    // If JSON parsing fails, just use the raw text and extract some basic stuff
    console.warn('Could not parse AI prediction JSON', err);
  }

  // Format confidence level
  const confidenceLevel = Math.round(parsed.confidence <= 10 ? parsed.confidence : parsed.confidence / 10);
  const confidenceColor = 
    confidenceLevel >= 8 ? 'confidence-high' :
    confidenceLevel >= 5 ? 'confidence-medium' : 'confidence-low';

  return (
    <div className="ai-prediction glass-card animate-fadeIn">
      <div className="ai-header">
        <div className="ai-title-wrapper">
          <span className="ai-badge">🤖 Copa26 AI</span>
          <h3 className="ai-title">Pronóstico Experto</h3>
        </div>
        <div className={`ai-confidence ${confidenceColor}`}>
          <span className="confidence-label">Confianza:</span>
          <span className="confidence-value">{confidenceLevel}/10</span>
        </div>
      </div>

      <div className="ai-score-display">
        <div className="ai-score-team">
          <span className="ai-score-team-name">{homeTeam}</span>
        </div>
        <div className="ai-score-box">
          <span className="ai-score-number">{parsed.predictedHomeScore}</span>
          <span className="ai-score-dash">-</span>
          <span className="ai-score-number">{parsed.predictedAwayScore}</span>
        </div>
        <div className="ai-score-team">
          <span className="ai-score-team-name">{awayTeam}</span>
        </div>
      </div>

      {/* Probabilities Bars */}
      <div className="ai-probabilities">
        <h4 className="ai-section-title">Probabilidades de Resultado</h4>
        <div className="prob-bars">
          <div className="prob-bar-wrapper">
            <div className="prob-label">Victoria {homeTeam}</div>
            <div className="prob-track">
              <div className="prob-fill prob-fill--home" style={{ width: `${parsed.homeWinProb}%` }}></div>
            </div>
            <div className="prob-value">{parsed.homeWinProb}%</div>
          </div>
          <div className="prob-bar-wrapper">
            <div className="prob-label">Empate</div>
            <div className="prob-track">
              <div className="prob-fill prob-fill--draw" style={{ width: `${parsed.drawProb}%` }}></div>
            </div>
            <div className="prob-value">{parsed.drawProb}%</div>
          </div>
          <div className="prob-bar-wrapper">
            <div className="prob-label">Victoria {awayTeam}</div>
            <div className="prob-track">
              <div className="prob-fill prob-fill--away" style={{ width: `${parsed.awayWinProb}%` }}></div>
            </div>
            <div className="prob-value">{parsed.awayWinProb}%</div>
          </div>
        </div>
      </div>

      {/* Analysis text */}
      <div className="ai-analysis">
        <h4 className="ai-section-title">Análisis Táctico</h4>
        <p className="ai-analysis-text">{parsed.analysis}</p>
      </div>

      {/* Key Factors */}
      {parsed.keyFactors && parsed.keyFactors.length > 0 && (
        <div className="ai-factors">
          <h4 className="ai-section-title">Factores Clave</h4>
          <div className="factors-grid">
            {parsed.keyFactors.map((factor, idx) => (
              <div key={idx} className="factor-tag">
                <span className="factor-dot">⚽</span>
                {factor}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ai-footer">
        <p className="ai-disclaimer">
          ⚠️ Los pronósticos de la IA se basan en análisis estadísticos y noticias recientes. No garantizan resultados.
        </p>
      </div>
    </div>
  );
}
