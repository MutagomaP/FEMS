/**
 * Lightweight performance smoke test (not full load testing).
 * Run with gateway + services up: node scripts/perf-smoke.mjs
 */
const BASE = process.env.API_BASE ?? 'http://localhost:3000/api';
const REQUESTS = Number(process.env.PERF_REQUESTS ?? 50);
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY ?? 5);

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.PERF_EMAIL ?? 'admin@fems.local',
      password: process.env.PERF_PASSWORD ?? 'Admin@123',
    }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.accessToken;
}

async function timedFetch(url, token) {
  const start = performance.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ms = performance.now() - start;
  return { ok: res.ok, ms, status: res.status };
}

async function runBatch(url, token, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(await timedFetch(url, token));
  }
  return results;
}

function summarize(label, results) {
  const ok = results.filter((r) => r.ok).length;
  const times = results.map((r) => r.ms);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  console.log(
    `${label}: ${ok}/${results.length} ok | avg ${avg.toFixed(1)}ms | min ${min.toFixed(1)}ms | max ${max.toFixed(1)}ms`,
  );
  return { ok, total: results.length, avg, max, min };
}

async function main() {
  console.log(`FEMS perf smoke — ${REQUESTS} requests, concurrency ${CONCURRENCY}`);
  const healthStart = performance.now();
  const health = await fetch(`${BASE.replace(/\/api$/, '')}/api/health`);
  console.log(`Health: ${health.status} in ${(performance.now() - healthStart).toFixed(1)}ms`);
  if (!health.ok) {
    console.error('Gateway not healthy. Start services first.');
    process.exit(1);
  }

  const token = await login();
  const perWorker = Math.ceil(REQUESTS / CONCURRENCY);
  const urls = [
    `${BASE}/extinguishers?page=1&limit=10`,
    `${BASE}/reports/dashboard-summary?days=90`,
  ];

  for (const url of urls) {
    const workers = Array.from({ length: CONCURRENCY }, () => runBatch(url, token, perWorker));
    const batches = await Promise.all(workers);
    summarize(url.replace(BASE, ''), batches.flat());
  }

  console.log('Done. For full load testing, use k6 or Artillery against the same endpoints.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
