import { Link } from 'react-router-dom';
import './MatchCard.css';

const STATUS_MAP = {
  SCHEDULED: { label: 'Programado', class: 'scheduled' },
  TIMED: { label: 'Programado', class: 'scheduled' },
  IN_PLAY: { label: 'En Vivo', class: 'live' },
  PAUSED: { label: 'Entretiempo', class: 'live' },
  FINISHED: { label: 'Finalizado', class: 'finished' },
  POSTPONED: { label: 'Pospuesto', class: 'postponed' },
  CANCELLED: { label: 'Cancelado', class: 'cancelled' },
};

function getStatusInfo(status) {
  return STATUS_MAP[status] || { label: status || 'Programado', class: 'scheduled' };
}

function getFlagUrl(team) {
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

export default function MatchCard({ match }) {
  const home = match.homeTeam || match.home_team || {};
  const away = match.awayTeam || match.away_team || {};
  const score = match.score || {};
  const fullTime = score.fullTime || score.full_time || {};
  const statusInfo = getStatusInfo(match.status);
  const isLive = ['IN_PLAY', 'PAUSED'].includes(match.status);
  const isFinished = match.status === 'FINISHED';

  const homeGoals = fullTime.home ?? fullTime.homeTeam ?? match.home_score ?? '-';
  const awayGoals = fullTime.away ?? fullTime.awayTeam ?? match.away_score ?? '-';

  const group = match.group || match.stage || '';
  const venue = match.venue || match.area?.name || '';

  return (
    <Link
      to={`/partidos/${match.id}`}
      className={`match-card glass-card ${isLive ? 'match-card--live' : ''}`}
      aria-label={`${home.name || 'Equipo Local'} vs ${away.name || 'Equipo Visitante'}`}
    >
      {/* Status Badge */}
      <div className="match-card-header">
        <span className={`badge badge-${statusInfo.class === 'live' ? 'live' : statusInfo.class === 'finished' ? 'primary' : 'secondary'}`}>
          {statusInfo.label}
        </span>
        {group && <span className="match-group">{group}</span>}
      </div>

      {/* Teams */}
      <div className="match-teams">
        {/* Home Team */}
        <div className="match-team">
          <div className="team-flag-wrapper">
            {getFlagUrl(home) ? (
              <img
                src={getFlagUrl(home)}
                alt={`Bandera de ${home.name || 'Local'}`}
                className="team-flag"
                loading="lazy"
              />
            ) : (
              <div className="team-flag-placeholder">🏳️</div>
            )}
          </div>
          <span className="team-name">{home.shortName || home.name || 'Por definir'}</span>
        </div>

        {/* Score / VS */}
        <div className="match-score-section">
          {isFinished || isLive ? (
            <div className={`match-score ${isLive ? 'match-score--live' : ''}`}>
              <span className="score-number">{homeGoals}</span>
              <span className="score-divider">-</span>
              <span className="score-number">{awayGoals}</span>
            </div>
          ) : (
            <div className="match-vs">VS</div>
          )}
        </div>

        {/* Away Team */}
        <div className="match-team">
          <div className="team-flag-wrapper">
            {getFlagUrl(away) ? (
              <img
                src={getFlagUrl(away)}
                alt={`Bandera de ${away.name || 'Visitante'}`}
                className="team-flag"
                loading="lazy"
              />
            ) : (
              <div className="team-flag-placeholder">🏳️</div>
            )}
          </div>
          <span className="team-name">{away.shortName || away.name || 'Por definir'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="match-card-footer">
        <span className="match-date">{formatDate(match.utcDate || match.date)}</span>
        {venue && <span className="match-venue">📍 {venue}</span>}
      </div>
    </Link>
  );
}
