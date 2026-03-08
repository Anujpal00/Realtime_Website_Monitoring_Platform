import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function StatusCodeChart({ data, height = 220, onExpand }) {
  return (
    <div className="card chart">
      <div className="chart-header">
        <p className="label">HTTP Status Codes</p>
        {onExpand ? (
          <button className="ghost tiny" onClick={onExpand}>
            Fullscreen
          </button>
        ) : null}
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <XAxis dataKey="ts" hide />
            <YAxis stroke="#6b7280" />
            <Tooltip
              labelFormatter={(val) => new Date(val).toLocaleString()}
              formatter={(val) => (val === null ? "null" : val)}
            />
            <Bar dataKey="value" fill="#93c5fd" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
