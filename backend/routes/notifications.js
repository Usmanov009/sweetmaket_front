const router = require('express').Router();
const pool   = require('../db/pool');

// GET /api/notifications
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows.map(rowToNotif));
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [req.user.id]);
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]
  );
  res.json(rows.map(rowToNotif));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  await pool.query(
    'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]
  );
  res.json(rows.map(rowToNotif));
});

function rowToNotif(r) {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    message: r.message,
    type: r.type,
    read: r.read,
    createdAt: r.created_at,
  };
}

module.exports = router;
