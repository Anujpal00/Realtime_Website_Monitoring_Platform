import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function formatTime(value) {
  const date = new Date(value);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
}

function joinSeries(data, anomalies) {
  const anomalyTs = new Set((anomalies || []).map((row) => new Date(row.ts).toISOString()));
  return (data || []).map((row) => {
    const ts = new Date(row.ts).toISOString();
    return {
      ...row,
      anomalyValue: anomalyTs.has(ts) ? row.value : null
    };
  });
}

export function AnomalyGraph({ title, data, anomalies, unit, color = "#22c55e" }) {
  const joined = joinSeries(data, anomalies);

  return (
    <div className="card chart">
      <div className="chart-header">
        <p className="label">{title}</p>
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={joined}>
          <XAxis dataKey="ts" tickFormatter={formatTime} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            labelFormatter={(val) => new Date(val).toLocaleString()}
            formatter={(val, name) => {
              if (name === "anomalyValue") return [`${val}`, "Anomaly"];
              return [`${val}`, "Value"];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Scatter dataKey="anomalyValue" fill="#ef4444" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
