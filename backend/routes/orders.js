const router = require('express').Router();
const pool   = require('../db/pool');
const { genId } = require('../utils/db');

// Ensure orders table has nullable TEXT seller_id
async function migrateOrders() {
  await pool.query(`ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE orders ALTER COLUMN seller_id TYPE TEXT USING seller_id::TEXT`).catch(() => {});
}

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
    const { items, total, bakery, paymentMode, cardInfo, address } = req.body;
    if (!items || !total) return res.status(400).json({ error: 'Items va total kerak' });

    let sellerId = null;
    if (bakery && bakery.sellerId) {
      sellerId = bakery.sellerId.toString();
    } else if (bakery && bakery.id && bakery.id.toString().startsWith('seller_')) {
      sellerId = bakery.id.toString().replace('seller_', '');
    }

    const id = genId();

    // Try insert with seller_id and address
    let row;
    try {
      const { rows } = await pool.query(
        `INSERT INTO orders (id, user_id, seller_id, items, total, bakery, payment_mode, card_info, address, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *`,
        [id, req.user.id, sellerId, JSON.stringify(items), total,
         bakery ? JSON.stringify(bakery) : null,
         paymentMode || 'cash',
         cardInfo ? JSON.stringify(cardInfo) : null,
         address || '']
      );
      row = rows[0];
    } catch (e) {
      // seller_id column might be NOT NULL or wrong type — migrate and retry without it
      console.error('orders insert failed, migrating:', e.message);
      await migrateOrders();
      const { rows } = await pool.query(
        `INSERT INTO orders (id, user_id, items, total, bakery, payment_mode, card_info, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
        [id, req.user.id, JSON.stringify(items), total,
         bakery ? JSON.stringify(bakery) : null,
         paymentMode || 'cash',
         cardInfo ? JSON.stringify(cardInfo) : null]
      );
      row = rows[0];
    }

    res.status(201).json(rowToOrder(row));
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
    address: r.address || '',
    status: r.status,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('uz-UZ') : '',
    createdAt: r.created_at,
  };
}

module.exports = router;
