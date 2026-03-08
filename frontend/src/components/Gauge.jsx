import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

export function Gauge({ label, value, max = 100, unit = "%" }) {
  const safe = typeof value === "number" ? value : 0;
  const data = [{ name: label, value: Math.min(safe, max), fill: "#45c7b7" }];

  return (
    <div className="card gauge">
      <p className="label">{label}</p>
      <div className="gauge-wrap">
        <ResponsiveContainer width="100%" height={140}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar dataKey="value" background cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="gauge-value">
          <span>{typeof value === "number" ? value.toFixed(1) : "-"}</span>
          <small>{unit}</small>
        </div>
      </div>
    </div>
  );
}
