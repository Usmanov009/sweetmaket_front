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

// Normalize phone to digits only (e.g. "+998 90 123 45 67" → "998901234567")
function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
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

    const normPhone = normalizePhone(phone);
    const existing = (await pool.query(
      `SELECT id FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [normPhone]
    )).rows[0];
    if (existing) return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });

    const id = genId();
    const hash = hashPassword(password);
    // Store phone in normalized digits-only form for consistent lookup
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, name, shopName, normPhone, hash, address||'', description||'']
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

    const normPhone = normalizePhone(phone);
    // Match by digits-only comparison so format (spaces/dashes) never matters
    const row = (await pool.query(
      `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [normPhone]
    )).rows[0];
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
    // seller_id may be INTEGER or TEXT depending on migration state — cast to TEXT for safety
    const { rows } = await pool.query(
      `SELECT o.*, u.name as user_name, u.phone as user_phone
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.seller_id::TEXT = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [sellerId]
    );
    res.json(rows);
  } catch(e) {
    console.error('Seller orders error:', e.message);
    res.json([]); // return empty array instead of 500
  }
});

// GET /api/seller/products
router.get('/products', sellerAuth, async (req, res) => {
  try {
    // products column may not exist yet — use COALESCE fallback
    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    res.json(rows[0]?.products || []);
  } catch(e) {
    console.error('Get seller products error:', e.message);
    // products column might not exist yet — run migration and return empty
    await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'`).catch(()=>{});
    res.json([]);
  }
});

// POST /api/seller/products
router.post('/products', sellerAuth, async (req, res) => {
  try {
    const { name, emoji, price, desc, category = 'tort' } = req.body;
    if (!name || !emoji || !price) {
      return res.status(400).json({ error: 'Name, emoji va price kerak' });
    }

    // Ensure products column exists
    await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'`).catch(()=>{});

    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    
    const products = rows[0]?.products || [];
    const newProduct = {
      id: Date.now().toString(),
      name,
      emoji,
      price: Number(price),
      desc: desc || '',
      category,
      rating: '0.0',
      badge: 'NEW',
      badgeColor: '#1a7a3a',
      bg: 'linear-gradient(135deg,#ffb3d1,#ffd6e7)',
      liked: false
    };
    
    products.push(newProduct);
    
    await pool.query(
      'UPDATE sellers SET products = $1 WHERE id = $2',
      [JSON.stringify(products), req.seller.id]
    );
    
    res.json(newProduct);
  } catch(e) {
    console.error('Add seller product error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    
    const products = rows[0]?.products || [];
    const filteredProducts = products.filter(p => p.id !== req.params.id);
    
    await pool.query(
      'UPDATE sellers SET products = $1 WHERE id = $2',
      [JSON.stringify(filteredProducts), req.seller.id]
    );
    
    res.json({ ok: true });
  } catch(e) {
    console.error('Delete seller product error:', e);
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