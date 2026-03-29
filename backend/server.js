require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const auth    = require('./middleware/auth');
const initDB  = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? true : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Public routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/explore',  require('./routes/explore'));
app.use('/api/bakeries', require('./routes/bakeries'));

// Protected routes
app.use('/api/orders',        auth, require('./routes/orders'));
app.use('/api/cards',         auth, require('./routes/cards'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/birthdays',     auth, require('./routes/birthdays'));

// Global async error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Route xato:', err.message);
  res.status(500).json({ error: err.message });
});

// Production: serve built frontend
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SweetMarket backend: http://0.0.0.0:${PORT}`);
  const tryInit = (attempt = 1) => {
    initDB()
      .then(() => console.log('✅ Neon DB tayyor'))
      .catch(err => {
        console.error(`⚠️  DB init urinish ${attempt}:`, err.message);
        if (attempt < 5) setTimeout(() => tryInit(attempt + 1), 3000 * attempt);
        else console.error('❌ DB init muvaffaqiyatsiz tugadi');
      });
  };
  tryInit();
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} band!`);
    process.exit(1);
  }
});
