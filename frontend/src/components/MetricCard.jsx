export function MetricCard({ label, value, unit }) {
  const display = value === null ? "NULL" : value ?? "N/A";
  return (
    <div className="card metric">
      <p className="label">{label}</p>
      <p className="value">
        {display}
        {unit ? <span className="unit">{unit}</span> : null}
      </p>
    </div>
  );
}
