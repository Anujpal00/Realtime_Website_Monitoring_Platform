import { useState } from "react";
import { addWebsite } from "./api.js";

export function WebsiteForm({ onAdded }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [probeUrl, setProbeUrl] = useState("");
  const [type, setType] = useState("uptime+latency");
  const [timeoutSeconds, setTimeoutSeconds] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        url: url.trim(),
        type,
        timeoutSeconds: Number(timeoutSeconds)
      };
      await addWebsite(payload);
      setName("");
      setUrl("");
      setType("uptime+latency");
      setTimeoutSeconds(5);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card panel" onSubmit={submit}>
      <div className="panel-header">
        <h3>Register Website</h3>
        <span className="muted">Add new URL to monitor</span>
      </div>
      <label>
        Friendly name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Example API" required />
      </label>
      <label>
        Website URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com or http://192.168.1.100:3000" required />
        <small className="muted">For private websites, use your host IP instead of localhost (e.g., http://192.168.1.100:3000)</small>
      </label>
      <label>
        Probe URL (optional)
        <input value={probeUrl} onChange={(e) => setProbeUrl(e.target.value)} placeholder="Leave empty to auto-compute" />
        <small className="muted">Override the URL used for probing (useful for private sites)</small>
      </label>
      <label>
        Monitoring type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="uptime">Uptime only</option>
          <option value="uptime+latency">Uptime + response time</option>
        </select>
      </label>
      <label>
        Request timeout (seconds)
        <select value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(e.target.value)}>
          <option value={3}>3s</option>
          <option value={5}>5s</option>
          <option value={10}>10s</option>
        </select>
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="primary" disabled={saving}>
        {saving ? "Saving..." : "Save Website"}
      </button>
    </form>
  );
}
