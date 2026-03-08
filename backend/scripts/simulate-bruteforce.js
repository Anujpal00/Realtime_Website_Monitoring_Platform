const API_BASE = process.env.API_BASE || "http://localhost:4000";
const ATTEMPTS = Number(process.env.ATTEMPTS || 15);
const DELAY_MS = Number(process.env.DELAY_MS || 150);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: `wrong-password-${i}`
      })
    });
    console.log(`Attempt ${i + 1}/${ATTEMPTS}: HTTP ${res.status}`);
    await sleep(DELAY_MS);
  }

  console.log("Done. Brute-force detector threshold is >10 login attempts in 60 seconds.");
}

run().catch((err) => {
  console.error("simulate-bruteforce failed", err);
  process.exit(1);
});
