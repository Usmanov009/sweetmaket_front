const router = require('express').Router();
const { products } = require('../db/static.json');

// GET /api/products
router.get('/', (req, res) => {
  res.json(products || []);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = (products || []).find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json(product);
});

module.exports = router;
