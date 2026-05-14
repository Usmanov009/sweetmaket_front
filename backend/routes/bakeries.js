const router = require('express').Router();
const pool = require('../db/pool');
const { bakeries: staticBakeries } = require('../db/static.json');

// GET /api/bakeries — konditerlar + statik filial/restoranlar
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
    
    // Har bir qandolatchi uchun kamida bitta filial (keyin JSONB bilan kengaytirish mumkin)
    const sellerBakeries = rows.map(seller => {
      const addr = (seller.address && String(seller.address).trim()) || '';
      const fromRegion = [seller.region, seller.city].filter(Boolean).join(', ');
      const displayAddr = addr || fromRegion || '';
      const branches = [
        {
          id: `seller_br_${seller.id}_main`,
          kind: 'main',
          name: 'main',
          address: displayAddr || 'Manzil kiritilmagan',
          hours: seller.hours,
          rating: parseFloat(seller.rating) || 4.8,
          emoji: seller.emoji,
          region: seller.region || '',
          city: seller.city || '',
          isSellerBranch: true,
        },
        {
          id: `seller_br_${seller.id}_2`,
          kind: 'branch',
          name: 'Filial 2',
          address: displayAddr ? `${displayAddr} (2)` : 'Manzil kiritilmagan',
          hours: seller.hours,
          rating: parseFloat(seller.rating) || 4.8,
          emoji: seller.emoji,
          region: seller.region || '',
          city: seller.city || '',
          isSellerBranch: true,
        },
      ];
      return {
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
        isSeller: true,
        branches,
      };
    });

    const branches = (staticBakeries || []).map(b => ({
      ...b,
      id: `branch_${b.id}`,
      region: '',
      city: '',
      isSeller: false,
    }));

    res.json([...sellerBakeries, ...branches]);
  } catch (error) {
    console.error('Bakeries API error:', error);
    res.json([]);
  }
});

module.exports = router;
