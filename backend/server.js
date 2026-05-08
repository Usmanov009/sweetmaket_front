require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const auth    = require('./middleware/auth');
const initDB  = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Lazy DB init — shared promise prevents concurrent init calls
let dbInitPromise = null;
app.use(async (_req, _res, next) => {
  if (!dbInitPromise) {
    dbInitPromise = initDB()
      .then(() => console.log('Database initialized successfully'))
      .catch(error => {
        console.error('Database initialization failed:', error);
        dbInitPromise = null; // allow retry on next request
      });
  }
  await dbInitPromise;
  next();
});

// Health check (keep-alive ping endpoint)
app.get('/api/ping', (_req, res) => res.json({ ok: true, t: Date.now() }));

// Public routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/seller',   require('./routes/seller'));
app.use('/api/bot',      require('./routes/bot'));
app.use('/api/products', require('./routes/products'));
app.use('/api/explore',  require('./routes/explore'));
app.use('/api/bakeries', require('./routes/bakeries'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/admin',     require('./routes/admin')); // Temporary admin route

// Protected routes
app.use('/api/orders',        auth, require('./routes/orders'));
app.use('/api/cards',         auth, require('./routes/cards'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/birthdays',     auth, require('./routes/birthdays'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Route xato:', err.message);
  res.status(500).json({ error: err.message });
});

// Local dev: serve static + listen
if (require.main === module) {
  if (isProd) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SweetMarket backend: http://0.0.0.0:${PORT}`);

    // Keep-alive: Render free tier 15 daqiqada sleep rejimiga o'tadi.
    // Har 14 daqiqada o'zimizni ping qilib uyg'oq tutamiz.
    if (isProd) {
      const https = require('https');
      const baseUrl = process.env.BACKEND_URL || 'https://sweetmaket-front-1.onrender.com';
      setInterval(() => {
        https.get(`${baseUrl}/api/ping`, res => {
          console.log(`[keep-alive] ping → ${res.statusCode}`);
        }).on('error', e => console.error('[keep-alive] xato:', e.message));
      }, 14 * 60 * 1000);
      console.log('[keep-alive] 14 daqiqalik self-ping yoqildi');
    }
    if (isProd && process.env.BOT_TOKEN) {
      const backendUrl = process.env.BACKEND_URL || 'https://sweetmaket-front-1.onrender.com';
      const https = require('https');
      const body = JSON.stringify({ url: `${backendUrl}/api/bot/webhook` });
      const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${process.env.BOT_TOKEN}/setWebhook`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, res => {
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => console.log('[bot] Webhook natija:', buf));
      });
      req.on('error', e => console.error('[bot] Webhook xato:', e.message));
      req.write(body);
      req.end();
    }
  });
  server.on('error', err => {
    if (err.code === 'EADDRINUSE') { console.error(`❌ Port ${PORT} band!`); process.exit(1); }
  });
}

// Vercel serverless export
module.exports = app;