const router = require('express').Router();
const pool = require('../db/pool');

// GET /api/bakeries
router.get('/', async (req, res) => {
  try {
    // Sellers ma'lumotlarini olish
    const { rows } = await pool.query(`
      SELECT id, COALESCE(shop_name, name) as name, address, phone,
             region, city,
             CASE
               WHEN COALESCE(shop_name, name) ILIKE '%sweet%' THEN '🎂'
               WHEN COALESCE(shop_name, name) ILIKE '%шири%' THEN '🧁'
               WHEN COALESCE(shop_name, name) ILIKE '%торт%' THEN '🍰'
               ELSE '🎂'
             END as emoji,
             '09:00–21:00' as hours, '4.8' as rating
      FROM sellers
      WHERE phone != '998902021051'
      ORDER BY created_at DESC
    `);
    
    // Sellers ma'lumotlarini formatlash
    const sellerBakeries = rows.map(seller => ({
      id: `seller_${seller.id}`,
      name: seller.name,
      address: seller.address,
      hours: seller.hours,
      rating: parseFloat(seller.rating) || 4.8,
      emoji: seller.emoji,
      region: seller.region || '',
      city: seller.city || '',
      lat: null,
      lng: null,
      isSeller: true
    }));
    
    res.json(sellerBakeries);
  } catch (error) {
    console.error('Bakeries API error:', error);
    res.json([]);
  }
});

module.exports = router;
