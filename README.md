# Real-Time Web & Infrastructure Monitoring Platform (Grafana?Prometheus Inspired)

This project is a full-stack, production-style monitoring platform built on the MERN stack with a custom backend, real-time dashboards, and a DevOps pipeline. It integrates Prometheus, Node Exporter, and Blackbox Exporter to collect **real** metrics (no mocks).

## Quick Start (Local)

Prereqs: Docker + Docker Compose

```powershell
cd c:\Projects\realmonitor
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Prometheus: http://localhost:9090

## Targets Configuration

Edit `backend/src/config/targets.json` to add:
- Owned servers (Node Exporter instances)
- Public websites or APIs (Blackbox Exporter targets)
- Private websites (use host IP instead of localhost, e.g., http://192.168.1.100:3000, or ensure the app binds to 0.0.0.0)

For private websites running on localhost, ensure the application binds to 0.0.0.0 (e.g., for Vite: `npm run dev -- --host 0.0.0.0`, for Node.js: `server.listen(5173, '0.0.0.0')`).

Also update `infra/prometheus/prometheus.yml` to keep Prometheus scraping the same targets.

## Optional ML (Explainable)

A lightweight linear regression predicts CPU/memory trend slopes and estimated time to threshold. Results appear on the Infrastructure dashboard.

## Docs

- Architecture: `docs/ARCHITECTURE.md`
- Prometheus explanations: `docs/PROMETHEUS_EXPLANATION.md`
- Deployment guide: `docs/DEPLOYMENT.md`
- Viva Q&A: `docs/VIVA_QA.md`

## Data Flow

Node Exporter + Blackbox Exporter -> Prometheus -> Express Backend -> MongoDB + WebSocket -> React Dashboards

## Notes

- Alerts are evaluated in the backend (custom logic).
- WebSocket updates are live; REST endpoints provide history.
- For production, run Node Exporter on the owned host (system metrics).
