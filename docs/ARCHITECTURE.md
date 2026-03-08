# Architecture

## High-Level Diagram

```
Monitored Targets
?
??? Owned Server
?     ??? Node Exporter ? Prometheus
?
??? Public Website / API
?     ??? Blackbox Exporter ? Prometheus
?
Prometheus
?
??? Express Backend
      ??? Queries Prometheus using PromQL
      ??? Processes metrics
      ??? Applies alert thresholds
      ??? Stores historical data in MongoDB
      ??? Sends real-time updates via WebSockets
?
React Frontend
?
??? Grafana-like Dashboards (custom UI)
```

## Why This Architecture

- Prometheus is optimized for time-series metrics collection and querying.
- The backend owns logic, alerts, and persistence (MongoDB), which makes the system custom and extensible.
- WebSocket delivery avoids polling and provides true real-time dashboards.

## Backend Responsibilities

- Pull current metrics from Prometheus (PromQL)
- Store time-series samples in MongoDB
- Compute alerts (threshold logic)
- Push live updates via WebSocket

## Frontend Responsibilities

- Real-time dashboards
- Historical charts (from MongoDB)
- Status indicators + alerts

## Data Contracts

- WebSocket: `metrics:update` payload contains `nodes`, `websites`, `alerts`
- REST endpoints:
  - `GET /api/metrics/current`
  - `GET /api/metrics/range?scope=...&target=...&metric=...`
  - `GET /api/metrics/alerts`
  - `GET /api/metrics/targets`
