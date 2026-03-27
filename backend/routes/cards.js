const router = require('express').Router();
const { readDB, writeDB, genId } = require('../utils/db');

// GET /api/cards
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.cards.filter(c => c.userId === req.user.id));
});

// POST /api/cards
router.post('/', (req, res) => {
  const { last4, brand, expiry, holderName } = req.body;
  if (!last4) return res.status(400).json({ error: 'Karta ma\'lumotlari kerak' });

  const db = readDB();
  const userCards = db.cards.filter(c => c.userId === req.user.id);
  const card = {
    id: genId(),
    userId: req.user.id,
    last4,
    brand: brand || 'Visa',
    expiry: expiry || '',
    holderName: holderName || '',
    isDefault: userCards.length === 0,
    createdAt: new Date().toISOString(),
  };
  db.cards.push(card);
  writeDB(db);
  res.status(201).json(card);
});

// PATCH /api/cards/:id/default
router.patch('/:id/default', (req, res) => {
  const db = readDB();
  const target = db.cards.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!target) return res.status(404).json({ error: 'Karta topilmadi' });

  db.cards = db.cards.map(c => {
    if (c.userId !== req.user.id) return c;
    return { ...c, isDefault: c.id === req.params.id };
  });
  writeDB(db);
  res.json(db.cards.filter(c => c.userId === req.user.id));
});

// DELETE /api/cards/:id
router.delete('/:id', (req, res) => {
  const db = readDB();
  const card = db.cards.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!card) return res.status(404).json({ error: 'Karta topilmadi' });

  db.cards = db.cards.filter(c => !(c.id === req.params.id && c.userId === req.user.id));
  writeDB(db);
  res.json({ message: 'Karta o\'chirildi' });
});

module.exports = router;
