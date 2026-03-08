import { Gauge } from "../components/Gauge.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { AlertList } from "../components/AlertList.jsx";
import { useMetricHistory } from "../components/useMetricHistory.js";
import { useAnomalyEvents } from "../components/useAnomalyEvents.js";
import { AnomalyGraph } from "../components/AnomalyGraph.jsx";

function formatBytes(value) {
  if (value === null || value === undefined) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let num = value;
  while (num >= 1024 && idx < units.length - 1) {
    num /= 1024;
    idx += 1;
  }
  return `${num.toFixed(1)} ${units[idx]}`;
}

function formatEta(ms) {
  if (ms === null || ms === undefined) return "-";
  if (ms === 0) return "now";
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
}

function NodeSection({ node, prediction }) {
  const cpuHistory = useMetricHistory({
    scope: "node",
    target: node.name,
    metric: "cpuUsage",
    rangeMs: 1800000,
    refreshMs: 30000
  });
  const memHistory = useMetricHistory({
    scope: "node",
    target: node.name,
    metric: "memUsedPct",
    rangeMs: 1800000,
    refreshMs: 30000
  });
  const cpuAnomalies = useAnomalyEvents({
    scope: "node",
    target: node.name,
    metric: "cpuUsage",
    rangeMs: 1800000,
    refreshMs: 30000
  });
  const memAnomalies = useAnomalyEvents({
    scope: "node",
    target: node.name,
    metric: "memUsedPct",
    rangeMs: 1800000,
    refreshMs: 30000
  });

  return (
    <section className="section">
      <div className="section-header">
        <h2>{node.name}</h2>
        <span className="mono">{node.instance}</span>
      </div>

      <div className="grid gauges">
        <Gauge label="CPU Usage" value={node.cpuUsage} unit="%" />
        <Gauge label="Memory Usage" value={node.memUsedPct} unit="%" />
        <MetricCard label="Load Avg (1m)" value={node.load1?.toFixed(2)} />
        <MetricCard label="Disk Usage" value={node.diskUsagePct?.toFixed(1)} unit="%" />
        <MetricCard label="Disk Read" value={formatBytes(node.diskReadBytes)} unit="/s" />
        <MetricCard label="Disk Write" value={formatBytes(node.diskWriteBytes)} unit="/s" />
        <MetricCard label="Net In" value={formatBytes(node.netInBytes)} unit="/s" />
        <MetricCard label="Net Out" value={formatBytes(node.netOutBytes)} unit="/s" />
        <MetricCard label="Uptime" value={node.uptimeSeconds ? (node.uptimeSeconds / 3600).toFixed(1) : "-"} unit="h" />
        <MetricCard
          label="CPU Trend (per hr)"
          value={prediction?.cpu?.slopePerHour ? prediction.cpu.slopePerHour.toFixed(2) : "-"}
          unit="%/hr"
        />
        <MetricCard
          label="CPU ETA to 80%"
          value={formatEta(prediction?.cpu?.etaMs)}
        />
        <MetricCard
          label="Mem Trend (per hr)"
          value={prediction?.memory?.slopePerHour ? prediction.memory.slopePerHour.toFixed(2) : "-"}
          unit="%/hr"
        />
        <MetricCard
          label="Mem ETA to 75%"
          value={formatEta(prediction?.memory?.etaMs)}
        />
      </div>

      <div className="grid charts">
        <AnomalyGraph
          title="CPU Usage (last 30m)"
          data={cpuHistory.data}
          anomalies={cpuAnomalies}
          unit="%"
        />
        <AnomalyGraph
          title="Memory Usage (last 30m)"
          data={memHistory.data}
          anomalies={memAnomalies}
          unit="%"
          color="#f59e0b"
        />
      </div>
    </section>
  );
}

export default function InfraDashboard({ snapshot }) {
  const nodes = snapshot?.nodes || [];
  const predictions = snapshot?.predictions || [];
  return (
    <div className="dashboard">
      <AlertList alerts={snapshot?.alerts || []} />
      {nodes.length ? (
        nodes.map((node) => (
          <NodeSection
            key={node.name}
            node={node}
            prediction={predictions.find((p) => p.node === node.name)}
          />
        ))
      ) : (
        <p className="muted">No node targets configured.</p>
      )}
    </div>
  );
}
