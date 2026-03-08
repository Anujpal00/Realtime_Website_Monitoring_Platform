import { useState } from "react";

export function ManageWebsitesTable({
  websites,
  liveByName,
  lastSeen,
  slaByName,
  onPauseToggle,
  onThresholdSave,
  onRemove
}) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ alertsEnabled: true, latencyWarnMs: 500, downCritical: true });

  const startEdit = (site) => {
    setEditing(site.url);
    setForm({
      alertsEnabled: site.thresholds?.alertsEnabled ?? true,
      latencyWarnMs: site.thresholds?.latencyWarnMs ?? 500,
      downCritical: site.thresholds?.downCritical ?? true
    });
  };

  const stopEdit = () => {
    setEditing(null);
  };

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="card table-card">
      <div className="panel-header">
        <h3>Manage Websites</h3>
        <span className="muted">Status, last seen, pause & thresholds</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Website</th>
            <th>Status</th>
            <th>Last seen</th>
            <th>Latency</th>
            <th>Health</th>
            <th>SLA 24h</th>
            <th>SLA 7d</th>
            <th>Pause</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((site) => {
            const live = liveByName.get(site.name);
            const status = live?.status || (site.paused ? "PAUSED" : "UNKNOWN");
            const latency = live?.latencyMs ? `${live.latencyMs.toFixed(0)} ms` : "-";
            const sla = slaByName[site.name] || {};
            return (
              <>
                <tr key={site.url}>
                  <td>
                    <div className="table-title">{site.name}</div>
                    <div className="mono">{site.url}</div>
                  </td>
                  <td>
                    <span className={`pill ${status === "UP" ? "up" : status === "PAUSED" ? "warn" : "down"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="mono">{lastSeen[site.name] || "-"}</td>
                  <td>{latency}</td>
                  <td>{sla.healthScore != null ? `${sla.healthScore.toFixed(0)}%` : "-"}</td>
                  <td>{sla.uptime24h != null ? `${sla.uptime24h.toFixed(2)}%` : "-"}</td>
                  <td>{sla.uptime7d != null ? `${sla.uptime7d.toFixed(2)}%` : "-"}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!site.paused}
                        onChange={() => onPauseToggle(site)}
                      />
                      <span className="slider" />
                    </label>
                  </td>
                  <td>
                    <button className="ghost" onClick={() => startEdit(site)}>
                      Thresholds
                    </button>
                    <button className="ghost" onClick={() => onRemove(site.url)}>
                      Remove
                    </button>
                  </td>
                </tr>
                {editing === site.url ? (
                  <tr className="table-edit" key={`${site.url}-edit`}>
                    <td colSpan={9}>
                      <div className="edit-panel">
                        <label className="inline">
                          <input
                            type="checkbox"
                            checked={!!form.alertsEnabled}
                            onChange={(e) => updateForm("alertsEnabled", e.target.checked)}
                          />
                          Enable alerts for this site
                        </label>
                        <label>
                          Latency warning (ms)
                          <input
                            type="number"
                            min={50}
                            step={50}
                            value={form.latencyWarnMs}
                            onChange={(e) => updateForm("latencyWarnMs", e.target.value)}
                          />
                        </label>
                        <label className="inline">
                          <input
                            type="checkbox"
                            checked={!!form.downCritical}
                            onChange={(e) => updateForm("downCritical", e.target.checked)}
                          />
                          DOWN is critical
                        </label>
                        <div className="inline-actions">
                          <button
                            className="primary"
                            onClick={() => {
                              onThresholdSave(site, form);
                              stopEdit();
                            }}
                          >
                            Save
                          </button>
                          <button className="ghost" onClick={stopEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
