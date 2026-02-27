// platform/server.js — Game Lab server with session recording
// Serves static files + API for session storage

import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync } from 'fs';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const ROOT = join(__dirname, '..');
const SESSIONS_DIR = join(ROOT, 'data', 'sessions');

// Ensure sessions directory exists
mkdirSync(SESSIONS_DIR, { recursive: true });

const PORT = process.env.PORT || 3000;
const BUILD_VERSION = process.env.BUILD_VERSION || readBuildVersion();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 10_000_000) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // --- API routes ---

  // GET /api/version
  if (req.method === 'GET' && pathname === '/api/version') {
    return json(res, { version: BUILD_VERSION });
  }

  // POST /api/session — store a game session
  if (req.method === 'POST' && pathname === '/api/session') {
    try {
      const body = await readBody(req);
      const id = randomUUID();
      const session = {
        id,
        gameId: body.gameId,
        seed: body.seed,
        config: body.config,
        score: body.score,
        status: body.status,
        ticks: body.ticks,
        inputs: body.inputs,
        timestamp: body.timestamp || Date.now(),
        buildVersion: BUILD_VERSION,
        userAgent: (req.headers['user-agent'] || '').slice(0, 200),
      };
      writeFileSync(join(SESSIONS_DIR, `${id}.json`), JSON.stringify(session));
      console.log(`Session ${id}: ${session.gameId} score=${session.score?.primary} ticks=${session.ticks}`);
      return json(res, { id });
    } catch (e) {
      console.error('Session save error:', e.message);
      return json(res, { error: e.message }, 500);
    }
  }

  // GET /api/sessions — list recent sessions
  if (req.method === 'GET' && pathname === '/api/sessions') {
    try {
      const gameFilter = url.searchParams.get('game');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
      const files = readdirSync(SESSIONS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 500);

      const sessions = [];
      for (const f of files) {
        try {
          const data = JSON.parse(readFileSync(join(SESSIONS_DIR, f), 'utf-8'));
          if (gameFilter && data.gameId !== gameFilter) continue;
          sessions.push({
            id: data.id,
            gameId: data.gameId,
            score: data.score,
            ticks: data.ticks,
            timestamp: data.timestamp,
            inputCount: data.inputs?.length || 0,
          });
          if (sessions.length >= limit) break;
        } catch {}
      }
      return json(res, sessions);
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // GET /api/session/:id — get full session with inputs for replay
  if (req.method === 'GET' && pathname.startsWith('/api/session/')) {
    const id = pathname.split('/')[3];
    const filePath = join(SESSIONS_DIR, `${id}.json`);
    if (!existsSync(filePath)) return json(res, { error: 'Not found' }, 404);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      return json(res, data);
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // --- Static file serving ---
  let filePath = normalize(join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // SPA fallback for game routes (/dodge, /rhythm, etc.)
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(ROOT, 'platform', 'index.html');
  }

  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

function readBuildVersion() {
  // 1. Env var (set by Docker build arg or manually)
  if (process.env.BUILD_VERSION && process.env.BUILD_VERSION !== 'dev') {
    return process.env.BUILD_VERSION;
  }
  // 2. Version file (written at commit time) — check multiple locations
  const candidates = [
    join(ROOT, 'VERSION'),
    join(__dirname, '..', 'VERSION'),
    '/app/VERSION',
    'VERSION',
  ];
  for (const path of candidates) {
    try {
      const v = readFileSync(path, 'utf-8').trim();
      if (v) return v;
    } catch {}
  }
  // 3. Git
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {}
  return 'dev';
}

server.listen(PORT, () => {
  console.log(`Game Lab v${BUILD_VERSION} on http://localhost:${PORT}`);
  console.log(`Sessions: ${SESSIONS_DIR}`);
});
