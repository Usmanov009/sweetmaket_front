const router = require('express').Router();
const pool   = require('../db/pool');
const { genId } = require('../utils/db');

// GET /api/birthdays
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM birthdays WHERE user_id = $1', [req.user.id]
  );
  res.json(rows.map(rowToBday));
});

// POST /api/birthdays
router.post('/', async (req, res) => {
  const { emoji, name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Ism va sana kerak' });

  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO birthdays (id, user_id, emoji, name, date) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, req.user.id, emoji || '🎂', name, date]
  );
  res.status(201).json(rowToBday(rows[0]));
});

// DELETE /api/birthdays/:id
router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM birthdays WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ message: "O'chirildi" });
});

function rowToBday(r) {
  return { id: r.id, userId: r.user_id, emoji: r.emoji, name: r.name, date: r.date };
}

module.exports = router;
