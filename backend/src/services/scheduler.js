import MetricSample from "../models/MetricSample.js";
import { query } from "./prometheus.js";
import { nodeQueries, websiteQueries } from "../utils/promql.js";
import { evaluateAlerts } from "./alertEngine.js";
import { computeNodePredictions } from "./mlTrend.js";
import { loadTargets, computeProbeUrl } from "./configStore.js";
import { detectPerformanceAnomalies } from "./anomalyDetection.js";

let currentSnapshot = {
  ts: new Date().toISOString(),
  nodes: [],
  websites: [],
  alerts: [],
  predictions: [],
  anomalies: []
};

function safeNumber(value) {
  if (value === null || value === undefined) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function extractScalar(response) {
  if (!response || response.status !== "success") return null;
  const result = response.data?.result || [];
  if (!result.length) return null;
  const value = result[0].value?.[1];
  return safeNumber(value);
}

async function collectNodeMetrics(target) {
  const queries = nodeQueries(target.job, target.instance);

  const [
    cpuUsage,
    load1,
    load5,
    load15,
    memUsedPct,
    memTotal,
    memAvail,
    diskUsagePct,
    diskReadBytes,
    diskWriteBytes,
    netInBytes,
    netOutBytes,
    uptimeSeconds
  ] = await Promise.all([
    query(queries.cpuUsage).then(extractScalar),
    query(queries.load1).then(extractScalar),
    query(queries.load5).then(extractScalar),
    query(queries.load15).then(extractScalar),
    query(queries.memUsedPct).then(extractScalar),
    query(queries.memTotal).then(extractScalar),
    query(queries.memAvail).then(extractScalar),
    query(queries.diskUsagePct).then(extractScalar),
    query(queries.diskReadBytes).then(extractScalar),
    query(queries.diskWriteBytes).then(extractScalar),
    query(queries.netInBytes).then(extractScalar),
    query(queries.netOutBytes).then(extractScalar),
    query(queries.uptimeSeconds).then(extractScalar)
  ]);

  return {
    name: target.name,
    instance: target.instance,
    cpuUsage,
    load1,
    load5,
    load15,
    memUsedPct,
    memTotal,
    memAvail,
    diskUsagePct,
    diskReadBytes,
    diskWriteBytes,
    netInBytes,
    netOutBytes,
    uptimeSeconds
  };
}

async function collectWebsiteMetrics(target) {
  if (target.paused) {
    return {
      name: target.name,
      url: target.url,
      status: "PAUSED",
      latencyMs: null,
      statusCode: null,
      errorReason: "paused",
      sslExpiryDays: null
    };
  }

  const probeUrl = target.probeUrl || computeProbeUrl(target.url);
  const isLocal =
    target.url?.includes("localhost") ||
    target.url?.includes("127.0.0.1") ||
    target.url?.includes("0.0.0.0");
  const queries = websiteQueries(probeUrl);
  const [success, durationSeconds, httpStatus, sslExpiryDays] = await Promise.all([
    query(queries.success).then(extractScalar),
    query(queries.durationSeconds).then(extractScalar),
    query(queries.httpStatus).then(extractScalar),
    query(queries.sslExpiryDays).then(extractScalar)
  ]);

  const up = success === 1;
  const latencyMs = up ? safeNumber(durationSeconds) * 1000 : null;
  const statusCode = up ? httpStatus : null;
  const errorReason = up
    ? null
    : statusCode
    ? `HTTP ${statusCode}`
    : isLocal
    ? "local site unreachable: run dev server with --host 0.0.0.0"
    : "timeout or connection failure";

  return {
    name: target.name,
    url: target.url,
    status: up ? "UP" : "DOWN",
    latencyMs,
    statusCode,
    errorReason,
    sslExpiryDays: safeNumber(sslExpiryDays)
  };
}

function buildSamples(snapshot, targets) {
  const ts = new Date();
  const samples = [];

  for (const node of snapshot.nodes) {
    const metaBase = { scope: "node", target: node.name, labels: { instance: node.instance } };
    const push = (metric, value) => samples.push({ ts, value, meta: { ...metaBase, metric } });

    push("cpuUsage", node.cpuUsage);
    push("load1", node.load1);
    push("load5", node.load5);
    push("load15", node.load15);
    push("memUsedPct", node.memUsedPct);
    push("memTotal", node.memTotal);
    push("memAvail", node.memAvail);
    push("diskUsagePct", node.diskUsagePct);
    push("diskReadBytes", node.diskReadBytes);
    push("diskWriteBytes", node.diskWriteBytes);
    push("netInBytes", node.netInBytes);
    push("netOutBytes", node.netOutBytes);
    push("uptimeSeconds", node.uptimeSeconds);
  }

  const siteConfig = new Map((targets.websites || []).map((site) => [site.name, site]));
  for (const site of snapshot.websites) {
    if (siteConfig.get(site.name)?.paused) {
      continue;
    }
    const metaBase = { scope: "website", target: site.name, labels: { url: site.url } };
    const push = (metric, value) => samples.push({ ts, value, meta: { ...metaBase, metric } });

    push("status", site.status === "UP" ? 1 : 0);
    push("latencyMs", site.latencyMs);
    push("statusCode", site.statusCode);
    push("sslExpiryDays", site.sslExpiryDays);
  }

  return samples;
}

function broadcast(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

export function getCurrentSnapshot() {
  return currentSnapshot;
}

export function startScheduler({ wss }) {
  const interval = parseInt(process.env.POLL_INTERVAL_MS || "15000", 10);

  const tick = async () => {
    try {
      const targets = await loadTargets();
      const [nodes, websites] = await Promise.all([
        Promise.all((targets.nodes || []).map(collectNodeMetrics)),
        Promise.all((targets.websites || []).map(collectWebsiteMetrics))
      ]);

      const snapshot = {
        ts: new Date().toISOString(),
        nodes,
        websites,
        alerts: [],
        predictions: [],
        anomalies: []
      };

      const samples = buildSamples(snapshot, targets);
      if (samples.length) {
        await MetricSample.insertMany(samples);
      }

      const alerts = await evaluateAlerts(snapshot);
      snapshot.alerts = alerts;

      snapshot.predictions = await computeNodePredictions(nodes);
      snapshot.anomalies = await detectPerformanceAnomalies(snapshot, new Date(snapshot.ts));

      currentSnapshot = snapshot;
      broadcast(wss, { type: "metrics:update", payload: snapshot });
    } catch (err) {
      console.error("Scheduler tick failed", err.message);
    }
  };

  tick();
  setInterval(tick, interval);
}
