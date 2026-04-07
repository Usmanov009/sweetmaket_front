const router = require('express').Router();
const { getDB } = require('../db/mongo');

// GET /api/bakeries
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const sellers = await db.collection('sellers')
      .find({ 
        address: { $exists: true, $ne: '', $ne: null }
      })
      .sort({ created_at: -1 })
      .toArray();
    
    // Sellers ma'lumotlarini formatlash
    const sellerBakeries = sellers.map(seller => {
      let emoji = '🎂';
      const shopName = seller.shop_name || '';
      
      if (shopName.toLowerCase().includes('sweet')) emoji = '🎂';
      else if (shopName.toLowerCase().includes('ширин')) emoji = '🧁';
      else if (shopName.toLowerCase().includes('торт')) emoji = '🍰';
      
      return {
        id: `seller_${seller.id}`,
        name: seller.shop_name || seller.name,
        address: seller.address,
        hours: '09:00–21:00',
        rating: 4.8,
        emoji: emoji,
        lat: null, // Sellers uchun kordinatalar hozircha yo'q
        lng: null,
        isSeller: true
      };
    });
    
    res.json(sellerBakeries);
  } catch (error) {
    console.error('Bakeries API error:', error);
    res.json([]);
  }
});

module.exports = router;
