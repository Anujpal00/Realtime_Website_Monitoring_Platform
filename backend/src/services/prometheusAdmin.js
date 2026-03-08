import axios from "axios";

const promUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";

export async function reloadPrometheus() {
  await axios.post(`${promUrl}/-/reload`);
}
