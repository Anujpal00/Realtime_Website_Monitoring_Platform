import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MetricCard } from "./MetricCard.jsx";
import { AttackChart } from "./AttackChart.jsx";
import { AnomalyGraph } from "./AnomalyGraph.jsx";
import { useMetricHistory } from "./useMetricHistory.js";
import { getAnomalyEvents, getSecurityOverview } from "./api.js";

const RANGE_OPTIONS = [
  { label: "Last 2s", value: 2000 },
  { label: "Last 1m", value: 60000 },
  { label: "Last 1h", value: 3600000 },
  { label: "Last 1d", value: 86400000 }
];

function dedupeAlerts(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.ts}|${row.ip}|${row.attackType}|${row.endpoint}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= 100) break;
  }
  return out;
}

function toCountMap(rows, key) {
  const map = {};
  for (const row of rows || []) {
    map[row[key]] = row.count;
  }
  return map;
}

export default function SecurityDashboard({ snapshot, securityEvents, anomalyEvents }) {
  const [rangeMs, setRangeMs] = useState(60000);
  const [overview, setOverview] = useState({
    totalSuspiciousRequests: 0,
    attackTypeDistribution: [],
    topMaliciousIps: [],
    timeline: [],
    severityCount: [],
    recentAlerts: []
  });
  const [selectedNode, setSelectedNode] = useState("");
  const [cpuAnomalies, setCpuAnomalies] = useState([]);
  const [memAnomalies, setMemAnomalies] = useState([]);

  const nodes = snapshot?.nodes || [];

  useEffect(() => {
    if (!selectedNode && nodes.length) {
      setSelectedNode(nodes[0].name);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await getSecurityOverview(rangeMs, 100);
        if (active) setOverview(data);
      } catch (err) {
        console.error("security overview fetch failed", err);
      }
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [rangeMs]);

  const cpuHistory = useMetricHistory({
    scope: "node",
    target: selectedNode,
    metric: "cpuUsage",
    rangeMs,
    refreshMs: 2000,
    refreshKey: rangeMs
  });

  const memHistory = useMetricHistory({
    scope: "node",
    target: selectedNode,
    metric: "memUsedPct",
    rangeMs,
    refreshMs: 2000,
    refreshKey: rangeMs
  });

  useEffect(() => {
    if (!selectedNode) return;
    let active = true;
    const from = new Date(Date.now() - rangeMs).toISOString();
    const to = new Date().toISOString();

    const refresh = async () => {
      try {
        const [cpu, mem] = await Promise.all([
          getAnomalyEvents({
            scope: "node",
            target: selectedNode,
            metric: "cpuUsage",
            from,
            to,
            limit: 400
          }),
          getAnomalyEvents({
            scope: "node",
            target: selectedNode,
            metric: "memUsedPct",
            from,
            to,
            limit: 400
          })
        ]);
        if (!active) return;
        setCpuAnomalies(cpu);
        setMemAnomalies(mem);
      } catch (err) {
        console.error("anomaly fetch failed", err);
      }
    };

    refresh();
    const interval = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedNode, rangeMs, anomalyEvents]);

  const recentAlerts = useMemo(
    () => dedupeAlerts([...(securityEvents || []), ...(overview.recentAlerts || [])]),
    [securityEvents, overview.recentAlerts]
  );

  const severityMap = toCountMap(overview.severityCount, "severity");

  return (
    <div className="dashboard">
      <div className="toolbar">
        <div>
          <h2>Security Monitoring</h2>
          <p className="muted">Rule-based threat detection and real-time observability</p>
        </div>
        <div className="controls">
          <div className="control">
            <label>Time range</label>
            <select value={rangeMs} onChange={(e) => setRangeMs(Number(e.target.value))}>
              {RANGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label>Node</label>
            <select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}>
              {(nodes || []).map((node) => (
                <option key={node.name} value={node.name}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid metrics">
        <MetricCard label="Total Suspicious Requests" value={overview.totalSuspiciousRequests} />
        <MetricCard label="Critical" value={severityMap.Critical || 0} />
        <MetricCard label="Medium" value={severityMap.Medium || 0} />
        <MetricCard label="Low" value={severityMap.Low || 0} />
      </div>

      <div className="grid charts">
        <AttackChart data={overview.attackTypeDistribution} />
        <div className="card chart">
          <p className="label">Top Malicious IPs</p>
          <div className="alert-list">
            {(overview.topMaliciousIps || []).map((row) => (
              <div key={row.ip} className="alert warning">
                <span>{row.ip}</span>
                <span className="mono">{row.count} alerts</span>
              </div>
            ))}
            {!overview.topMaliciousIps?.length ? (
              <p className="muted">No suspicious IPs in selected range.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid charts">
        <div className="card chart">
          <p className="label">Attack Timeline</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overview.timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24324f" />
              <XAxis dataKey="ts" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart">
          <p className="label">Severity Count</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overview.severityCount || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24324f" />
              <XAxis dataKey="severity" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid charts">
        <AnomalyGraph
          title={`CPU Usage Anomalies${selectedNode ? ` (${selectedNode})` : ""}`}
          data={cpuHistory.data}
          anomalies={cpuAnomalies}
          unit="%"
          color="#22c55e"
        />
        <AnomalyGraph
          title={`Memory Usage Anomalies${selectedNode ? ` (${selectedNode})` : ""}`}
          data={memHistory.data}
          anomalies={memAnomalies}
          unit="%"
          color="#7c9cf5"
        />
      </div>

      <section className="section alerts">
        <div className="section-header">
          <h3>Real-Time Alerts</h3>
          <span className="mono">Live WebSocket + persisted alerts</span>
        </div>
        <div className="alert-list">
          {recentAlerts.map((alert) => (
            <div
              key={`${alert.ts}:${alert.ip}:${alert.attackType}:${alert.endpoint}`}
              className={`alert ${String(alert.severity).toLowerCase() === "critical" ? "critical" : "warning"}`}
            >
              <div>
                <strong>{alert.attackType}</strong> from {alert.ip}
                <div className="muted">
                  {alert.endpoint} ({alert.method}) {alert.evidence ? `| ${alert.evidence}` : ""}
                </div>
              </div>
              <span className="mono">{new Date(alert.ts).toLocaleString()}</span>
            </div>
          ))}
          {!recentAlerts.length ? <p className="muted">No alerts in selected range.</p> : null}
        </div>
      </section>
    </div>
  );
}
