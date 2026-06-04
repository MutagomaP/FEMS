/**
 * Waits for microservice ports 3001–3004, 3006–3008, then starts the API gateway.
 * Used by npm run dev:services so Swagger and /api/settings proxy work on first load.
 */
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const MICRO_PORTS = [3001, 3002, 3003, 3004, 3006, 3007, 3008];
const LABELS = {
  3001: 'auth',
  3002: 'customer',
  3003: 'extinguisher',
  3004: 'notification',
  3006: 'compliance',
  3007: 'report',
  3008: 'inspection',
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = Number(process.env.FEMS_GATEWAY_WAIT_MS ?? 180_000);
const POLL_MS = 2000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForMicroservices() {
  const start = Date.now();
  console.log('[gateway-wait] Waiting for microservices on ports 3001–3004, 3006–3008...');

  while (Date.now() - start < TIMEOUT_MS) {
    const checks = await Promise.all(
      MICRO_PORTS.map(async (port) => ({ port, up: await isPortOpen(port) })),
    );
    const up = checks.filter((c) => c.up).map((c) => c.port);
    const down = checks.filter((c) => !c.up).map((c) => LABELS[c.port] ?? c.port);

    if (down.length === 0) {
      console.log('[gateway-wait] All microservices are up. Starting API gateway...');
      return true;
    }

    console.log(
      `[gateway-wait] Ready ${up.length}/${MICRO_PORTS.length} — still waiting for: ${down.join(', ')}`,
    );
    await sleep(POLL_MS);
  }

  console.warn(
    '[gateway-wait] Timeout — starting gateway anyway. Fix missing services, then restart dev:services.',
  );
  return false;
}

function startGateway() {
  const child = spawn('npm', ['run', 'dev:gateway'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

await waitForMicroservices();
startGateway();
