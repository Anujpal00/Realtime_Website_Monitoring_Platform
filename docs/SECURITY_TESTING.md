# Security Testing Playbook

## 1) SQLi and XSS simulation
Run:

```bash
cd backend
node scripts/simulate-attacks.js
```

## 2) Brute-force simulation (>10 login attempts in 1 minute)
Run:

```bash
cd backend
node scripts/simulate-bruteforce.js
```

## 3) Traffic spike simulation (>200 requests in 30 seconds)
Run:

```bash
cd backend
node scripts/simulate-traffic-spike.js
```

## 4) Load test with autocannon
Install once:

```bash
npm i -g autocannon
```

Run test:

```bash
autocannon -c 200 -d 30 -p 10 http://localhost:4000/api/health
```

## 5) Verify from API
Use:

```bash
curl "http://localhost:4000/api/security/overview?rangeMs=3600000"
curl "http://localhost:4000/api/metrics/anomalies?scope=node&metric=cpuUsage&limit=100"
```

## 6) Postman
Import `docs/postman/security-monitoring.postman_collection.json`.
