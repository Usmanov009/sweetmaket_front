const router = require('express').Router();
const { getDB } = require('../db/mongo');
const { genId } = require('../utils/db');

// GET /api/birthdays
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const birthdays = await db.collection('birthdays')
      .find({ user_id: req.user.id })
      .toArray();
    res.json(birthdays.map(rowToBday));
  } catch (e) { next(e); }
});

// POST /api/birthdays
router.post('/', async (req, res, next) => {
  try {
    const { emoji, name, date } = req.body;
    if (!name || !date) return res.status(400).json({ error: 'Ism va sana kerak' });

    const id = genId();
    const newBirthday = {
      id,
      user_id: req.user.id,
      emoji: emoji || '🎂',
      name,
      date,
      created_at: new Date()
    };

    const db = getDB();
    await db.collection('birthdays').insertOne(newBirthday);
    res.status(201).json(rowToBday(newBirthday));
  } catch (e) { next(e); }
});

// DELETE /api/birthdays/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection('birthdays').deleteOne({
      id: req.params.id,
      user_id: req.user.id
    });
    
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Topilmadi' });
    res.json({ message: "O'chirildi" });
  } catch (e) { next(e); }
});

function rowToBday(r) {
  return { 
    id: r.id, 
    userId: r.user_id, 
    emoji: r.emoji, 
    name: r.name, 
    date: r.date 
  };
}

module.exports = router;
