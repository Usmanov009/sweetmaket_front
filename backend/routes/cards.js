const router = require('express').Router();
const { getDB } = require('../db/mongo');
const { genId } = require('../utils/db');

// GET /api/cards
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const cards = await db.collection('cards')
      .find({ user_id: req.user.id })
      .sort({ created_at: 1 })
      .toArray();
    res.json(cards.map(rowToCard));
  } catch (e) { next(e); }
});

// POST /api/cards
router.post('/', async (req, res, next) => {
  try {
    const { last4, brand, expiry, holderName } = req.body;
    if (!last4) return res.status(400).json({ error: "Karta ma'lumotlari kerak" });

    const db = getDB();
    const existing = await db.collection('cards')
      .find({ user_id: req.user.id })
      .toArray();
    
    const isDefault = existing.length === 0;
    const id = genId();
    
    const newCard = {
      id,
      user_id: req.user.id,
      last4,
      brand: brand || 'Visa',
      expiry: expiry || '',
      holder_name: holderName || '',
      is_default: isDefault,
      created_at: new Date()
    };

    await db.collection('cards').insertOne(newCard);
    res.status(201).json(rowToCard(newCard));
  } catch (e) { next(e); }
});

// PATCH /api/cards/:id/default
router.patch('/:id/default', async (req, res, next) => {
  try {
    const db = getDB();
    const target = await db.collection('cards').findOne({
      id: req.params.id,
      user_id: req.user.id
    });
    
    if (!target) return res.status(404).json({ error: 'Karta topilmadi' });

    await db.collection('cards').updateMany(
      { user_id: req.user.id },
      { $set: { is_default: false } }
    );
    
    await db.collection('cards').updateOne(
      { id: req.params.id },
      { $set: { is_default: true } }
    );

    const cards = await db.collection('cards')
      .find({ user_id: req.user.id })
      .sort({ created_at: 1 })
      .toArray();
    
    res.json(cards.map(rowToCard));
  } catch (e) { next(e); }
});

// DELETE /api/cards/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection('cards').deleteOne({
      id: req.params.id,
      user_id: req.user.id
    });
    
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Karta topilmadi' });
    res.json({ message: "Karta o'chirildi" });
  } catch (e) { next(e); }
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
