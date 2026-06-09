import { Link } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

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
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Predictions() {
  const { isAuthenticated } = useAuth();
  const { predictions, loading, error, totalPoints } = usePredictions();

  if (!isAuthenticated) {
    return (
      <div className="predictions-page container animate-fadeIn" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: 'var(--space-10) var(--space-6)', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: '3rem' }}>🎯</span>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Tus Predicciones</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
            Debes iniciar sesión para hacer pronósticos y ver tu historial de puntos.
          </p>
          <Link to="/login">
            <Button variant="primary">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="predictions-page container animate-fadeIn" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <Loading text="Cargando tu historial de predicciones..." />
      </div>
    );
  }

  return (
    <div className="predictions-page container animate-fadeIn" style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Header and Summary stats */}
      <header className="predictions-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
            Mis Predicciones
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
            Sigue de cerca tus aciertos y los puntos que has sumado en la tabla general.
          </p>
        </div>

        <div className="points-summary-card glass-card" style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(34, 197, 94, 0.2)', boxShadow: 'var(--shadow-glow-primary)' }}>
          <span style={{ fontSize: '2rem' }}>🏆</span>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Puntos Totales</div>
            <div className="gradient-text" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{totalPoints} PTS</div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="error-card glass-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-danger)' }}>
          <p>{error}</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: '4rem', opacity: 0.5, marginBottom: 'var(--space-4)' }}>🎯</div>
          <h3 className="empty-state-title" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Aún no has hecho predicciones</h3>
          <p className="empty-state-text" style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
            ¡Empieza a pronosticar los resultados de los partidos del Mundial para competir en la clasificación general!
          </p>
          <Link to="/partidos">
            <Button variant="primary">Ver Calendario de Partidos</Button>
          </Link>
        </div>
      ) : (
        <div className="predictions-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {predictions.map((pred) => {
            const match = pred.matches || {};
            const isFinished = match.status === 'FINISHED';
            const home = { name: match.home_team_name || 'Local', code: match.home_team_name?.substring(0, 3) };
            const away = { name: match.away_team_name || 'Visitante', code: match.away_team_name?.substring(0, 3) };

            return (
              <div 
                key={pred.id} 
                className="prediction-item glass-card" 
                style={{ 
                  padding: 'var(--space-4) var(--space-6)', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: 'var(--space-4)' 
                }}
              >
                {/* Match Info & Teams */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flex: '1 1 350px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '90px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {match.stage || 'Grupo'}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(match.utc_date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                    {/* Home Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{home.name}</span>
                      {getFlagUrl(home, match.home_team_crest) && <img src={getFlagUrl(home, match.home_team_crest)} alt={home.name} style={{ width: '24px', height: '16px', borderRadius: '2px', objectFit: 'contain' }} />}
                    </div>

                    <span style={{ fontWeight: 800, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>VS</span>

                    {/* Away Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
                      {getFlagUrl(away, match.away_team_crest) && <img src={getFlagUrl(away, match.away_team_crest)} alt={away.name} style={{ width: '24px', height: '16px', borderRadius: '2px', objectFit: 'contain' }} />}
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{away.name}</span>
                    </div>
                  </div>
                </div>

                {/* Score Predictions vs Actual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flex: '1 1 200px', justifyContent: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px' }}>Tu Pronóstico</div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>
                      {pred.predicted_home_score} - {pred.predicted_away_score}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px' }}>Resultado Real</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      {isFinished ? `${match.home_score} - ${match.away_score}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Points Earned & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flex: '0 0 180px', justifyContent: 'flex-end' }}>
                  {isFinished ? (
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        +{pred.points_earned ?? 0} PTS
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Pendiente
                    </span>
                  )}

                  <Link to={`/partidos/${match.external_id || match.id}`}>
                    <Button variant="ghost" size="sm">Detalles</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
