const router = require('express').Router();
const { readDB, writeDB, genId } = require('../utils/db');

// GET /api/birthdays
router.get('/', (req, res) => {
  const db = readDB();
  res.json((db.birthdays || []).filter(b => b.userId === req.user.id));
});

// POST /api/birthdays
router.post('/', (req, res) => {
  const { emoji, name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Ism va sana kerak' });

  const db = readDB();
  const bday = { id: genId(), userId: req.user.id, emoji: emoji || '🎂', name, date };
  db.birthdays.push(bday);
  writeDB(db);
  res.status(201).json(bday);
});

// DELETE /api/birthdays/:id
router.delete('/:id', (req, res) => {
  const db = readDB();
  db.birthdays = (db.birthdays || []).filter(
    b => !(b.id === req.params.id && b.userId === req.user.id)
  );
  writeDB(db);
  res.json({ message: 'O\'chirildi' });
});

module.exports = router;
