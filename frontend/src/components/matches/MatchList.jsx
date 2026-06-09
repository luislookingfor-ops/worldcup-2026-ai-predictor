import { useState } from 'react';
import MatchCard from './MatchCard';
import { SkeletonCard } from '../common/Loading';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const STAGES = [
  { value: '', label: 'Todas' },
  { value: 'GROUP_STAGE', label: 'Fase de Grupos' },
  { value: 'ROUND_OF_32', label: 'Treintaidosavos' },
  { value: 'ROUND_OF_16', label: 'Octavos' },
  { value: 'QUARTER_FINALS', label: 'Cuartos' },
  { value: 'SEMI_FINALS', label: 'Semifinales' },
  { value: 'THIRD_PLACE', label: 'Tercer Puesto' },
  { value: 'FINAL', label: 'Final' },
];

export default function MatchList({ matches, loading, error, filters, onFilterChange }) {
  const [activeGroup, setActiveGroup] = useState(filters?.group || '');
  const [activeStage, setActiveStage] = useState(filters?.stage || '');

  const handleGroupClick = (group) => {
    const newGroup = activeGroup === group ? '' : group;
    setActiveGroup(newGroup);
    onFilterChange?.({ group: newGroup });
  };

  const handleStageChange = (stage) => {
    setActiveStage(stage);
    onFilterChange?.({ stage });
  };

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Error al cargar partidos</h3>
        <p className="empty-state-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="match-list">
      {/* Stage Filter */}
      <div className="filter-bar" role="tablist" aria-label="Filtrar por fase">
        {STAGES.map(stage => (
          <button
            key={stage.value}
            className={`filter-tab ${activeStage === stage.value ? 'filter-tab--active' : ''}`}
            onClick={() => handleStageChange(stage.value)}
            role="tab"
            aria-selected={activeStage === stage.value}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Group Filter */}
      <div className="filter-groups" role="tablist" aria-label="Filtrar por grupo">
        <button
          className={`group-tab ${activeGroup === '' ? 'group-tab--active' : ''}`}
          onClick={() => handleGroupClick('')}
          role="tab"
          aria-selected={activeGroup === ''}
        >
          Todos
        </button>
        {GROUPS.map(group => (
          <button
            key={group}
            className={`group-tab ${activeGroup === group ? 'group-tab--active' : ''}`}
            onClick={() => handleGroupClick(group)}
            role="tab"
            aria-selected={activeGroup === group}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Match Grid */}
      {loading ? (
        <div className="grid-matches">
          <SkeletonCard count={6} />
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No se encontraron partidos</h3>
          <p className="empty-state-text">
            Prueba cambiando los filtros para ver más partidos.
          </p>
        </div>
      ) : (
        <div className="grid-matches stagger-children">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
