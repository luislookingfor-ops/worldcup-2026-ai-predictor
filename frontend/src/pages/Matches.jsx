import { useMatches } from '../hooks/useMatches';
import MatchList from '../components/matches/MatchList';

export default function Matches() {
  const { matches, loading, error, filters, updateFilters } = useMatches();

  return (
    <div className="matches-page container animate-fadeIn" style={{ padding: 'var(--space-8) var(--space-4)' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
          Calendario de Partidos
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
          Explora los partidos del Mundial 2026. Haz clic en cualquier partido para ver el análisis de Copa26 AI y enviar tu predicción.
        </p>
      </header>

      <MatchList 
        matches={matches} 
        loading={loading} 
        error={error} 
        filters={filters} 
        onFilterChange={updateFilters} 
      />
    </div>
  );
}
