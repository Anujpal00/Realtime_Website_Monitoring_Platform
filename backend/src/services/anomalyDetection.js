import MetricSample from "../models/MetricSample.js";
import AnomalyEvent from "../models/AnomalyEvent.js";
import { broadcastEvent } from "../ws/socket.js";

const HISTORY_WINDOW_MS = 2 * 60 * 60 * 1000;
const MIN_HISTORY_POINTS = 10;
const MAX_POINTS = 120;

function mean(values) {
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stdDev(values, avg) {
  if (values.length <= 1) return 0;
  const variance =
    values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function toSeverity(value, threshold) {
  const ratio = threshold > 0 ? value / threshold : 1;
  if (ratio >= 1.5) return "Critical";
  if (ratio >= 1.2) return "Medium";
  return "Low";
}

function metricCandidates(snapshot) {
  const rows = [];

  for (const node of snapshot.nodes || []) {
    if (typeof node.cpuUsage === "number") {
      rows.push({
        scope: "node",
        target: node.name,
        metric: "cpuUsage",
        value: node.cpuUsage
      });
    }
    if (typeof node.memUsedPct === "number") {
      rows.push({
        scope: "node",
        target: node.name,
        metric: "memUsedPct",
        value: node.memUsedPct
      });
    }
  }

  for (const site of snapshot.websites || []) {
    if (typeof site.latencyMs === "number") {
      rows.push({
        scope: "website",
        target: site.name,
        metric: "latencyMs",
        value: site.latencyMs
      });
    }
  }

  return rows;
}

async function loadHistory({ scope, target, metric, ts }) {
  const since = new Date(ts.getTime() - HISTORY_WINDOW_MS);
  // Pull a bounded history window to keep anomaly evaluation fast.
  const rows = await MetricSample.find({
    "meta.scope": scope,
    "meta.target": target,
    "meta.metric": metric,
    ts: { $gte: since, $lt: ts }
  })
    .sort({ ts: -1 })
    .limit(MAX_POINTS)
    .select({ value: 1 })
    .lean();

  return rows
    .map((row) => row.value)
    .filter((value) => typeof value === "number")
    .reverse();
}

export async function detectPerformanceAnomalies(snapshot, ts = new Date()) {
  const candidates = metricCandidates(snapshot);
  const events = [];

  for (const candidate of candidates) {
    const history = await loadHistory({ ...candidate, ts });
    if (history.length < MIN_HISTORY_POINTS) continue;

    const avg = mean(history);
    const sd = stdDev(history, avg);
    if (sd <= 0) continue;

    const threshold = avg + 2 * sd;
    if (candidate.value <= threshold) continue;

    const severity = toSeverity(candidate.value, threshold);
    const event = {
      ts,
      scope: candidate.scope,
      target: candidate.target,
      metric: candidate.metric,
      severity,
      model: "mean_plus_2std",
      value: candidate.value,
      mean: Number(avg.toFixed(4)),
      stdDev: Number(sd.toFixed(4)),
      threshold: Number(threshold.toFixed(4)),
      message: `${candidate.metric} anomaly on ${candidate.target}: ${candidate.value.toFixed(
        2
      )} > ${threshold.toFixed(2)}`
    };

    events.push(event);
  }

  if (events.length) {
    await AnomalyEvent.insertMany(events, { ordered: false });
    for (const event of events) {
      broadcastEvent("anomaly:event", event);
    }
  }

  return events;
}
