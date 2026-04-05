const router = require('express').Router();
const pool = require('../db/pool');

// GET /api/bakeries
router.get('/', async (req, res) => {
  try {
    // Sellers ma'lumotlarini olish
    const { rows } = await pool.query(`
      SELECT id, name as shop_name, address, phone, 
             COALESCE(shop_name, name) as name,
             CASE 
               WHEN shop_name LIKE '%Sweet%' THEN '🎂'
               WHEN shop_name LIKE '%Ширин%' THEN '🧁'
               WHEN shop_name LIKE '%Торт%' THEN '🍰'
               ELSE '🎂'
             END as emoji, 
             '09:00–21:00' as hours, '4.8' as rating
      FROM sellers 
      WHERE address IS NOT NULL AND address != ''
      ORDER BY created_at DESC
    `);
    
    // Static bakeries bilan birlashtirish (agar kerak bo'lsa)
    const { bakeries: staticBakeries } = require('../db/static.json');
    
    // Sellers ma'lumotlarini formatlash
    const sellerBakeries = rows.map(seller => ({
      id: `seller_${seller.id}`,
      name: seller.name,
      address: seller.address,
      hours: seller.hours,
      rating: parseFloat(seller.rating) || 4.8,
      emoji: seller.emoji,
      lat: null, // Sellers uchun kordinatalar hozircha yo'q
      lng: null,
      isSeller: true
    }));
    
    // Ikkala turdagi manzillarni birlashtirish
    const allBakeries = [...sellerBakeries, ...(staticBakeries || [])];
    
    res.json(allBakeries);
  } catch (error) {
    console.error('Bakeries API error:', error);
    // Xatolik bo'lsa static ma'lumotlarni qaytarish
    const { bakeries: staticBakeries } = require('../db/static.json');
    res.json(staticBakeries || []);
  }
});

module.exports = router;
