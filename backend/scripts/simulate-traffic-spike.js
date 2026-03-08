const API_BASE = process.env.API_BASE || "http://localhost:4000";
const REQUESTS = Number(process.env.REQUESTS || 240);
const CONCURRENCY = Number(process.env.CONCURRENCY || 40);

async function worker(id, chunk) {
  for (let i = 0; i < chunk; i += 1) {
    await fetch(`${API_BASE}/api/health`).catch(() => null);
  }
  console.log(`Worker ${id} done`);
}

async function run() {
  const perWorker = Math.ceil(REQUESTS / CONCURRENCY);
  const tasks = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    tasks.push(worker(i + 1, perWorker));
  }
  await Promise.all(tasks);
  console.log(
    "Done. Traffic-spike detector threshold is >200 requests from same IP in 30 seconds."
  );
}

run().catch((err) => {
  console.error("simulate-traffic-spike failed", err);
  process.exit(1);
});
