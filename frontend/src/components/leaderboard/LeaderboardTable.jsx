import { useState, useEffect } from 'react';
import { getLeaderboard } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import './LeaderboardTable.css';

export default function LeaderboardTable() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await getLeaderboard();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Error al cargar la clasificación');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  if (loading) {
    return <Loading text="Cargando tabla de posiciones..." />;
  }

  if (error) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-state-icon">🏆⚠️</div>
        <h3 className="empty-state-title">Error al cargar la clasificación</h3>
        <p className="empty-state-text">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-state-icon">🏆</div>
        <h3 className="empty-state-title">Aún no hay puntuaciones</h3>
        <p className="empty-state-text">Las predicciones se puntuarán cuando comiencen los partidos y se registren los resultados.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-table-wrapper glass-card animate-fadeIn">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="col-rank">Pos</th>
            <th className="col-user">Usuario</th>
            <th className="col-predictions">Predicciones</th>
            <th className="col-accuracy">Aciertos %</th>
            <th className="col-points">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isCurrentUser = user && user.id === row.id;
            const accuracy = row.total_predictions > 0 
              ? Math.round((row.correct_predictions / row.total_predictions) * 100)
              : 0;

            // Trophy indicators for top 3
            let rankBadge = null;
            if (row.rank === 1) rankBadge = <span className="trophy trophy--gold">🏆</span>;
            else if (row.rank === 2) rankBadge = <span className="trophy trophy--silver">🥈</span>;
            else if (row.rank === 3) rankBadge = <span className="trophy trophy--bronze">🥉</span>;
            else rankBadge = <span className="rank-number">{row.rank}</span>;

            return (
              <tr 
                key={row.id} 
                className={`leaderboard-row ${isCurrentUser ? 'leaderboard-row--current' : ''}`}
              >
                <td className="col-rank">
                  <div className="rank-container">
                    {rankBadge}
                  </div>
                </td>
                <td className="col-user">
                  <div className="user-info">
                    <div className="user-avatar-img">
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt={row.username} />
                      ) : (
                        <span className="user-avatar-placeholder">
                          {(row.display_name || row.username || '?').substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="user-names">
                      <span className="user-display-name">
                        {row.display_name || row.username}
                        {isCurrentUser && <span className="self-tag">(Tú)</span>}
                      </span>
                      <span className="user-username">@{row.username}</span>
                    </div>
                  </div>
                </td>
                <td className="col-predictions">
                  <span className="pred-count">{row.total_predictions}</span>
                </td>
                <td className="col-accuracy">
                  <div className="accuracy-container">
                    <span className="accuracy-value">{accuracy}%</span>
                    <div className="accuracy-mini-track">
                      <div className="accuracy-mini-fill" style={{ width: `${accuracy}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="col-points">
                  <span className="points-value">{row.total_points}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
