import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

function formatTime(value) {
  const date = new Date(value);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export function TimeSeriesChart({
  title,
  data,
  unit,
  color = "#7c9cf5",
  threshold,
  height = 220,
  onExpand
}) {
  return (
    <div className="card chart">
      <div className="chart-header">
        <p className="label">{title}</p>
        <div className="chart-actions">
          {unit ? <span className="unit">{unit}</span> : null}
          {onExpand ? (
            <button className="ghost tiny" onClick={onExpand}>
              Fullscreen
            </button>
          ) : null}
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <XAxis dataKey="ts" tickFormatter={formatTime} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              labelFormatter={(val) => new Date(val).toLocaleString()}
              formatter={(val) => (val === null ? "null" : val)}
            />
            {typeof threshold === "number" ? (
              <ReferenceLine y={threshold} stroke="#f59e0b" strokeDasharray="4 4" />
            ) : null}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
