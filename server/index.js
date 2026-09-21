import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const db = new Database(process.env.DATABASE_PATH || './freshers.db');
const authTokens = new Set();

app.use(express.json({ limit: '2mb' }));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    key TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    registration TEXT,
    branch TEXT,
    phone TEXT,
    email TEXT,
    event_type TEXT,
    performance TEXT,
    participants INTEGER,
    description TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS passes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    registration TEXT NOT NULL UNIQUE,
    branch TEXT NOT NULL,
    type TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pass_code TEXT UNIQUE,
    qr_token TEXT UNIQUE,
    payment_status TEXT DEFAULT 'PENDING',
    status TEXT DEFAULT 'UNUSED',
    price INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    used_at TEXT
  );
`);

const DEFAULT_SETTINGS = {
  eventName: 'DIPLOMA ENGINEERING FRESHERS',
  eventYear: '2026',
  university: 'USHA MARTIN UNIVERSITY',
  heroHeading: 'DIPLOMA ENGINEERING\nFRESHERS\nPASS &\nCULTURAL EVENTS',
  heroSubtitle: 'A new chapter. A shared stage. Make your first university memories unforgettable.',
  eventDate: 'TO BE ANNOUNCED SOON',
  eventTime: '',
  venue: 'USHA MARTIN UNIVERSITY CAMPUS',
  passPrice: '499',
  announcement: 'Freshers event date will be announced soon.',
  coordinatorName: '',
  coordinatorPhone: '',
  coordinatorEmail: '',
};

const DEFAULT_MEDIA = {
  heroImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1500&q=80',
  danceImage: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80',
  dramaImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80',
  singingImage: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  logo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=200&q=80',
};

const putSetting = db.prepare('INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  putSetting.run(key, String(value));
}

const ensureAnnouncement = db.prepare('SELECT id FROM announcements LIMIT 1');
if (!ensureAnnouncement.get()) {
  db.prepare('INSERT INTO announcements(title, body, published) VALUES (?, ?, 1)').run('Freshers Event Update', DEFAULT_SETTINGS.announcement);
}

const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
};

const getMediaMap = () => {
  const map = { ...DEFAULT_MEDIA };
  const rows = db.prepare('SELECT key, mime, data FROM media').all();
  for (const row of rows) {
    map[row.key] = `/api/media/${row.key}`;
  }
  return map;
};

const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || !authTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
};

app.get('/api/public', (req, res) => {
  res.json({
    settings: getSettings(),
    media: getMediaMap(),
    announcements: db.prepare('SELECT * FROM announcements WHERE published = 1 ORDER BY id DESC').all(),
  });
});

app.get('/api/media/:key', (req, res) => {
  const row = db.prepare('SELECT mime, data FROM media WHERE key = ?').get(req.params.key);
  if (!row) {
    return res.status(404).json({ error: 'Media not found' });
  }
  res.set('Content-Type', row.mime);
  res.send(Buffer.from(row.data, 'base64'));
});

app.post('/api/applications', (req, res) => {
  const { name, registration, branch, phone, email, eventType, performance, participants, description } = req.body;
  if (!name || !registration || !branch || !eventType || !['Dance', 'Drama / Acting', 'Singing'].includes(eventType)) {
    return res.status(400).json({ error: 'Please complete the required fields.' });
  }

  const result = db.prepare(
    'INSERT INTO applications(name, registration, branch, phone, email, event_type, performance, participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, registration, branch, phone || '', email || '', eventType, performance || '', Number(participants) || 1, description || '');

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Your performance request has been submitted successfully.',
  });
});

app.post('/api/passes', (req, res) => {
  const { name, registration, branch, type, phone, email, coupon } = req.body;
  if (!name || !registration || !branch || !type) {
    return res.status(400).json({ error: 'Complete all required details.' });
  }

  const price = Number(getSettings().passPrice || 499);
  const normalizedCoupon = String(coupon || '').trim().toUpperCase();
  const discount = normalizedCoupon === 'FRESHER50' ? Math.round(price * 0.5) : 0;

  try {
    const passCode = `F26-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const qrToken = crypto.randomBytes(24).toString('hex');
    const result = db.prepare(
      'INSERT INTO passes(name, registration, branch, type, phone, email, pass_code, qr_token, price, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, registration, branch, type, phone || '', email || '', passCode, qrToken, price, discount);

    res.status(201).json({
      id: result.lastInsertRowid,
      amount: price - discount,
      original: price,
      discount,
      passCode,
      message: 'Registration saved. Razorpay keys can be configured later for payment verification.',
    });
  } catch (error) {
    res.status(409).json({ error: 'A pass already exists for this registration number.' });
  }
});

