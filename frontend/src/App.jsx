import { useState } from "react";
import InfraDashboard from "./pages/InfraDashboard.jsx";
import WebDashboard from "./pages/WebDashboard.jsx";
import { useLiveMetrics } from "./components/useLiveMetrics.js";
import SecurityDashboard from "./components/SecurityDashboard.jsx";

const tabs = [
  { id: "web", label: "Website & API" },
  { id: "infra", label: "Infrastructure" },
  { id: "security", label: "Security Monitoring" }
];

export default function App() {
  const [active, setActive] = useState("web");
  const { snapshot, connected, securityEvents, anomalyEvents } = useLiveMetrics();

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Real-Time Website Monitoring Platform</p>
          <h1>RealMonitor</h1>
        </div>
        <div className="topbar-meta">
          <span className={connected ? "pill up" : "pill warn"}>
            {connected ? "Live" : "Reconnecting"}
          </span>
          <span className="mono">Last update: {snapshot?.ts || "-"}</span>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={active === tab.id ? "tab active" : "tab"}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        {active === "web" ? (
          <WebDashboard snapshot={snapshot} />
        ) : active === "infra" ? (
          <InfraDashboard snapshot={snapshot} />
        ) : (
          <SecurityDashboard
            snapshot={snapshot}
            securityEvents={securityEvents}
            anomalyEvents={anomalyEvents}
          />
        )}
      </main>
    </div>
  );
}
