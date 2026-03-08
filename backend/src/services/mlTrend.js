import MetricSample from "../models/MetricSample.js";

function linearRegression(points) {
  if (points.length < 2) return null;
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predictTimeToThreshold(current, slopePerMs, threshold) {
  if (!slopePerMs || slopePerMs <= 0) return null;
  const remaining = threshold - current;
  if (remaining <= 0) return 0;
  return remaining / slopePerMs;
}

export async function computeNodePredictions(nodes) {
  const predictions = [];
  for (const node of nodes) {
    const cpuSamples = await MetricSample.find({
      "meta.scope": "node",
      "meta.target": node.name,
      "meta.metric": "cpuUsage"
    })
      .sort({ ts: -1 })
      .limit(30)
      .lean();

    const memSamples = await MetricSample.find({
      "meta.scope": "node",
      "meta.target": node.name,
      "meta.metric": "memUsedPct"
    })
      .sort({ ts: -1 })
      .limit(30)
      .lean();

    const cpuPoints = cpuSamples
      .reverse()
      .filter((s) => typeof s.value === "number")
      .map((s) => ({ x: new Date(s.ts).getTime(), y: s.value }));

    const memPoints = memSamples
      .reverse()
      .filter((s) => typeof s.value === "number")
      .map((s) => ({ x: new Date(s.ts).getTime(), y: s.value }));

    const cpuTrend = linearRegression(cpuPoints);
    const memTrend = linearRegression(memPoints);

    const cpuSlope = cpuTrend ? cpuTrend.slope : null;
    const memSlope = memTrend ? memTrend.slope : null;

    const cpuEtaMs = cpuSlope ? predictTimeToThreshold(node.cpuUsage || 0, cpuSlope, 80) : null;
    const memEtaMs = memSlope ? predictTimeToThreshold(node.memUsedPct || 0, memSlope, 75) : null;

    predictions.push({
      node: node.name,
      cpu: {
        slopePerHour: cpuSlope ? cpuSlope * 3600000 : null,
        etaMs: cpuEtaMs
      },
      memory: {
        slopePerHour: memSlope ? memSlope * 3600000 : null,
        etaMs: memEtaMs
      }
    });
  }

  return predictions;
}
