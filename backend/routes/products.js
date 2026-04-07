const router = require('express').Router();
const { getDB } = require('../db/mongo');

// GET /api/products - Barcha sellerlar mahsulotlarini olish
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const sellers = await db.collection('sellers').find({}).toArray();
    
    let allProducts = [];
    sellers.forEach(seller => {
      if (seller.products && Array.isArray(seller.products)) {
        const sellerProducts = seller.products.map(product => ({
          ...product,
          seller_id: seller.id,
          seller_name: seller.shop_name
        }));
        allProducts = [...allProducts, ...sellerProducts];
      }
    });
    
    res.json(allProducts);
  } catch (e) { 
    console.error('Products error:', e);
    next(e); 
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const db = getDB();
    const sellers = await db.collection('sellers').find({}).toArray();
    
    let product = null;
    for (const seller of sellers) {
      if (seller.products && Array.isArray(seller.products)) {
        const found = seller.products.find(p => p.id == req.params.id);
        if (found) {
          product = { ...found, seller_id: seller.id, seller_name: seller.shop_name };
          break;
        }
      }
    }
    
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (e) { next(e); }
});

module.exports = router;
