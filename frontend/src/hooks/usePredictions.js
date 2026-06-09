import { useState, useEffect, useCallback } from 'react';
import { getMyPredictions } from '../services/api';

export function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPredictions();
      setPredictions(data.data || (Array.isArray(data) ? data : data.predictions || []));
    } catch (err) {
      setError(err.message || 'Error al cargar predicciones');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || p.points || 0), 0);

  return {
    predictions,
    loading,
    error,
    totalPoints,
    refetch: fetchPredictions,
  };
}
