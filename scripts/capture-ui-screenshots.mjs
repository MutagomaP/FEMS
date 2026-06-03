/**
 * Capture UI screenshots for docs/UI_MOCKUPS.md.
 * Requires frontend dev server at http://localhost:5173 and a local Chrome/Edge install.
 *
 * Usage:
 *   cd frontend && npm run dev
 *   node scripts/capture-ui-screenshots.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const outDir = path.join(process.cwd(), 'docs', 'screenshots');

const BROWSER_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowser() {
  for (const p of BROWSER_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const pages = [
  { path: '/login', file: 'login.png' },
  { path: '/register', file: 'register.png' },
  { path: '/forgot-password', file: 'forgot-password.png' },
  { path: '/reset-password?email=demo@example.com', file: 'reset-password.png' },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const executablePath = findBrowser();
  if (!executablePath) {
    console.error('No Chrome or Edge found. Install a Chromium browser or set CHROME_PATH.');
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = await import('puppeteer-core');
  } catch {
    console.log('Installing puppeteer-core (one-time)...');
    execSync('npm install --no-save puppeteer-core', { stdio: 'inherit', cwd: process.cwd() });
    puppeteer = await import('puppeteer-core');
  }

  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const { path: route, file } of pages) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(500);
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    console.log(`✓ ${file}`);
  }

  // Authenticate via API and inject tokens (avoids login confirm dialog)
  const loginRes = await fetch(`${BASE.replace('5173', '3000')}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fems.local', password: 'Admin@123' }),
  });
  const loginJson = await loginRes.json();
  const loginData = loginJson.data ?? loginJson;
  if (!loginData.accessToken) {
    throw new Error('Failed to obtain admin token for authenticated screenshots');
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem('fems_access_token', access);
      localStorage.setItem('fems_refresh_token', refresh);
    },
    { access: loginData.accessToken, refresh: loginData.refreshToken },
  );
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' });
  await delay(1500);

  const authPages = [
    { path: '/dashboard', file: 'dashboard.png' },
    { path: '/extinguishers', file: 'extinguishers.png' },
    { path: '/inspections', file: 'inspections.png' },
    { path: '/reports', file: 'reports.png' },
  ];

  for (const { path: route, file } of authPages) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(800);
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    console.log(`✓ ${file}`);
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
