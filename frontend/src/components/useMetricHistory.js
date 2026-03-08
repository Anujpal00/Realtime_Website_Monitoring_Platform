import { useEffect, useState } from "react";

const defaultApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : "http://localhost:4000";

const apiBase = import.meta.env.VITE_API_BASE || defaultApiBase;

export function useMetricHistory({ scope, target, metric, rangeMs, refreshMs, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scope || !target || !metric) return;

    let active = true;

    const fetchRange = async () => {
      setLoading(true);
      setError(null);

      const to = new Date();
      const from = new Date(Date.now() - rangeMs);
      const params = new URLSearchParams({
        scope,
        target,
        metric,
        from: from.toISOString(),
        to: to.toISOString(),
        limit: "800"
      });

      try {
        const res = await fetch(`${apiBase}/api/metrics/range?${params}`);
        const rows = await res.json();
        if (!active) return;
        const mapped = rows.map((row) => ({ ts: row.ts, value: row.value }));
        setData(mapped);
      } catch (err) {
        if (!active) return;
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRange();
    let interval;
    if (refreshMs && refreshMs > 0) {
      interval = setInterval(fetchRange, refreshMs);
    }
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [scope, target, metric, rangeMs, refreshMs, refreshKey]);

  return { data, loading, error };
}
