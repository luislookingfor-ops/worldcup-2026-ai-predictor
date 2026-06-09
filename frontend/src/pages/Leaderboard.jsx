import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function Leaderboard() {
  return (
    <div className="leaderboard-page container animate-fadeIn" style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-2)' }}>
        <h1 className="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
          Clasificación General
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Mira quién lidera la tabla de pronósticos del Mundial 2026. Suma 10 puntos por marcador exacto, 5 por diferencia de un gol y 3 por acertar el ganador.
        </p>
      </header>

      <LeaderboardTable />
    </div>
  );
}
