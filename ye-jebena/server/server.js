'use strict';
/*
 * Ye’ Jebena — web server + review API (no npm packages needed, Node 22.5+)
 *
 *   npm start            → http://localhost:3000
 *   Admin moderation     → http://localhost:3000/admin   (user: admin, password: ADMIN_PASSWORD)
 *
 * Environment variables:
 *   ADMIN_PASSWORD   REQUIRED for /admin (min 8 chars). Without it the admin page is disabled.
 *   PORT             default 3000
 *   AUTO_APPROVE     "true" to publish reviews immediately (default: reviews wait for approval)
 *   TRUST_PROXY      "true" when behind a reverse proxy (uses X-Forwarded-For for rate limiting)
 *   DB_PATH          default ./data/reviews.db
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = +process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const AUTO_APPROVE = process.env.AUTO_APPROVE === 'true';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'reviews.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

/* ---------- database ---------- */
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','hidden')),
    ip_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, created_at);
`);
const q = {
  insert: db.prepare('INSERT INTO reviews(name,rating,text,status,ip_hash) VALUES(?,?,?,?,?)'),
  listApproved: db.prepare("SELECT id,name,rating,text,created_at AS date FROM reviews WHERE status='approved' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"),
  stats: db.prepare("SELECT COUNT(*) AS total, COALESCE(AVG(rating),0) AS average FROM reviews WHERE status='approved'"),
  all: db.prepare('SELECT id,name,rating,text,status,created_at FROM reviews ORDER BY CASE status WHEN \'pending\' THEN 0 ELSE 1 END, created_at DESC LIMIT 500'),
  setStatus: db.prepare('UPDATE reviews SET status=? WHERE id=?'),
  del: db.prepare('DELETE FROM reviews WHERE id=?'),
  recentByIp: db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE ip_hash=? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day')"),
  duplicate: db.prepare("SELECT 1 FROM reviews WHERE ip_hash=? AND name=? AND text=? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 day') LIMIT 1")
};

/* ---------- security helpers ---------- */
const SECRET = crypto.randomBytes(32); // form tokens are valid until the server restarts
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('hex').slice(0, 32);
const makeToken = () => { const ts = Date.now().toString(36); return `${ts}.${sign(ts)}`; };
function tokenAge(tok) {
  if (typeof tok !== 'string') return null;
  const [ts, sig] = tok.split('.');
  if (!ts || !sig) return null;
  const good = sign(ts);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  return Date.now() - parseInt(ts, 36);
}
const clientIp = req => (TRUST_PROXY && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';
const hashIp = ip => crypto.createHash('sha256').update('yj:' + ip).digest('hex').slice(0, 24);

// simple sliding-window rate limiter (in memory)
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr); return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();

const clean = (s, max) => String(s ?? '').normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F​-‏‪-‮]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|biz|xyz|ru|cn|top|click|site|online)\b)/i;

/* ---------- http helpers ---------- */
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.google.com; connect-src 'self'; base-uri 'self'; form-action 'self'"
};
function send(res, status, body, headers = {}) {
  const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { ...SEC_HEADERS, 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
function readJson(req, limit = 8 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Request too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { reject(Object.assign(new Error('Invalid request'), { code: 400 })); } });
    req.on('error', reject);
  });
}

/* ---------- admin auth ---------- */
function isAdmin(req) {
  if (ADMIN_PASSWORD.length < 8) return false;
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const [user, ...rest] = Buffer.from(h.slice(6), 'base64').toString().split(':');
  const pass = rest.join(':');
  const a = crypto.createHash('sha256').update(pass).digest(), b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return user === 'admin' && crypto.timingSafeEqual(a, b);
}
function requireAdmin(req, res) {
  if (ADMIN_PASSWORD.length < 8) { send(res, 503, 'Admin is disabled. Set an ADMIN_PASSWORD (8+ characters) and restart the server.'); return false; }
  if (limited('adm:' + clientIp(req), 60, 60e3)) { send(res, 429, 'Too many requests'); return false; }
  if (!isAdmin(req)) { send(res, 401, 'Authentication required', { 'WWW-Authenticate': 'Basic realm="Ye Jebena admin", charset="UTF-8"' }); return false; }
  return true;
}

/* ---------- routes ---------- */
async function handleApi(req, res, url) {
  const ip = clientIp(req);

  if (url.pathname === '/api/reviews' && req.method === 'GET') {
    const limit = Math.min(Math.max(+url.searchParams.get('limit') || 6, 1), 30);
    const offset = Math.max(+url.searchParams.get('offset') || 0, 0);
    const s = q.stats.get();
    return send(res, 200, { reviews: q.listApproved.all(limit, offset), total: s.total, average: Math.round(s.average * 10) / 10, token: makeToken() }, { 'Cache-Control': 'no-store' });
  }

  if (url.pathname === '/api/reviews' && req.method === 'POST') {
    if (limited('post:' + ip, 5, 10 * 60e3)) return send(res, 429, { error: 'Too many submissions. Please try again in a little while.' });
    let b; try { b = await readJson(req); } catch (e) { return send(res, e.code || 400, { error: e.message }); }
    if (typeof b !== 'object' || b === null) return send(res, 400, { error: 'Invalid request' });

    // spam traps: honeypot filled, or form submitted impossibly fast / with a forged token
    const age = tokenAge(b.token);
    if (b.website) return send(res, 201, { ok: true });           // pretend success to bots
    if (age === null || age < 2500 || age > 6 * 3600e3) return send(res, 400, { error: 'Please wait a moment and try again.' });

    const rating = Number(b.rating);
    const name = clean(b.name, 60);
    const text = clean(b.text, 800);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return send(res, 400, { error: 'Please choose a rating from 1 to 5 stars.' });
    if (name.length < 2) return send(res, 400, { error: 'Please enter your name.' });
    if (LINK_RE.test(name) || LINK_RE.test(text)) return send(res, 400, { error: 'Please remove links from your message.' });
    if (/(.)\1{9,}/.test(text)) return send(res, 400, { error: 'Your feedback looks like it contains repeated characters. Please rewrite it.' });

    const ipHash = hashIp(ip);
    if (q.recentByIp.get(ipHash).n >= 3) return send(res, 429, { error: 'You have already sent several reviews today. Thank you!' });
    if (q.duplicate.get(ipHash, name, text)) return send(res, 409, { error: 'This review was already received. Thank you!' });

    // Stars never affect visibility: every review follows the same path.
    q.insert.run(name, rating, text, AUTO_APPROVE ? 'approved' : 'pending', ipHash);
    return send(res, 201, { ok: true });
  }

  /* admin API */
  if (url.pathname.startsWith('/api/admin/')) {
    if (!requireAdmin(req, res)) return;
    if (url.pathname === '/api/admin/reviews' && req.method === 'GET') return send(res, 200, { reviews: q.all.all() }, { 'Cache-Control': 'no-store' });
    const m = url.pathname.match(/^\/api\/admin\/reviews\/(\d+)\/(approve|hide|delete)$/);
    if (m && req.method === 'POST') {
      const id = +m[1];
      if (m[2] === 'delete') q.del.run(id); else q.setStatus.run(m[2] === 'approve' ? 'approved' : 'hidden', id);
      return send(res, 200, { ok: true });
    }
  }
  return send(res, 404, { error: 'Not found' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let rel; try { rel = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, '<h1>404</h1><p><a href="/">Back to Ye’ Jebena</a></p>');
    const ext = path.extname(file).toLowerCase();
    const cache = /\.(png|jpe?g|webp|svg|ico)$/.test(ext) ? 'public, max-age=604800' : 'no-cache';
    res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      if (!requireAdmin(req, res)) return;
      return send(res, 200, fs.readFileSync(path.join(__dirname, 'admin.html')), { 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'" });
    }
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    console.error(e); if (!res.headersSent) send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => {
  console.log(`Ye’ Jebena running at http://localhost:${PORT}`);
  console.log(ADMIN_PASSWORD.length >= 8 ? `Admin: http://localhost:${PORT}/admin  (user "admin")` : 'Admin disabled — set ADMIN_PASSWORD (8+ chars) to enable moderation.');
  console.log(AUTO_APPROVE ? 'Reviews are published immediately (AUTO_APPROVE=true).' : 'New reviews wait for approval in /admin.');
});
