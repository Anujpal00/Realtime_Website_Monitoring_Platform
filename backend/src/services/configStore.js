import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetsPath = path.join(__dirname, "..", "config", "targets.json");
const thresholdsPath = path.join(__dirname, "..", "config", "thresholds.json");
const fileSdPath =
  process.env.PROM_FILE_SD_PATH ||
  path.join(__dirname, "..", "..", "..", "infra", "prometheus", "targets.json");
const localhostAlias = process.env.LOCALHOST_ALIAS || "host.docker.internal";

export function computeProbeUrl(url) {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0"
    ) {
      parsed.hostname = localhostAlias;
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export async function loadTargets() {
  const raw = await fs.promises.readFile(targetsPath, "utf8");
  return JSON.parse(raw);
}

export async function saveTargets(data) {
  const payload = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(targetsPath, payload, "utf8");
}

export async function loadThresholds() {
  const raw = await fs.promises.readFile(thresholdsPath, "utf8");
  return JSON.parse(raw);
}

export async function saveThresholds(data) {
  const payload = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(thresholdsPath, payload, "utf8");
}

export async function syncFileSdTargets(websites) {
  const targets = (websites || [])
    .filter((site) => !site.paused)
    .map((site) => site.probeUrl || computeProbeUrl(site.url));

  const payload = [
    {
      targets,
      labels: { job: "blackbox" }
    }
  ];

  await fs.promises.writeFile(fileSdPath, JSON.stringify(payload, null, 2), "utf8");
}
