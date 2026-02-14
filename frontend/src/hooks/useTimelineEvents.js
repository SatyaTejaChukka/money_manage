import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api.js';

/**
 * Custom hook to fetch timeline events from the autopilot API
 */
export function useTimelineEvents(daysPast = 7, daysFuture = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/autopilot/timeline', {
        params: {
          days_past: daysPast,
          days_future: daysFuture,
        },
      });

      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [daysFuture, daysPast]);

  useEffect(() => {
    fetchData();

    const onTransactionsChanged = () => {
      fetchData();
    };

    window.addEventListener('transactions:changed', onTransactionsChanged);

    return () => {
      window.removeEventListener('transactions:changed', onTransactionsChanged);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
