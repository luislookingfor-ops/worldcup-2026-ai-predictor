import { useState, useEffect, useCallback } from 'react';
import { getMatches } from '../services/api';

export function useMatches(initialFilters = {}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatches(filters);
      setMatches(data.data || (Array.isArray(data) ? data : data.matches || []));
    } catch (err) {
      setError(err.message || 'Error al cargar los partidos');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    matches,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchMatches,
  };
}
