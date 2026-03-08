const SQLI_RULES = [
  { regex: /'?\s*or\s+1=1\s*(--|#)?/i, label: "OR 1=1 pattern" },
  { regex: /\bunion\s+select\b/i, label: "UNION SELECT pattern" },
  { regex: /\bdrop\s+table\b/i, label: "DROP TABLE pattern" },
  { regex: /;--/, label: "statement chaining ;-- pattern" },
  { regex: /--/, label: "SQL comment -- pattern" }
];

const XSS_RULES = [
  { regex: /<script\b/i, label: "<script> tag pattern" },
  { regex: /javascript:/i, label: "javascript: URI pattern" },
  { regex: /onerror\s*=/i, label: "onerror event pattern" },
  { regex: /<img\s+src=/i, label: "<img src=> pattern" }
];

const REQUEST_SPIKE_WINDOW_MS = 30000;
const REQUEST_SPIKE_THRESHOLD = 200;
const LOGIN_WINDOW_MS = 60000;
const LOGIN_THRESHOLD = 10;
const ALERT_COOLDOWN_MS = 30000;

const requestTimestampsByIp = new Map();
const loginTimestampsByIp = new Map();
const alertCooldownByKey = new Map();

function toCompactString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function trimWindow(values, nowMs, windowMs) {
  // Sliding-window pruning keeps O(window) memory for each tracked IP.
  while (values.length && nowMs - values[0] > windowMs) {
    values.shift();
  }
}

function pushWindowValue(map, key, nowMs, windowMs) {
  const values = map.get(key) || [];
  values.push(nowMs);
  trimWindow(values, nowMs, windowMs);
  map.set(key, values);
  return values.length;
}

function shouldEmitCooldownAlert(key, nowMs) {
  const last = alertCooldownByKey.get(key);
  if (last && nowMs - last < ALERT_COOLDOWN_MS) {
    return false;
  }
  alertCooldownByKey.set(key, nowMs);
  return true;
}

function detectPatternAlerts(payload, rules, attackType, severity, context) {
  const alerts = [];
  for (const rule of rules) {
    if (!rule.regex.test(payload)) continue;
    alerts.push({
      ...context,
      attackType,
      severity,
      evidence: rule.label,
      message: `${attackType} signature detected (${rule.label})`
    });
    break;
  }
  return alerts;
}

function isLoginAttempt(method, endpoint) {
  return method === "POST" && /\/login\b/i.test(endpoint || "");
}

export function detectSecurityThreats({
  ip,
  endpoint,
  method,
  requestBody,
  statusCode,
  responseTimeMs,
  ts = new Date()
}) {
  const nowMs = ts.getTime();
  const baseContext = {
    ts,
    ip,
    endpoint,
    method,
    statusCode,
    responseTimeMs
  };

  const payload = `${endpoint || ""} ${toCompactString(requestBody)}`;
  const alerts = [
    ...detectPatternAlerts(payload, SQLI_RULES, "SQL Injection", "Critical", baseContext),
    ...detectPatternAlerts(payload, XSS_RULES, "XSS", "Critical", baseContext)
  ];

  const requestCount = pushWindowValue(
    requestTimestampsByIp,
    ip,
    nowMs,
    REQUEST_SPIKE_WINDOW_MS
  );
  if (requestCount > REQUEST_SPIKE_THRESHOLD) {
    const key = `${ip}:traffic_spike`;
    if (shouldEmitCooldownAlert(key, nowMs)) {
      alerts.push({
        ...baseContext,
        attackType: "Traffic Spike",
        severity: "Critical",
        evidence: "high request volume from one IP",
        message: `Potential DDoS or abuse: ${requestCount} requests in ${REQUEST_SPIKE_WINDOW_MS / 1000}s`,
        countInWindow: requestCount,
        windowMs: REQUEST_SPIKE_WINDOW_MS
      });
    }
  }

  if (isLoginAttempt(method, endpoint)) {
    const loginCount = pushWindowValue(loginTimestampsByIp, ip, nowMs, LOGIN_WINDOW_MS);
    if (loginCount > LOGIN_THRESHOLD) {
      const key = `${ip}:brute_force`;
      if (shouldEmitCooldownAlert(key, nowMs)) {
        alerts.push({
          ...baseContext,
          attackType: "Brute Force",
          severity: "Medium",
          evidence: "repeated login attempts from one IP",
          message: `Brute-force pattern: ${loginCount} login attempts in ${LOGIN_WINDOW_MS / 1000}s`,
          countInWindow: loginCount,
          windowMs: LOGIN_WINDOW_MS
        });
      }
    }
  }

  return alerts;
}
