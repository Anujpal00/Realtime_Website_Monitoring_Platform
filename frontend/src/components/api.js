const defaultApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : "http://localhost:4000";

const apiBase = import.meta.env.VITE_API_BASE || defaultApiBase;

async function request(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}

export function getTargets() {
  return request("/api/metrics/targets");
}

export function getThresholds() {
  return request("/api/config/thresholds");
}

export function updateThresholds(payload) {
  return request("/api/config/thresholds", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function addWebsite(payload) {
  return request("/api/config/websites", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateWebsite(payload) {
  return request("/api/config/websites", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteWebsite(url) {
  return request(`/api/config/websites?url=${encodeURIComponent(url)}`, {
    method: "DELETE"
  });
}

export function getSla(target) {
  return request(`/api/metrics/sla?target=${encodeURIComponent(target)}`);
}

export function getSecurityOverview(rangeMs, limit = 100) {
  return request(`/api/security/overview?rangeMs=${rangeMs}&limit=${limit}`);
}

export function getSecurityAlerts(rangeMs, limit = 200) {
  return request(`/api/security/alerts?rangeMs=${rangeMs}&limit=${limit}`);
}

export function getAnomalyEvents({ scope, target, metric, from, to, limit = 500 }) {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (target) params.set("target", target);
  if (metric) params.set("metric", metric);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("limit", String(limit));
  return request(`/api/metrics/anomalies?${params.toString()}`);
}
