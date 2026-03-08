import { Router } from "express";
import {
  loadTargets,
  saveTargets,
  loadThresholds,
  saveThresholds,
  syncFileSdTargets,
  computeProbeUrl
} from "../services/configStore.js";
import { reloadPrometheus } from "../services/prometheusAdmin.js";

const router = Router();

async function refreshPrometheus(websites) {
  await syncFileSdTargets(websites);
  try {
    await reloadPrometheus();
  } catch (err) {
    console.error("Prometheus reload failed", err.message);
  }
}

router.get("/thresholds", async (req, res) => {
  const thresholds = await loadThresholds();
  res.json(thresholds);
});

router.post("/thresholds", async (req, res) => {
  const body = req.body || {};
  const next = {
    alertsEnabled: body.alertsEnabled !== false,
    latencyWarnMs: Number(body.latencyWarnMs || 500),
    downCritical: body.downCritical !== false
  };
  await saveThresholds(next);
  res.json(next);
});

router.get("/websites", async (req, res) => {
  const targets = await loadTargets();
  res.json(targets.websites || []);
});

router.post("/websites", async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  const targets = await loadTargets();
  const websites = targets.websites || [];
  const exists = websites.find((site) => site.url === body.url);
  if (exists) {
    return res.status(409).json({ error: "website already exists" });
  }

  websites.push({
    name: body.name,
    url: body.url,
    probeUrl: body.probeUrl || computeProbeUrl(body.url),
    type: body.type || "uptime+latency",
    timeoutSeconds: Number(body.timeoutSeconds || 5),
    paused: false,
    thresholds: {
      alertsEnabled: true,
      latencyWarnMs: Number(body.latencyWarnMs || 500),
      downCritical: true
    }
  });

  await saveTargets({ ...targets, websites });
  await refreshPrometheus(websites);
  res.json(websites);
});

router.patch("/websites", async (req, res) => {
  const body = req.body || {};
  if (!body.url) {
    return res.status(400).json({ error: "url is required" });
  }

  const targets = await loadTargets();
  const websites = (targets.websites || []).map((site) => {
    if (site.url !== body.url) return site;
    return {
      ...site,
      probeUrl: site.probeUrl || computeProbeUrl(site.url),
      paused: body.paused ?? site.paused,
      thresholds: {
        alertsEnabled:
          body.thresholds?.alertsEnabled ?? site.thresholds?.alertsEnabled ?? true,
        latencyWarnMs:
          Number(body.thresholds?.latencyWarnMs ?? site.thresholds?.latencyWarnMs ?? 500),
        downCritical:
          body.thresholds?.downCritical ?? site.thresholds?.downCritical ?? true
      }
    };
  });

  await saveTargets({ ...targets, websites });
  await refreshPrometheus(websites);
  res.json(websites);
});

router.delete("/websites", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }
  const targets = await loadTargets();
  const websites = (targets.websites || []).filter((site) => site.url !== url);
  await saveTargets({ ...targets, websites });
  await refreshPrometheus(websites);
  res.json(websites);
});

router.post("/reload", async (req, res) => {
  try {
    await reloadPrometheus();
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
