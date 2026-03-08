import { useEffect, useState } from "react";
import { getAnomalyEvents } from "./api.js";

export function useAnomalyEvents({ scope, target, metric, rangeMs, refreshMs, refreshKey }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!scope || !target || !metric) return;
    let active = true;

    const fetchRows = async () => {
      const from = new Date(Date.now() - rangeMs).toISOString();
      const to = new Date().toISOString();
      try {
        const rows = await getAnomalyEvents({ scope, target, metric, from, to, limit: 300 });
        if (active) setData(rows);
      } catch (err) {
        if (active) {
          console.error("anomaly events fetch failed", err);
        }
      }
    };

    fetchRows();
    let interval;
    if (refreshMs && refreshMs > 0) {
      interval = setInterval(fetchRows, refreshMs);
    }
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [scope, target, metric, rangeMs, refreshMs, refreshKey]);

  return data;
}
