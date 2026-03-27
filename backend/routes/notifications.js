const router = require('express').Router();
const { readDB, writeDB } = require('../utils/db');

// GET /api/notifications
router.get('/', (req, res) => {
  const db = readDB();
  res.json((db.notifications || []).filter(n => n.userId === req.user.id));
});

// PATCH /api/notifications/read-all
router.patch('/read-all', (req, res) => {
  const db = readDB();
  db.notifications = (db.notifications || []).map(n =>
    n.userId === req.user.id ? { ...n, read: true } : n
  );
  writeDB(db);
  res.json(db.notifications.filter(n => n.userId === req.user.id));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  const db = readDB();
  db.notifications = (db.notifications || []).map(n =>
    n.id === req.params.id && n.userId === req.user.id ? { ...n, read: true } : n
  );
  writeDB(db);
  res.json(db.notifications.filter(n => n.userId === req.user.id));
});

module.exports = router;
