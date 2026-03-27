const router = require('express').Router();
const { readDB, writeDB, genId } = require('../utils/db');

// GET /api/orders
router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.orders.filter(o => o.userId === req.user.id));
});

// POST /api/orders
router.post('/', (req, res) => {
  const { items, total, bakery, paymentMode, cardInfo } = req.body;
  if (!items || !total) return res.status(400).json({ error: 'Items va total kerak' });

  const db = readDB();
  const order = {
    id: genId(),
    userId: req.user.id,
    items,
    total,
    bakery: bakery || null,
    paymentMode: paymentMode || 'cash',
    cardInfo: cardInfo || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  writeDB(db);
  res.status(201).json(order);
});

module.exports = router;
