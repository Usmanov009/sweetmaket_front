const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../db/pool');
const { genId } = require('../utils/db');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'sweetmarket_secret_key';

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'sweetmarket_salt').digest('hex');
}

function sellerAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'seller') return res.status(403).json({ error: 'Sotuvchi emas' });
    req.seller = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz' });
  }
}

// POST /api/seller/register
router.post('/register', async (req, res) => {
  try {
    const { name, shopName, phone, password, address, description } = req.body;
    if (!name || !shopName || !phone || !password)
      return res.status(400).json({ error: 'Ism, do\'kon nomi, telefon va parol kerak' });

    const existing = (await pool.query('SELECT id FROM sellers WHERE phone=$1', [phone])).rows[0];
    if (existing) return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });

    const id = genId();
    const hash = hashPassword(password);
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, name, shopName, phone, hash, address||'', description||'']
    );
    const row = (await pool.query('SELECT * FROM sellers WHERE id=$1', [id])).rows[0];
    const token = jwt.sign({ id: row.id, phone: row.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, seller: rowToSeller(row) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seller/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Telefon va parol kerak' });

    const row = (await pool.query('SELECT * FROM sellers WHERE phone=$1', [phone])).rows[0];
    if (!row) return res.status(400).json({ error: 'Sotuvchi topilmadi' });
    if (row.password !== hashPassword(password)) return res.status(400).json({ error: 'Parol noto\'g\'ri' });

    const token = jwt.sign({ id: row.id, phone: row.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, seller: rowToSeller(row) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/me
router.get('/me', sellerAuth, async (req, res) => {
  const row = (await pool.query('SELECT * FROM sellers WHERE id=$1', [req.seller.id])).rows[0];
  if (!row) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ seller: rowToSeller(row) });
});

// PATCH /api/seller/orders/:id/status
router.patch('/orders/:id/status', sellerAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','confirmed','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Noto'g'ri status" });
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/orders
router.get('/orders', sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    
    // Avval o'z buyurtmalari
    const { rows: myOrders } = await pool.query(
      `SELECT o.*, u.name as user_name, u.phone as user_phone, s.name as seller_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN sellers s ON s.id = o.seller_id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [sellerId]
    );
    
    // Keyin tasdiqlangan buyurtmalarni qolgan sotuvchilardan olish
    // Faqat tasdiqlangan va tayyor buyurtmalar, ularning sotuvchisi faol emasligi kerak
    const { rows: otherOrders } = await pool.query(
      `SELECT o.*, u.name as user_name, u.phone as user_phone, s.name as seller_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN sellers s ON s.id = o.seller_id
       WHERE o.status IN ('confirmed', 'ready') 
       AND o.seller_id != $1
       AND o.seller_id IS NOT NULL
       AND o.seller_id NOT IN (
         SELECT id FROM sellers WHERE phone IS NOT NULL AND password IS NOT NULL
       )
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [sellerId]
    );
    
    // Ikkala ro'yxatni birlashtirish
    const allOrders = [...myOrders, ...otherOrders];
    
    res.json(allOrders);
  } catch(e) {
    console.error('Seller orders error:', e);
    res.status(500).json({ error: e.message });
  }
});

function rowToSeller(r) {
  return {
    id: r.id,
    name: r.name,
    shopName: r.shop_name,
    phone: r.phone,
    address: r.address,
    description: r.description,
    createdAt: r.created_at,
  };
}

module.exports = router;