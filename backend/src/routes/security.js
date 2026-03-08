import { Router } from "express";
import SecurityAlert from "../models/SecurityAlert.js";

const router = Router();

function parseRangeMs(value, fallback = 3600000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function timelineDateFormat(rangeMs) {
  if (rangeMs <= 60000) return "%Y-%m-%dT%H:%M:%S.000Z";
  if (rangeMs <= 3600000) return "%Y-%m-%dT%H:%M:00.000Z";
  return "%Y-%m-%dT%H:00:00.000Z";
}

router.get("/overview", async (req, res) => {
  try {
    const rangeMs = parseRangeMs(req.query.rangeMs, 3600000);
    const since = new Date(Date.now() - rangeMs);
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 500);

    const [total, attackTypeDistribution, topMaliciousIps, severityCount, timeline, recentAlerts] =
      await Promise.all([
        SecurityAlert.countDocuments({ ts: { $gte: since } }),
        SecurityAlert.aggregate([
          { $match: { ts: { $gte: since } } },
          { $group: { _id: "$attackType", count: { $sum: 1 } } },
          { $project: { _id: 0, attackType: "$_id", count: 1 } },
          { $sort: { count: -1 } }
        ]),
        SecurityAlert.aggregate([
          { $match: { ts: { $gte: since } } },
          { $group: { _id: "$ip", count: { $sum: 1 } } },
          { $project: { _id: 0, ip: "$_id", count: 1 } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        SecurityAlert.aggregate([
          { $match: { ts: { $gte: since } } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
          { $project: { _id: 0, severity: "$_id", count: 1 } },
          { $sort: { count: -1 } }
        ]),
        SecurityAlert.aggregate([
          { $match: { ts: { $gte: since } } },
          {
            $group: {
              _id: {
                bucket: {
                  $dateToString: {
                    format: timelineDateFormat(rangeMs),
                    date: "$ts"
                  }
                }
              },
              count: { $sum: 1 }
            }
          },
          { $project: { _id: 0, ts: "$_id.bucket", count: 1 } },
          { $sort: { ts: 1 } }
        ]),
        SecurityAlert.find({ ts: { $gte: since } })
          .sort({ ts: -1 })
          .limit(limit)
          .lean()
      ]);

    return res.json({
      rangeMs,
      totalSuspiciousRequests: total,
      attackTypeDistribution,
      topMaliciousIps,
      severityCount,
      timeline,
      recentAlerts
    });
  } catch (err) {
    console.error("security overview failed", err.message);
    return res.status(500).json({ error: "Failed to build security overview" });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const rangeMs = parseRangeMs(req.query.rangeMs, 3600000);
    const since = new Date(Date.now() - rangeMs);
    const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);
    const rows = await SecurityAlert.find({ ts: { $gte: since } })
      .sort({ ts: -1 })
      .limit(limit)
      .lean();
    return res.json(rows);
  } catch (err) {
    console.error("security alerts failed", err.message);
    return res.status(500).json({ error: "Failed to load security alerts" });
  }
});

export default router;