app.post('/api/retrieve', (req, res) => {
  const { registration, passCode } = req.body;
  const pass = db.prepare('SELECT * FROM passes WHERE registration = ? AND pass_code = ?').get(registration, passCode);
  if (!pass) {
    return res.status(404).json({ error: 'Pass not found. Check your registration number and pass code.' });
  }
  res.json({ pass, settings: getSettings() });
});

app.post('/api/organiser/login', (req, res) => {
  const organiserId = process.env.ORGANISER_ID || 'NIKHIL_2515082';
  const organiserPassword = process.env.ORGANISER_PASSWORD || '11856';

  if (req.body.id !== organiserId || req.body.password !== organiserPassword) {
    return res.status(401).json({ error: 'Invalid organiser credentials.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  authTokens.add(token);
  res.json({ token });
});

app.get('/api/admin/content', auth, (req, res) => {
  const settings = getSettings();
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY id DESC').all();
  res.json({ settings, media: getMediaMap(), announcements });
});

app.patch('/api/admin/settings', auth, (req, res) => {
  const update = req.body || {};
  const upsert = db.prepare('INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');

  for (const [key, value] of Object.entries(update)) {
    if (key in DEFAULT_SETTINGS) {
      upsert.run(key, String(value));
    }
  }

  res.json({ settings: getSettings() });
});

app.post('/api/admin/media/:key', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image required.' });
  }

  const payload = req.file.buffer.toString('base64');
  db.prepare('INSERT INTO media(key, mime, data) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET mime = excluded.mime, data = excluded.data')
    .run(req.params.key, req.file.mimetype, payload);

  res.json({ url: `/api/media/${req.params.key}` });
});

app.post('/api/admin/announcements', auth, (req, res) => {
  const { title, body, published = true } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  const result = db.prepare('INSERT INTO announcements(title, body, published) VALUES (?, ?, ?)')
    .run(title, body, published ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.patch('/api/admin/announcements/:id', auth, (req, res) => {
  const { title, body, published } = req.body || {};
  const stmt = db.prepare('UPDATE announcements SET title = COALESCE(?, title), body = COALESCE(?, body), published = COALESCE(?, published) WHERE id = ?');
  stmt.run(title ?? null, body ?? null, published === undefined ? null : published ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/announcements/:id', auth, (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/dashboard', auth, (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) AS paid,
      SUM(CASE WHEN status = 'USED' THEN 1 ELSE 0 END) AS used,
      SUM(CASE WHEN type = 'FRESHER' THEN 1 ELSE 0 END) AS freshers,
      SUM(CASE WHEN type = 'SENIOR' THEN 1 ELSE 0 END) AS seniors,
      COALESCE(SUM(price - discount), 0) AS revenue,
      COALESCE(SUM(discount), 0) AS discounts
    FROM passes
  `).get();

  const passes = db.prepare('SELECT * FROM passes ORDER BY id DESC LIMIT 20').all();
  const applications = db.prepare('SELECT * FROM applications ORDER BY id DESC LIMIT 20').all();
  res.json({ stats, passes, applications });
});

app.post('/api/scanner/validate', auth, (req, res) => {
  const token = req.body.token || '';
  const pass = db.prepare('SELECT * FROM passes WHERE qr_token = ? OR pass_code = ?').get(token, token);
  if (!pass) {
    return res.status(404).json({ error: 'Pass not found.' });
  }
  res.json({ pass });
});

app.post('/api/scanner/use', auth, (req, res) => {
  const pass = db.prepare('SELECT * FROM passes WHERE id = ?').get(req.body.id);
  if (!pass) {
    return res.status(404).json({ error: 'Pass not found.' });
  }
  if (pass.status === 'USED') {
    return res.status(409).json({ error: 'PASS ALREADY USED', pass });
  }
  db.prepare("UPDATE passes SET status = 'USED', used_at = CURRENT_TIMESTAMP WHERE id = ?").run(pass.id);
  const updated = db.prepare('SELECT * FROM passes WHERE id = ?').get(pass.id);
  res.json({ pass: updated });
});

const distDir = path.resolve('dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Freshers API running on http://localhost:${port}`);
});
