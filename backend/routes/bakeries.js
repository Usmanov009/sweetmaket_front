const router = require('express').Router();
const pool   = require('../db/pool');

// GET /api/bakeries — sellers + their branches from seller_branches table
router.get('/', async (req, res) => {
  try {
    const { rows: sellers } = await pool.query(`
      SELECT id, COALESCE(shop_name, name) as name, address, phone,
             region, city,
             CASE
               WHEN COALESCE(shop_name, name) ILIKE '%sweet%' THEN '🎂'
               WHEN COALESCE(shop_name, name) ILIKE '%шири%'  THEN '🧁'
               WHEN COALESCE(shop_name, name) ILIKE '%торт%'  THEN '🍰'
               ELSE '🎂'
             END as emoji
      FROM sellers
      WHERE phone != '998902021051'
      ORDER BY created_at DESC
    `);

    const { rows: allBranches } = await pool.query(
      `SELECT * FROM seller_branches ORDER BY created_at ASC`
    ).catch(() => ({ rows: [] }));

    const sellerBakeries = sellers.map(seller => {
      const dbBranches = allBranches.filter(b => b.seller_id === seller.id);
      const addr = (seller.address && String(seller.address).trim()) || '';
      const fromRegion = [seller.region, seller.city].filter(Boolean).join(', ');
      const displayAddr = addr || fromRegion || 'Manzil kiritilmagan';

      // Build branches list: seller_branches from DB + main address as fallback
      const branches = dbBranches.length > 0
        ? dbBranches.map(b => ({
            id: b.id,
            kind: 'branch',
            name: b.name || '',
            address: b.address,
            phone: b.phone || '',
            hours: b.working_hours || '',
            emoji: seller.emoji,
            region: seller.region || '',
            city: seller.city || '',
            isSellerBranch: true,
          }))
        : [{
            id: `seller_br_${seller.id}_main`,
            kind: 'main',
            name: '',
            address: displayAddr,
            phone: seller.phone || '',
            hours: '',
            emoji: seller.emoji,
            region: seller.region || '',
            city: seller.city || '',
            isSellerBranch: true,
          }];

      return {
        id: `seller_${seller.id}`,
        sellerId: seller.id,
        name: seller.name,
        address: displayAddr,
        emoji: seller.emoji,
        region: seller.region || '',
        city: seller.city || '',
        isSeller: true,
        branches,
      };
    });

    res.json(sellerBakeries);
  } catch (error) {
    console.error('Bakeries API error:', error);
    res.json([]);
  }
});

module.exports = router;