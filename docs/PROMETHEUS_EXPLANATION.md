# Prometheus & Exporters Explanation

## Why Prometheus

Prometheus provides:
- Pull-based metrics scraping
- Efficient time-series storage
- PromQL for powerful queries
- High reliability and open ecosystem

It is the industry standard for infrastructure and service monitoring.

## Prometheus vs Grafana

- **Prometheus** collects, stores, and queries metrics.
- **Grafana** visualizes data from Prometheus (and others).

In this project:
- Prometheus handles metrics storage and querying.
- Our **custom MERN frontend** replaces Grafana UI.
- Our **custom backend** replaces Grafana alerting.

## Node Exporter vs Blackbox Exporter

- **Node Exporter** collects server system metrics (CPU, memory, disk, network, uptime).
- **Blackbox Exporter** probes external endpoints (HTTP, HTTPS) to measure uptime, latency, and status codes.

Both exporters expose metrics to Prometheus using the same pull model.

## What Makes This System "Grafana?Prometheus Inspired"

- Prometheus remains the source of truth for live metrics.
- The backend implements custom alert logic and storage.
- The frontend provides Grafana-like dashboards without using Grafana itself.
