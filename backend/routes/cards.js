const router = require('express').Router();
const pool   = require('../db/pool');
const { genId } = require('../utils/db');

// GET /api/cards
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json(rows.map(rowToCard));
});

// POST /api/cards
router.post('/', async (req, res) => {
  const { last4, brand, expiry, holderName } = req.body;
  if (!last4) return res.status(400).json({ error: "Karta ma'lumotlari kerak" });

  const { rows: existing } = await pool.query(
    'SELECT id FROM cards WHERE user_id = $1', [req.user.id]
  );
  const isDefault = existing.length === 0;
  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO cards (id, user_id, last4, brand, expiry, holder_name, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, req.user.id, last4, brand || 'Visa', expiry || '', holderName || '', isDefault]
  );
  res.status(201).json(rowToCard(rows[0]));
});

// PATCH /api/cards/:id/default
router.patch('/:id/default', async (req, res) => {
  const { rows: target } = await pool.query(
    'SELECT id FROM cards WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
  );
  if (!target[0]) return res.status(404).json({ error: 'Karta topilmadi' });

  await pool.query('UPDATE cards SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
  await pool.query('UPDATE cards SET is_default = TRUE  WHERE id = $1',      [req.params.id]);

  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]
  );
  res.json(rows.map(rowToCard));
});

// DELETE /api/cards/:id
router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM cards WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Karta topilmadi' });
  res.json({ message: "Karta o'chirildi" });
});

function rowToCard(r) {
  return {
    id: r.id,
    userId: r.user_id,
    last4: r.last4,
    brand: r.brand,
    expiry: r.expiry,
    holderName: r.holder_name,
    isDefault: r.is_default,
    createdAt: r.created_at,
  };
}

module.exports = router;
