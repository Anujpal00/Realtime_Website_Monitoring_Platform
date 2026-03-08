export function StatusPill({ status }) {
  const normalized = status || "UNKNOWN";
  const cls = normalized === "UP" ? "pill up" : normalized === "DOWN" ? "pill down" : "pill warn";
  return <span className={cls}>{normalized}</span>;
}
