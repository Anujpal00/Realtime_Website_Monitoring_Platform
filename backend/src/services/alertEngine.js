import AlertEvent from "../models/AlertEvent.js";
import { loadThresholds, loadTargets } from "./configStore.js";

function buildAlert({ severity, message, scope, target, metric, value, threshold }) {
  return {
    ts: new Date(),
    severity,
    message,
    scope,
    target,
    metric,
    value,
    threshold
  };
}

function mergeThresholds(global, site) {
  const overrides = site?.thresholds || {};
  return {
    alertsEnabled:
      overrides.alertsEnabled !== undefined ? overrides.alertsEnabled : global.alertsEnabled,
    latencyWarnMs: Number(overrides.latencyWarnMs ?? global.latencyWarnMs ?? 500),
    downCritical:
      overrides.downCritical !== undefined ? overrides.downCritical : global.downCritical
  };
}

export async function evaluateAlerts(snapshot) {
  const thresholds = await loadThresholds();
  const targets = await loadTargets();
  const siteConfig = new Map((targets.websites || []).map((site) => [site.name, site]));

  const cpuWarn = parseFloat(process.env.ALERT_CPU_WARN || "80");
  const memWarn = parseFloat(process.env.ALERT_MEM_WARN || "75");

  const alerts = [];

  for (const node of snapshot.nodes) {
    if (typeof node.cpuUsage === "number" && node.cpuUsage > cpuWarn) {
      alerts.push(
        buildAlert({
          severity: "warning",
          message: `CPU usage ${node.cpuUsage.toFixed(1)}% exceeds ${cpuWarn}%`,
          scope: "node",
          target: node.name,
          metric: "cpuUsage",
          value: node.cpuUsage,
          threshold: cpuWarn
        })
      );
    }
    if (typeof node.memUsedPct === "number" && node.memUsedPct > memWarn) {
      alerts.push(
        buildAlert({
          severity: "warning",
          message: `Memory usage ${node.memUsedPct.toFixed(1)}% exceeds ${memWarn}%`,
          scope: "node",
          target: node.name,
          metric: "memUsedPct",
          value: node.memUsedPct,
          threshold: memWarn
        })
      );
    }
  }

  for (const site of snapshot.websites) {
    const config = siteConfig.get(site.name);
    if (config?.paused) {
      continue;
    }
    const effective = mergeThresholds(thresholds, config);
    if (!effective.alertsEnabled) {
      continue;
    }

    if (site.status === "DOWN" && effective.downCritical) {
      alerts.push(
        buildAlert({
          severity: "critical",
          message: `Website down: ${site.name}`,
          scope: "website",
          target: site.name,
          metric: "status",
          value: null,
          threshold: null
        })
      );
    }
    if (typeof site.latencyMs === "number" && site.latencyMs > effective.latencyWarnMs) {
      alerts.push(
        buildAlert({
          severity: "warning",
          message: `Latency ${site.latencyMs.toFixed(0)}ms exceeds ${effective.latencyWarnMs}ms`,
          scope: "website",
          target: site.name,
          metric: "latencyMs",
          value: site.latencyMs,
          threshold: effective.latencyWarnMs
        })
      );
    }
  }

  if (alerts.length) {
    await AlertEvent.insertMany(alerts);
  }

  return alerts;
}
