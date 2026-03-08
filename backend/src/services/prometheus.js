import axios from "axios";

const baseUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";

const client = axios.create({
  baseURL: baseUrl,
  timeout: 10000
});

export async function query(promql) {
  try {
    const { data } = await client.get("/api/v1/query", {
      params: { query: promql }
    });
    return data;
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error("Prometheus query failed", promql, detail);
    throw err;
  }
}

export async function queryRange(promql, start, end, stepSeconds) {
  try {
    const { data } = await client.get("/api/v1/query_range", {
      params: { query: promql, start, end, step: stepSeconds }
    });
    return data;
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error("Prometheus range query failed", promql, detail);
    throw err;
  }
}
