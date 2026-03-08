import { Router } from "express";
import MetricSample from "../models/MetricSample.js";
import AlertEvent from "../models/AlertEvent.js";
import AnomalyEvent from "../models/AnomalyEvent.js";
import { getCurrentSnapshot } from "../services/scheduler.js";
import { loadTargets, loadThresholds } from "../services/configStore.js";

const router = Router();

async function computeUptimePct(target, rangeMs) {
  const since = new Date(Date.now() - rangeMs);
  const rows = await MetricSample.find({
    "meta.scope": "website",
    "meta.target": target,
    "meta.metric": "status",
    ts: { $gte: since }
  })
    .select({ value: 1 })
    .lean();

  if (!rows.length) return null;
  const sum = rows.reduce((acc, row) => acc + (row.value === 1 ? 1 : 0), 0);
  return (sum / rows.length) * 100;
}

async function computeAvgLatency(target, rangeMs) {
  const since = new Date(Date.now() - rangeMs);
  const rows = await MetricSample.find({
    "meta.scope": "website",
    "meta.target": target,
    "meta.metric": "latencyMs",
    ts: { $gte: since }
  })
    .select({ value: 1 })
    .lean();

  const values = rows.map((row) => row.value).filter((v) => typeof v === "number");
  if (!values.length) return null;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function computeHealthScore(uptimePct, avgLatency, latencyWarnMs) {
  if (uptimePct === null) return null;
  const latencyPenalty = avgLatency
    ? Math.min((avgLatency / latencyWarnMs) * 100, 100)
    : 0;
  const latencyScore = 100 - latencyPenalty;
  return Math.max(0, Math.min(100, uptimePct * 0.7 + latencyScore * 0.3));
}

router.get("/current", async (req, res) => {
  const snapshot = getCurrentSnapshot();
  res.json(snapshot);
});

router.get("/targets", async (req, res) => {
  const targets = await loadTargets();
  res.json(targets);
});

router.get("/range", async (req, res) => {
  const { scope, target, metric, from, to, limit } = req.query;
  if (!scope || !target || !metric) {
    return res.status(400).json({ error: "scope, target, metric are required" });
  }

  const query = {
    "meta.scope": scope,
    "meta.target": target,
    "meta.metric": metric
  };

  if (from || to) {
    query.ts = {};
    if (from) query.ts.$gte = new Date(from);
    if (to) query.ts.$lte = new Date(to);
  }

  const max = Math.min(parseInt(limit || "200", 10), 2000);

  const rows = await MetricSample.find(query)
    .sort({ ts: -1 })
    .limit(max)
    .lean();

  res.json(rows.reverse());
});

router.get("/alerts", async (req, res) => {
  const { limit } = req.query;
  const max = Math.min(parseInt(limit || "200", 10), 1000);
  const rows = await AlertEvent.find({}).sort({ ts: -1 }).limit(max).lean();
  res.json(rows);
});

router.get("/anomalies", async (req, res) => {
  const { scope, target, metric, from, to, limit } = req.query;
  const query = {};
  if (scope) query.scope = scope;
  if (target) query.target = target;
  if (metric) query.metric = metric;
  if (from || to) {
    query.ts = {};
    if (from) query.ts.$gte = new Date(from);
    if (to) query.ts.$lte = new Date(to);
  }

  const max = Math.min(parseInt(limit || "500", 10), 2000);
  const rows = await AnomalyEvent.find(query).sort({ ts: -1 }).limit(max).lean();
  res.json(rows.reverse());
});

router.get("/sla", async (req, res) => {
  const { target } = req.query;
  if (!target) {
    return res.status(400).json({ error: "target is required" });
  }

  const targets = await loadTargets();
  const globalThresholds = await loadThresholds();
  const site = (targets.websites || []).find((item) => item.name === target);
  const latencyWarnMs = site?.thresholds?.latencyWarnMs || globalThresholds.latencyWarnMs || 500;

  const uptime24h = await computeUptimePct(target, 86400000);
  const uptime7d = await computeUptimePct(target, 604800000);
  const avgLatency24h = await computeAvgLatency(target, 86400000);
  const healthScore = computeHealthScore(uptime24h, avgLatency24h, latencyWarnMs);

  res.json({
    target,
    uptime24h,
    uptime7d,
    avgLatency24h,
    healthScore
  });
});

export default router;
