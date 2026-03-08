import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "../components/StatusPill.jsx";
import { MetricCard } from "../components/MetricCard.jsx";
import { TimeSeriesChart } from "../components/TimeSeriesChart.jsx";
import { AlertList } from "../components/AlertList.jsx";
import { useMetricHistory } from "../components/useMetricHistory.js";
import { TimeRangeControls } from "../components/TimeRangeControls.jsx";
import { WebsiteForm } from "../components/WebsiteForm.jsx";
import { ThresholdPanel } from "../components/ThresholdPanel.jsx";
import { StatusCodeChart } from "../components/StatusCodeChart.jsx";
import { ChartModal } from "../components/ChartModal.jsx";
import { ManageWebsitesTable } from "../components/ManageWebsitesTable.jsx";
import { deleteWebsite, getTargets, getThresholds, getSla, updateWebsite } from "../components/api.js";

const ORDER_KEY = "realmonitor:web:order";
const COLLAPSE_KEY = "realmonitor:web:collapsed";

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

function WebsiteSection({
  site,
  live,
  rangeMs,
  refreshMs,
  refreshKey,
  latencyThreshold,
  sla,
  onRemove,
  onToggleCollapse,
  collapsed,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const [activeMetric, setActiveMetric] = useState("latency");
  const [expanded, setExpanded] = useState(null);

  const latencyHistory = useMetricHistory({
    scope: "website",
    target: site.name,
    metric: "latencyMs",
    rangeMs,
    refreshMs,
    refreshKey
  });

  const statusHistory = useMetricHistory({
    scope: "website",
    target: site.name,
    metric: "statusCode",
    rangeMs,
    refreshMs,
    refreshKey
  });

  const sslHistory = useMetricHistory({
    scope: "website",
    target: site.name,
    metric: "sslExpiryDays",
    rangeMs,
    refreshMs,
    refreshKey
  });

  const status = live?.status || (site.paused ? "PAUSED" : "UNKNOWN");

  return (
    <section
      className={`section draggable ${collapsed ? "collapsed" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="section-header">
        <div className="section-title">
          <span className="drag-handle">::</span>
          <div>
            <h2>{site.name}</h2>
            <span className="mono">{site.url}</span>
          </div>
        </div>
        <div className="inline-actions">
          <StatusPill status={status === "UNKNOWN" ? "DOWN" : status} />
          <button className="ghost" onClick={() => onRemove(site.url)}>
            Delete
          </button>
          <button className="ghost" onClick={onToggleCollapse}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <>
          <div className="metric-tabs">
            <button
              className={activeMetric === "latency" ? "tab-chip active" : "tab-chip"}
              onClick={() => setActiveMetric("latency")}
            >
              Response Time
            </button>
            <button
              className={activeMetric === "status" ? "tab-chip active" : "tab-chip"}
              onClick={() => setActiveMetric("status")}
            >
              Status Codes
            </button>
            <button
              className={activeMetric === "ssl" ? "tab-chip active" : "tab-chip"}
              onClick={() => setActiveMetric("ssl")}
            >
              SSL Expiry
            </button>
          </div>

          <div className="grid metrics">
            <MetricCard label="Latency" value={live?.latencyMs?.toFixed?.(0)} unit="ms" />
            <MetricCard label="HTTP Status" value={live?.statusCode ?? "-"} />
            <MetricCard label="SSL Expiry" value={live?.sslExpiryDays?.toFixed?.(1) ?? "-"} unit="days" />
            <MetricCard label="Error Reason" value={live?.errorReason ?? "-"} />
            <MetricCard
              label="Health Score"
              value={sla?.healthScore != null ? sla.healthScore.toFixed(0) : "-"}
              unit="%"
            />
            <MetricCard
              label="SLA 24h"
              value={sla?.uptime24h != null ? sla.uptime24h.toFixed(2) : "-"}
              unit="%"
            />
            <MetricCard
              label="SLA 7d"
              value={sla?.uptime7d != null ? sla.uptime7d.toFixed(2) : "-"}
              unit="%"
            />
          </div>

          <div className="grid charts">
            {activeMetric === "latency" ? (
              <TimeSeriesChart
                title="Response Time"
                data={latencyHistory.data}
                unit="ms"
                color="#10b981"
                threshold={latencyThreshold}
                onExpand={() =>
                  setExpanded({
                    title: `${site.name} - Response Time`,
                    type: "latency"
                  })
                }
              />
            ) : null}

            {activeMetric === "status" ? (
              <StatusCodeChart
                data={statusHistory.data}
                onExpand={() =>
                  setExpanded({
                    title: `${site.name} - Status Codes`,
                    type: "status"
                  })
                }
              />
            ) : null}

            {activeMetric === "ssl" ? (
              <TimeSeriesChart
                title="SSL Expiry (Days)"
                data={sslHistory.data}
                unit="days"
                color="#7c9cf5"
                onExpand={() =>
                  setExpanded({
                    title: `${site.name} - SSL Expiry`,
                    type: "ssl"
                  })
                }
              />
            ) : null}
          </div>
        </>
      )}

      <ChartModal open={!!expanded} title={expanded?.title} onClose={() => setExpanded(null)}>
        {expanded?.type === "latency" ? (
          <TimeSeriesChart
            title="Response Time"
            data={latencyHistory.data}
            unit="ms"
            color="#10b981"
            threshold={latencyThreshold}
            height={420}
          />
        ) : null}
        {expanded?.type === "status" ? (
          <StatusCodeChart data={statusHistory.data} height={420} />
        ) : null}
        {expanded?.type === "ssl" ? (
          <TimeSeriesChart
            title="SSL Expiry (Days)"
            data={sslHistory.data}
            unit="days"
            color="#7c9cf5"
            height={420}
          />
        ) : null}
      </ChartModal>
    </section>
  );
}

export default function WebDashboard({ snapshot }) {
  const [rangeMs, setRangeMs] = useState(300000);
  const [refreshMs, setRefreshMs] = useState(5000);
  const [refreshKey, setRefreshKey] = useState(0);
  const [targets, setTargets] = useState([]);
  const [thresholds, setThresholds] = useState({ latencyWarnMs: 500 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSeen, setLastSeen] = useState({});
  const [slaByName, setSlaByName] = useState({});
  const [order, setOrder] = useState(() => readStorage(ORDER_KEY, []));
  const [collapsed, setCollapsed] = useState(() => readStorage(COLLAPSE_KEY, {}));

  useEffect(() => {
    writeStorage(ORDER_KEY, order);
  }, [order]);

  useEffect(() => {
    writeStorage(COLLAPSE_KEY, collapsed);
  }, [collapsed]);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTargets();
      const websites = data.websites || [];
      setTargets(websites);
      setOrder((prev) => (prev.length ? prev : websites.map((site) => site.url)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThresholds = useCallback(async () => {
    try {
      const data = await getThresholds();
      setThresholds(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadSla = useCallback(async (websites) => {
    try {
      const rows = await Promise.all(
        websites.map((site) => getSla(site.name).catch(() => null))
      );
      const map = {};
      rows.forEach((row) => {
        if (row?.target) {
          map[row.target] = row;
        }
      });
      setSlaByName(map);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadTargets();
    loadThresholds();
  }, [loadTargets, loadThresholds]);

  useEffect(() => {
    if (!targets.length) return;
    loadSla(targets);
  }, [targets, refreshKey, loadSla]);

  useEffect(() => {
    const ts = snapshot?.ts ? new Date(snapshot.ts).toLocaleString() : null;
    if (!ts) return;
    const updates = {};
    for (const site of snapshot?.websites || []) {
      if (site.status === "UP") {
        updates[site.name] = ts;
      }
    }
    if (Object.keys(updates).length) {
      setLastSeen((prev) => ({ ...prev, ...updates }));
    }
  }, [snapshot]);

  const liveByName = useMemo(() => {
    const map = new Map();
    for (const site of snapshot?.websites || []) {
      map.set(site.name, site);
    }
    return map;
  }, [snapshot]);

  const orderedTargets = useMemo(() => {
    const map = new Map(targets.map((site) => [site.url, site]));
    const ordered = order.map((url) => map.get(url)).filter(Boolean);
    const missing = targets.filter((site) => !order.includes(site.url));
    return [...ordered, ...missing];
  }, [targets, order]);

  const handleRemove = async (url) => {
    try {
      await deleteWebsite(url);
      await loadTargets();
      setOrder((prev) => prev.filter((item) => item !== url));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePauseToggle = async (site) => {
    try {
      await updateWebsite({ url: site.url, paused: !site.paused });
      await loadTargets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleThresholdSave = async (site, data) => {
    try {
      await updateWebsite({
        url: site.url,
        thresholds: {
          alertsEnabled: !!data.alertsEnabled,
          latencyWarnMs: Number(data.latencyWarnMs),
          downCritical: !!data.downCritical
        }
      });
      await loadTargets();
      await loadSla(targets);
    } catch (err) {
      setError(err.message);
    }
  };

  const manualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const toggleCollapse = (url) => {
    setCollapsed((prev) => ({ ...prev, [url]: !prev[url] }));
  };

  const onDragStart = (url) => (event) => {
    event.dataTransfer.setData("text/plain", url);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDrop = (url) => (event) => {
    event.preventDefault();
    const dragged = event.dataTransfer.getData("text/plain");
    if (!dragged || dragged === url) return;
    setOrder((prev) => {
      const next = prev.filter((item) => item !== dragged);
      const index = next.indexOf(url);
      next.splice(index, 0, dragged);
      return next;
    });
  };

  return (
    <div className="dashboard">
      <div className="toolbar">
        <div>
          <h2>Website Monitoring</h2>
          <p className="muted">Grafana-like controls with live Prometheus data</p>
        </div>
        <TimeRangeControls
          rangeMs={rangeMs}
          refreshMs={refreshMs}
          onRangeChange={setRangeMs}
          onRefreshChange={setRefreshMs}
          onManualRefresh={manualRefresh}
        />
      </div>

      <div className="grid panels">
        <WebsiteForm onAdded={loadTargets} />
        <ThresholdPanel
          onUpdated={(data) => {
            setThresholds(data);
            manualRefresh();
          }}
        />
      </div>

      <ManageWebsitesTable
        websites={targets}
        liveByName={liveByName}
        lastSeen={lastSeen}
        slaByName={slaByName}
        onPauseToggle={handlePauseToggle}
        onThresholdSave={handleThresholdSave}
        onRemove={handleRemove}
      />

      <AlertList alerts={snapshot?.alerts || []} />

      {error ? <div className="card error">{error}</div> : null}
      {loading ? <p className="muted">Loading targets...</p> : null}

      {orderedTargets.length ? (
        orderedTargets.map((site) => {
          const threshold =
            site.thresholds?.latencyWarnMs ?? thresholds?.latencyWarnMs ?? 500;
          return (
            <WebsiteSection
              key={site.url}
              site={site}
              live={liveByName.get(site.name)}
              rangeMs={rangeMs}
              refreshMs={refreshMs}
              refreshKey={refreshKey}
              latencyThreshold={threshold}
              sla={slaByName[site.name]}
              onRemove={handleRemove}
              onToggleCollapse={() => toggleCollapse(site.url)}
              collapsed={!!collapsed[site.url]}
              onDragStart={onDragStart(site.url)}
              onDragOver={onDragOver}
              onDrop={onDrop(site.url)}
            />
          );
        })
      ) : (
        <p className="muted">No website targets configured.</p>
      )}
    </div>
  );
}
