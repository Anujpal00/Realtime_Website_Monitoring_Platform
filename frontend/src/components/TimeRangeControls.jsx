const ranges = [
  { label: "Last 2s", value: 2000 },
  { label: "Last 30s", value: 30000 },
  { label: "Last 1m", value: 60000 },
  { label: "Last 5m", value: 300000 },
  { label: "Last 1h", value: 3600000 },
  { label: "Last 1d", value: 86400000 }
];

const refreshes = [
  { label: "Every 2s", value: 2000 },
  { label: "Every 5s", value: 5000 },
  { label: "Every 30s", value: 30000 },
  { label: "Manual", value: 0 }
];

export function TimeRangeControls({ rangeMs, refreshMs, onRangeChange, onRefreshChange, onManualRefresh }) {
  return (
    <div className="controls">
      <div className="control">
        <label>Time range</label>
        <select value={rangeMs} onChange={(e) => onRangeChange(Number(e.target.value))}>
          {ranges.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="control">
        <label>Auto refresh</label>
        <select value={refreshMs} onChange={(e) => onRefreshChange(Number(e.target.value))}>
          {refreshes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button className="ghost" onClick={onManualRefresh}>
        Refresh now
      </button>
    </div>
  );
}
