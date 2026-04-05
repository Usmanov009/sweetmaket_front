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

// Lazy DB init — runs once on first request
let dbReady = false;
app.use(async (_req, _res, next) => {
  if (!dbReady) {
    try { await initDB(); dbReady = true; } catch {}
  }
  next();
});

// Public routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/seller',   require('./routes/seller'));
app.use('/api/bot',      require('./routes/bot'));
app.use('/api/products', require('./routes/products'));
app.use('/api/explore',  require('./routes/explore'));
app.use('/api/bakeries', require('./routes/bakeries'));
app.use('/api/chat',      require('./routes/chat'));

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
  const server = app.listen(PORT, '0.0.0.0', () =>
    console.log(`✅ SweetMarket backend: http://0.0.0.0:${PORT}`)
  );
  server.on('error', err => {
    if (err.code === 'EADDRINUSE') { console.error(`❌ Port ${PORT} band!`); process.exit(1); }
  });
}

// Vercel serverless export
module.exports = app;