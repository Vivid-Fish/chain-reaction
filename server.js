'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const PGURL = process.env.PGURL || process.env.DATABASE_URL;

if (!PGURL) {
    console.error('PGURL or DATABASE_URL env var required');
    process.exit(1);
}

const pool = new Pool({ connectionString: PGURL, max: 10 });

// MIME types for static serving
const MIME = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

// DB schema init
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id TEXT NOT NULL,
            player_name TEXT,
            peak_round INT NOT NULL,
            total_score BIGINT NOT NULL,
            is_bot BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            viewport_w INT, viewport_h INT, build_ver TEXT
        );
        CREATE TABLE IF NOT EXISTS replays (
            session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
            events JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS resume_checkpoints (
            device_id TEXT PRIMARY KEY,
            round INT NOT NULL,
            total_score BIGINT NOT NULL,
            consecutive_fails INT NOT NULL,
            mercy_bonus FLOAT NOT NULL,
            supernova_charge INT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS sessions_score_idx ON sessions(total_score DESC);
        CREATE INDEX IF NOT EXISTS sessions_round_idx ON sessions(peak_round DESC);
    `);
    console.log('DB schema initialized');
}

// Leaderboard cache (30s)
let leaderboardCache = null;
let leaderboardCacheTime = 0;
const CACHE_TTL = 30000;

// Read JSON body
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > 5_000_000) { reject(new Error('Body too large')); req.destroy(); return; }
            chunks.push(chunk);
        });
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
            catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}

function json(res, data, status = 200) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

function notFound(res) {
    res.writeHead(404);
    res.end('Not Found');
}

// Static file serving
function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => notFound(res));
    res.writeHead(200, { 'Content-Type': mime });
    stream.pipe(res);
}

// API handlers
async function handlePostSession(req, res) {
    const body = await readBody(req);
    const { device_id, player_name, peak_round, total_score, is_bot, viewport_w, viewport_h, build_ver, events } = body;
    if (!device_id || peak_round == null || total_score == null) {
        return json(res, { error: 'Missing required fields' }, 400);
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO sessions (device_id, player_name, peak_round, total_score, is_bot, viewport_w, viewport_h, build_ver)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [device_id, player_name || null, peak_round, total_score, !!is_bot, viewport_w || null, viewport_h || null, build_ver || null]
        );
        const sessionId = rows[0].id;
        if (events && events.length > 0) {
            await client.query(
                `INSERT INTO replays (session_id, events) VALUES ($1, $2)`,
                [sessionId, JSON.stringify(events)]
            );
        }
        await client.query('COMMIT');
        leaderboardCache = null; // invalidate
        json(res, { id: sessionId });
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

async function handleGetLeaderboard(req, res) {
    const now = Date.now();
    if (leaderboardCache && now - leaderboardCacheTime < CACHE_TTL) {
        return json(res, leaderboardCache);
    }
    const [byScore, byRound] = await Promise.all([
        pool.query(`SELECT id, player_name, peak_round, total_score, is_bot, device_id, created_at
                     FROM sessions ORDER BY total_score DESC LIMIT 10`),
        pool.query(`SELECT id, player_name, peak_round, total_score, is_bot, device_id, created_at
                     FROM sessions ORDER BY peak_round DESC, total_score DESC LIMIT 10`),
    ]);
    leaderboardCache = {
        byScore: byScore.rows,
        byRound: byRound.rows,
    };
    leaderboardCacheTime = now;
    json(res, leaderboardCache);
}

async function handleGetReplay(req, res, sessionId) {
    const { rows } = await pool.query(
        `SELECT r.events, s.player_name, s.peak_round, s.total_score, s.is_bot, s.viewport_w, s.viewport_h, s.build_ver, s.created_at
         FROM replays r JOIN sessions s ON s.id = r.session_id WHERE r.session_id = $1`,
        [sessionId]
    );
    if (rows.length === 0) return json(res, { error: 'Replay not found' }, 404);
    json(res, rows[0]);
}

async function handlePostCheckpoint(req, res) {
    const body = await readBody(req);
    const { device_id, round, total_score, consecutive_fails, mercy_bonus, supernova_charge } = body;
    if (!device_id || round == null) {
        return json(res, { error: 'Missing required fields' }, 400);
    }
    await pool.query(
        `INSERT INTO resume_checkpoints (device_id, round, total_score, consecutive_fails, mercy_bonus, supernova_charge, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (device_id) DO UPDATE SET
            round = $2, total_score = $3, consecutive_fails = $4, mercy_bonus = $5, supernova_charge = $6, updated_at = NOW()`,
        [device_id, round, total_score || 0, consecutive_fails || 0, mercy_bonus || 0, supernova_charge || 0]
    );
    json(res, { ok: true });
}

async function handleGetCheckpoint(res, deviceId) {
    const { rows } = await pool.query(
        `SELECT round, total_score, consecutive_fails, mercy_bonus, supernova_charge FROM resume_checkpoints WHERE device_id = $1`,
        [deviceId]
    );
    if (rows.length === 0) return json(res, null);
    json(res, rows[0]);
}

async function handleDeleteCheckpoint(res, deviceId) {
    await pool.query(`DELETE FROM resume_checkpoints WHERE device_id = $1`, [deviceId]);
    json(res, { ok: true });
}

// Router
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS for API
    if (pathname.startsWith('/api/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    }

    try {
        // API routes
        if (req.method === 'POST' && pathname === '/api/session') {
            return await handlePostSession(req, res);
        }
        if (req.method === 'GET' && pathname === '/api/leaderboard') {
            return await handleGetLeaderboard(req, res);
        }
        if (req.method === 'GET' && pathname.startsWith('/api/replay/')) {
            const id = pathname.split('/')[3];
            return await handleGetReplay(req, res, id);
        }
        if (req.method === 'POST' && pathname === '/api/checkpoint') {
            return await handlePostCheckpoint(req, res);
        }
        if (req.method === 'GET' && pathname.startsWith('/api/checkpoint/')) {
            const did = decodeURIComponent(pathname.split('/')[3]);
            return await handleGetCheckpoint(res, did);
        }
        if (req.method === 'DELETE' && pathname.startsWith('/api/checkpoint/')) {
            const did = decodeURIComponent(pathname.split('/')[3]);
            return await handleDeleteCheckpoint(res, did);
        }

        // Replay page route: /replay/:id → serve replay.html
        if (pathname.startsWith('/replay/')) {
            return serveStatic(res, path.join(__dirname, 'replay.html'));
        }

        // Static files
        let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
        filePath = path.normalize(filePath);
        if (!filePath.startsWith(__dirname)) return notFound(res);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return serveStatic(res, filePath);
        }
        notFound(res);
    } catch (e) {
        console.error('Request error:', e);
        if (!res.headersSent) json(res, { error: 'Internal error' }, 500);
    }
});

initDB()
    .then(() => {
        server.listen(PORT, () => console.log(`Chain Reaction server on :${PORT}`));
    })
    .catch(e => {
        console.error('DB init failed:', e);
        process.exit(1);
    });
