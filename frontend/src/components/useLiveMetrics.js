import { useEffect, useMemo, useRef, useState } from "react";

const host =
  typeof window !== "undefined" ? window.location.hostname : "localhost";
const protocol =
  typeof window !== "undefined" ? window.location.protocol : "http:";
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

const apiBase =
  import.meta.env.VITE_API_BASE || `${protocol}//${host}:4000`;
const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${host}:4000/ws`;

export function useLiveMetrics() {
  const [snapshot, setSnapshot] = useState({
    ts: "-",
    nodes: [],
    websites: [],
    alerts: [],
    anomalies: []
  });
  const [connected, setConnected] = useState(false);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [anomalyEvents, setAnomalyEvents] = useState([]);
  const socketRef = useRef(null);

  const fetchSnapshot = async () => {
    try {
      const res = await fetch(`${apiBase}/api/metrics/current`);
      const data = await res.json();
      setSnapshot(data);
    } catch (err) {
      console.error("Fetch snapshot failed", err);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  useEffect(() => {
    let socket;
    let retryTimer;

    const connect = () => {
      socket = new WebSocket(wsBase);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        retryTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => {
        setConnected(false);
        socket.close();
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "metrics:update") {
            setSnapshot(msg.payload);
          } else if (msg.type === "security:alert") {
            setSecurityEvents((prev) => [msg.payload, ...prev].slice(0, 100));
          } else if (msg.type === "anomaly:event") {
            setAnomalyEvents((prev) => [msg.payload, ...prev].slice(0, 100));
          }
        } catch (err) {
          console.error("WS message parse failed", err);
        }
      };
    };

    connect();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchSnapshot, 30000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () => ({ snapshot, connected, securityEvents, anomalyEvents }),
    [snapshot, connected, securityEvents, anomalyEvents]
  );
}
