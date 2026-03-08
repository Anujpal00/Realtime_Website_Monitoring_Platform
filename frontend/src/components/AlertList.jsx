export function AlertList({ alerts }) {
  return (
    <div className="card alerts">
      <p className="label">Alerts</p>
      <div className="alert-list">
        {alerts?.length ? (
          alerts.map((alert, idx) => (
            <div key={`${alert.ts}-${idx}`} className={`alert ${alert.severity}`}>
              <div>
                <strong>{alert.severity.toUpperCase()}</strong> {alert.message}
              </div>
              <span className="mono">{new Date(alert.ts).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p className="muted">No alerts right now.</p>
        )}
      </div>
    </div>
  );
}
