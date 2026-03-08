import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#7c9cf5", "#f97316"];

export function AttackChart({ data }) {
  const rows = (data || []).map((item) => ({
    name: item.attackType,
    value: item.count
  }));

  return (
    <div className="card chart">
      <div className="chart-header">
        <p className="label">Attack Type Distribution</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" outerRadius={90} label>
            {rows.map((row, index) => (
              <Cell key={row.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
