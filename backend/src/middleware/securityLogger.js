import SecurityLog from "../models/SecurityLog.js";
import SecurityAlert from "../models/SecurityAlert.js";
import { detectSecurityThreats } from "../services/securityDetection.js";
import { broadcastEvent } from "../ws/socket.js";

function getIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function sanitizeBody(body, maxLength = 2048) {
  if (body === undefined) return null;
  if (typeof body === "string") {
    return body.length > maxLength ? `${body.slice(0, maxLength)}...[truncated]` : body;
  }
  try {
    const asText = JSON.stringify(body);
    if (asText.length <= maxLength) return body;
    return `${asText.slice(0, maxLength)}...[truncated]`;
  } catch {
    return "[unserializable]";
  }
}

export function securityLogger() {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestTs = new Date();
    const ip = getIp(req);

    res.on("finish", async () => {
      const elapsedNs = process.hrtime.bigint() - startedAt;
      const responseTimeMs = Number(elapsedNs) / 1_000_000;
      const endpoint = req.originalUrl || req.url || "/";
      const method = req.method || "GET";
      const requestBody = sanitizeBody(req.body);
      const statusCode = res.statusCode;
      const userAgent = req.headers["user-agent"] || null;

      try {
        await SecurityLog.create({
          ts: requestTs,
          ip,
          endpoint,
          method,
          requestBody,
          statusCode,
          responseTimeMs: Number(responseTimeMs.toFixed(2)),
          userAgent
        });

        const alerts = detectSecurityThreats({
          ip,
          endpoint,
          method,
          requestBody,
          statusCode,
          responseTimeMs: Number(responseTimeMs.toFixed(2)),
          ts: requestTs
        });

        if (alerts.length) {
          await SecurityAlert.insertMany(alerts, { ordered: false });
          for (const alert of alerts) {
            broadcastEvent("security:alert", alert);
          }
        }
      } catch (err) {
        console.error("securityLogger failed", err.message);
      }
    });

    next();
  };
}
