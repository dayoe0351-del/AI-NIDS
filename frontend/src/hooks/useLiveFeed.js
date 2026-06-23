import { useState, useEffect, useRef } from 'react';

/**
 * Polls a data-fetching function every `interval` ms.
 * Returns { data, loading, error, lastUpdated }.
 */
export function useLiveFeed(fetchFn, interval = 3000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetchFn();
      setData(res.data.results ?? res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Cannot reach backend — is Django running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, interval);
    return () => clearInterval(timerRef.current);
  }, []);

  return { data, loading, error, lastUpdated };
}
