import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetsPath = path.join(__dirname, "..", "config", "targets.json");

export async function loadTargets() {
  const raw = await fs.promises.readFile(targetsPath, "utf8");
  return JSON.parse(raw);
}
