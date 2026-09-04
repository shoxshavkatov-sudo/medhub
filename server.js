/* MedHub — server: static SPA + group API (feeds, diary sharing, duty swaps, backup sync) */
const fs = require('fs');
try {
  for (const line of fs.readFileSync(__dirname + '/.env', 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ---------- storage ---------- */
const DB = path.join(__dirname, 'data.json');
let db = { groups: {}, entries: [], sync: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB, 'utf8'))); } catch {}
const persist = () => fs.writeFile(DB, JSON.stringify(db), () => {});

const code4 = () => crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
const nowId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

const group = code => db.groups[code];

function publicGroup(g) {
  return {
    code: g.code, name: g.name, createdAt: g.createdAt,
    members: g.members.map(m => ({ id: m.id, name: m.name, role: m.role }))
  };
}

/* ---------- groups ---------- */
app.post('/api/groups', (req, res) => {
  const { name, adminName } = req.body || {};
  if (!name || !adminName) return res.status(400).json({ error: 'name and adminName required' });
  let code;
  do { code = code4(); } while (db.groups[code]);
  const admin = { id: nowId(), name: String(adminName).slice(0, 40), role: 'admin' };
  db.groups[code] = { code, name: String(name).slice(0, 60), createdAt: Date.now(), members: [admin], adminKey: crypto.randomBytes(12).toString('hex') };
  persist();
  res.json({ group: publicGroup(db.groups[code]), me: admin, adminKey: db.groups[code].adminKey });
});

app.post('/api/groups/:code/join', (req, res) => {
  const g = group(req.params.code);
  if (!g) return res.status(404).json({ error: 'group not found' });
  const { name, adminKey } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  let me = g.members.find(m => m.name === name);
  if (!me) {
    const role = (adminKey && adminKey === g.adminKey) ? 'admin' : 'student';
    me = { id: nowId(), name: String(name).slice(0, 40), role };
    g.members.push(me);
    persist();
  }
  res.json({ group: publicGroup(g), me });
});

app.get('/api/groups/:code', (req, res) => {
  const g = group(req.params.code);
  if (!g) return res.status(404).json({ error: 'group not found' });
  res.json({ group: publicGroup(g) });
});

/* ---------- shared feed (materials, errors, cases, duty swaps, diary shared entries) ---------- */
const ENTRY_TYPES = ['material', 'error', 'case', 'duty-swap', 'diary', 'comment'];

app.get('/api/groups/:code/feed', (req, res) => {
  const g = group(req.params.code);
  if (!g) return res.status(404).json({ error: 'group not found' });
  let list = db.entries.filter(e => e.group === g.code);
  const { type } = req.query;
  if (type) list = list.filter(e => e.type === type);
  list.sort((a, b) => b.ts - a.ts);
  res.json({ entries: list.slice(0, 300) });
});

app.post('/api/groups/:code/entries', (req, res) => {
  const g = group(req.params.code);
  if (!g) return res.status(404).json({ error: 'group not found' });
  const { type, authorId, authorName, title, body, visibility, meta } = req.body || {};
  if (!ENTRY_TYPES.includes(type)) return res.status(400).json({ error: 'bad type' });
  if (!authorId || !g.members.find(m => m.id === authorId)) return res.status(403).json({ error: 'not a member' });
  const e = {
    id: nowId(), group: g.code, type, ts: Date.now(),
    authorId, authorName: String(authorName || '').slice(0, 40),
    title: String(title || '').slice(0, 160),
    body: String(body || '').slice(0, 8000),
    visibility: ['private', 'group', 'public'].includes(visibility) ? visibility : 'group',
    meta: meta && typeof meta === 'object' ? meta : {}
  };
  db.entries.push(e);
  persist();
  res.json({ entry: e });
});

app.post('/api/groups/:code/entries/:id/comments', (req, res) => {
  const g = group(req.params.code);
  const e = db.entries.find(x => x.id === req.params.id && x.group === req.params.code);
  if (!g || !e) return res.status(404).json({ error: 'not found' });
  const { authorId, authorName, text } = req.body || {};
  if (!authorId || !g.members.find(m => m.id === authorId)) return res.status(403).json({ error: 'not a member' });
  e.meta.comments = e.meta.comments || [];
  e.meta.comments.push({ id: nowId(), ts: Date.now(), authorName: String(authorName || '').slice(0, 40), text: String(text || '').slice(0, 1000) });
  persist();
  res.json({ entry: e });
});

app.delete('/api/groups/:code/entries/:id', (req, res) => {
  const g = group(req.params.code);
  if (!g) return res.status(404).json({ error: 'group not found' });
  const i = db.entries.findIndex(x => x.id === req.params.id && x.group === g.code);
  if (i < 0) return res.status(404).json({ error: 'not found' });
  const { memberId, adminKey } = req.body || {};
  const isAdmin = adminKey && adminKey === g.adminKey;
  if (!isAdmin && db.entries[i].authorId !== memberId) return res.status(403).json({ error: 'no rights' });
  db.entries.splice(i, 1);
  persist();
  res.json({ ok: true });
});

/* ---------- personal backup sync (device key -> any JSON) ---------- */
app.put('/api/sync/:key', (req, res) => {
  const key = String(req.params.key).slice(0, 64);
  const size = JSON.stringify(req.body || {}).length;
  if (size > 4 * 1024 * 1024) return res.status(413).json({ error: 'too large (max ~4MB)' });
  db.sync[key] = { ts: Date.now(), data: req.body || {} };
  persist();
  res.json({ ok: true, ts: db.sync[key].ts });
});

app.get('/api/sync/:key', (req, res) => {
  const rec = db.sync[String(req.params.key).slice(0, 64)];
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.listen(PORT, () => console.log('MedHub running on http://localhost:' + PORT));
