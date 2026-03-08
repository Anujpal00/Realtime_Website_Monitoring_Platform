const API_BASE = process.env.API_BASE || "http://18.212.214.90:4000/";

async function send(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  return { status: res.status, path };
}

async function run() {
  const tests = [
    {
      name: "SQL Injection payload",
      path: "/api/test/search",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "' OR 1=1 --",
          notes: "UNION SELECT password FROM users"
        })
      }
    },
    {
      name: "XSS payload",
      path: "/api/test/comment",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "<script>alert('xss')</script>",
          fallback: "<img src=x onerror=alert(1)>"
        })
      }
    }
  ];

  for (const test of tests) {
    const result = await send(test.path, test.options);
    console.log(`${test.name}: ${result.status} (${result.path})`);
  }

  console.log("Done. Check /api/security/overview for generated alerts.");
}

run().catch((err) => {
  console.error("simulate-attacks failed", err);
  process.exit(1);
});
