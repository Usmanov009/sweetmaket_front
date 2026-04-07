const router = require('express').Router();
const pool   = require('../db/pool');
const { genId } = require('../utils/db');

// GET /api/orders
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows.map(rowToOrder));
  } catch (e) { next(e); }
});

// POST /api/orders
router.post('/', async (req, res, next) => {
  try {
    const { items, total, bakery, paymentMode, cardInfo } = req.body;
    if (!items || !total) return res.status(400).json({ error: 'Items va total kerak' });

    // Bakery dan seller_id ni olish
    let sellerId = null;
    if (bakery && bakery.id && bakery.id.toString().startsWith('seller_')) {
      // Agar bu seller bakery bo'lsa
      sellerId = parseInt(bakery.id.toString().replace('seller_', ''));
    }

    const id = genId();
    const { rows } = await pool.query(
      `INSERT INTO orders (id, user_id, seller_id, items, total, bakery, payment_mode, card_info, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING *`,
      [id, req.user.id, sellerId, JSON.stringify(items), total,
       bakery ? JSON.stringify(bakery) : null,
       paymentMode || 'cash',
       cardInfo ? JSON.stringify(cardInfo) : null]
    );
    res.status(201).json(rowToOrder(rows[0]));
  } catch (e) { next(e); }
});


function rowToOrder(r) {
  return {
    id: r.id,
    userId: r.user_id,
    sellerId: r.seller_id,
    items: r.items,
    total: Number(r.total),
    bakery: r.bakery,
    paymentMode: r.payment_mode,
    cardInfo: r.card_info,
    status: r.status,
    createdAt: r.created_at,
  };
}

module.exports = router;