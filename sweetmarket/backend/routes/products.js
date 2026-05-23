const router = require('express').Router();
const pool   = require('../db/pool');
const { products: staticProducts } = require('../db/static.json');

// GET /api/products — static + seller published
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ep.id, ep.name, ep.description, ep.emoji, ep.bg, ep.price, ep.tags,
              s.shop_name, s.id as seller_id
       FROM explore_posts ep
       JOIN sellers s ON s.id = ep.seller_id
       WHERE ep.public = TRUE AND ep.seller_id IS NOT NULL
       ORDER BY ep.created_at DESC`
    );

    const sellerProducts = rows.map(r => ({
      id: `post_${r.id}`,
      postId: r.id,
      name: r.name,
      desc: r.description || '',
      emoji: r.emoji || '🎂',
      bg: r.bg || '#fce4ec',
      price: Number(r.price),
      category: (r.tags || [])[0] || 'tort',
      badge: r.shop_name,
      badgeColor: '#059669',
      sellerId: r.seller_id,
      isSeller: true,
    }));

    res.json([...(staticProducts || []), ...sellerProducts]);
  } catch (e) {
    res.json(staticProducts || []);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = (staticProducts || []).find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json(product);
});

module.exports = router;
