const express = require('express');
const cors    = require('cors');
const auth    = require('./middleware/auth');

const app  = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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

const server = app.listen(PORT, () => {
  console.log(`✅ SweetMarket backend: http://localhost:${PORT}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} band!`);
    process.exit(1);
  }
});
