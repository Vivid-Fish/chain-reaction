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
    // Continuous mode columns (safe to re-run — IF NOT EXISTS handled by ALTER)
    const contCols = [
        ['game_mode', "TEXT NOT NULL DEFAULT 'rounds'"],
        ['continuous_tier', 'TEXT'],
        ['duration_ms', 'BIGINT'],
        ['final_density', 'FLOAT'],
        ['mean_density', 'FLOAT'],
        ['total_taps', 'INT'],
    ];
    for (const [col, def] of contCols) {
        await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ${col} ${def}`).catch(() => {});
    }
    await pool.query(`CREATE INDEX IF NOT EXISTS sessions_mode_score_idx ON sessions(game_mode, total_score DESC)`).catch(() => {});
    console.log('DB schema initialized');
}

// Leaderboard cache (30s, keyed by mode_tier)
const leaderboardCaches = {};
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
    const { device_id, player_name, peak_round, total_score, is_bot, viewport_w, viewport_h, build_ver, events,
            game_mode, continuous_tier, duration_ms, final_density, mean_density, total_taps } = body;
    if (!device_id || total_score == null) {
        return json(res, { error: 'Missing required fields' }, 400);
    }
    const mode = game_mode || 'rounds';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO sessions (device_id, player_name, peak_round, total_score, is_bot, viewport_w, viewport_h, build_ver,
                                   game_mode, continuous_tier, duration_ms, final_density, mean_density, total_taps)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [device_id, player_name || null, peak_round || 0, total_score, !!is_bot, viewport_w || null, viewport_h || null, build_ver || null,
             mode, continuous_tier || null, duration_ms || null, final_density || null, mean_density || null, total_taps || null]
        );
        const sessionId = rows[0].id;
        if (events && events.length > 0) {
            await client.query(
                `INSERT INTO replays (session_id, events) VALUES ($1, $2)`,
                [sessionId, JSON.stringify(events)]
            );
        }
        await client.query('COMMIT');
        Object.keys(leaderboardCaches).forEach(k => delete leaderboardCaches[k]); // invalidate
        json(res, { id: sessionId });
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

async function handleGetLeaderboard(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mode = url.searchParams.get('mode') || 'rounds';
    const tier = url.searchParams.get('tier') || null;

    const cacheKey = `${mode}_${tier || 'all'}`;
    const now = Date.now();
    const cached = leaderboardCaches[cacheKey];
    if (cached && now - cached.time < CACHE_TTL) {
        return json(res, cached.data);
    }

    let result;
    if (mode === 'continuous') {
        const whereParts = [`game_mode = 'continuous'`];
        const params = [];
        if (tier) {
            params.push(tier);
            whereParts.push(`continuous_tier = $${params.length}`);
        }
        const where = whereParts.join(' AND ');
        const { rows } = await pool.query(
            `SELECT id, player_name, total_score, is_bot, device_id, created_at,
                    continuous_tier, duration_ms, mean_density, total_taps
             FROM sessions WHERE ${where} ORDER BY total_score DESC LIMIT 10`, params
        );
        result = { mode: 'continuous', tier, byScore: rows };
    } else {
        const [byScore, byRound] = await Promise.all([
            pool.query(`SELECT id, player_name, peak_round, total_score, is_bot, device_id, created_at
                         FROM sessions WHERE game_mode = 'rounds' ORDER BY total_score DESC LIMIT 10`),
            pool.query(`SELECT id, player_name, peak_round, total_score, is_bot, device_id, created_at
                         FROM sessions WHERE game_mode = 'rounds' ORDER BY peak_round DESC, total_score DESC LIMIT 10`),
        ]);
        result = { mode: 'rounds', byScore: byScore.rows, byRound: byRound.rows };
    }

    leaderboardCaches[cacheKey] = { data: result, time: now };
    json(res, result);
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

async function handleDeleteSession(res, sessionId) {
    const { rowCount } = await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
    if (rowCount === 0) return json(res, { error: 'Session not found' }, 404);
    Object.keys(leaderboardCaches).forEach(k => delete leaderboardCaches[k]); // invalidate
    json(res, { ok: true });
}

// Client error log (last 50, in-memory)
const clientErrors = [];

async function handlePostError(req, res) {
    const body = await readBody(req);
    const entry = {
        time: new Date().toISOString(),
        message: String(body.message || '').slice(0, 500),
        stack: String(body.stack || '').slice(0, 2000),
        state: body.state || {},
        ua: (req.headers['user-agent'] || '').slice(0, 200),
    };
    clientErrors.push(entry);
    if (clientErrors.length > 50) clientErrors.shift();
    console.error('CLIENT ERROR:', entry.message, entry.state);
    json(res, { ok: true });
}

function handleGetErrors(req, res) {
    json(res, clientErrors);
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
        if (req.method === 'POST' && pathname === '/api/error') {
            return await handlePostError(req, res);
        }
        if (req.method === 'GET' && pathname === '/api/errors') {
            return handleGetErrors(req, res);
        }
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
        if (req.method === 'DELETE' && pathname.startsWith('/api/session/')) {
            const id = pathname.split('/')[3];
            return await handleDeleteSession(res, id);
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
