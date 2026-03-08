import { useEffect, useState } from "react";
import { getThresholds, updateThresholds } from "./api.js";

export function ThresholdPanel({ onUpdated }) {
  const [form, setForm] = useState({
    alertsEnabled: true,
    latencyWarnMs: 500,
    downCritical: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getThresholds();
        setForm(data);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        alertsEnabled: !!form.alertsEnabled,
        latencyWarnMs: Number(form.latencyWarnMs),
        downCritical: !!form.downCritical
      };
      const data = await updateThresholds(payload);
      setForm(data);
      onUpdated?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card panel" onSubmit={submit}>
      <div className="panel-header">
        <h3>Alert Thresholds</h3>
        <span className="muted">Controls warning rules</span>
      </div>
      <label className="inline">
        <input
          type="checkbox"
          checked={!!form.alertsEnabled}
          onChange={(e) => update("alertsEnabled", e.target.checked)}
        />
        Enable alerts
      </label>
      <label>
        Response time warning (ms)
        <input
          type="number"
          min={50}
          step={50}
          value={form.latencyWarnMs}
          onChange={(e) => update("latencyWarnMs", e.target.value)}
        />
      </label>
      <label className="inline">
        <input
          type="checkbox"
          checked={!!form.downCritical}
          onChange={(e) => update("downCritical", e.target.checked)}
        />
        Website DOWN is critical
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary" disabled={saving}>
        {saving ? "Saving..." : "Save thresholds"}
      </button>
    </form>
  );
}
