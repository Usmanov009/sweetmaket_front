const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { getDB } = require('../db/mongo');
const { genId } = require('../utils/db');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'sweetmarket_secret_key';

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'sweetmarket_salt').digest('hex');
}

function sellerAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'seller') return res.status(403).json({ error: 'Sotuvchi emas' });
    req.seller = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz' });
  }
}

// POST /api/seller/register
router.post('/register', async (req, res) => {
  try {
    const { name, shopName, phone, password, address, description } = req.body;
    if (!name || !shopName || !phone || !password) {
      return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
    }

    const db = getDB();
    
    // Telefon raqam takrorlanishini tekshirish
    const existingSeller = await db.collection('sellers').findOne({ phone });
    if (existingSeller) {
      return res.status(400).json({ error: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan' });
    }

    const id = genId();
    const hashedPassword = hashPassword(password);
    
    const newSeller = {
      id,
      name,
      shop_name: shopName,
      phone,
      password: hashedPassword,
      address: address || '',
      description: description || '',
      products: [],
      created_at: new Date()
    };

    await db.collection('sellers').insertOne(newSeller);
    
    const token = jwt.sign({ id, phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    
    const sellerResponse = {
      id,
      name,
      shopName,
      phone,
      address,
      description,
      createdAt: newSeller.created_at
    };

    res.status(201).json({ token, seller: sellerResponse });
  } catch (error) {
    console.error('Seller registration error:', error);
    res.status(500).json({ error: 'Ro\'yxatdan o\'tishda xatolik' });
  }
});

// POST /api/seller/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Telefon va parol kerak' });
    }

    const db = getDB();
    const seller = await db.collection('sellers').findOne({ phone });
    
    if (!seller || seller.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Telefon yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign({ id: seller.id, phone: seller.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    
    const sellerResponse = {
      id: seller.id,
      name: seller.name,
      shopName: seller.shop_name,
      phone: seller.phone,
      address: seller.address,
      description: seller.description,
      createdAt: seller.created_at
    };

    res.json({ token, seller: sellerResponse });
  } catch (error) {
    console.error('Seller login error:', error);
    res.status(500).json({ error: 'Login xatolik' });
  }
});

// GET /api/seller/me
router.get('/me', sellerAuth, async (req, res) => {
  try {
    const db = getDB();
    const seller = await db.collection('sellers').findOne({ id: req.seller.id });
    if (!seller) return res.status(404).json({ error: 'Sotuvchi topilmadi' });
    
    const sellerResponse = {
      id: seller.id,
      name: seller.name,
      shopName: seller.shop_name,
      phone: seller.phone,
      address: seller.address,
      description: seller.description,
      createdAt: seller.created_at
    };
    
    res.json({ seller: sellerResponse });
  } catch (error) {
    console.error('Get seller me error:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// GET /api/seller/orders
router.get('/orders', sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const db = getDB();
    
    // Avval o'z buyurtmalari
    const myOrders = await db.collection('orders').find({ seller_id: sellerId }).toArray();
    
    // Keyin tasdiqlangan buyurtmalarni qolgan sotuvchilardan olish
    const otherOrders = await db.collection('orders').find({
      status: { $in: ['confirmed', 'ready'] },
      seller_id: { $ne: sellerId, $exists: true },
      seller_id: { $nin: await getActiveSellerIds(db) }
    }).toArray();
    
    // Ikkala ro'yxatni birlashtirish
    const allOrders = [...myOrders, ...otherOrders];
    
    res.json(allOrders);
  } catch(e) {
    console.error('Seller orders error:', e);
    res.status(500).json({ error: e.message });
  }
});

async function getActiveSellerIds(db) {
  const activeSellers = await db.collection('sellers').find({
    phone: { $exists: true, $ne: null },
    password: { $exists: true, $ne: null }
  }).project({ id: 1 }).toArray();
  return activeSellers.map(s => s.id);
}

// GET /api/seller/products
router.get('/products', sellerAuth, async (req, res) => {
  try {
    const db = getDB();
    const seller = await db.collection('sellers').findOne({ id: req.seller.id });
    const products = seller?.products || [];
    res.json(products);
  } catch(e) {
    console.error('Get seller products error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seller/products
router.post('/products', sellerAuth, async (req, res) => {
  try {
    const { name, emoji, price, desc, category = 'tort' } = req.body;
    if (!name || !emoji || !price) {
      return res.status(400).json({ error: 'Name, emoji va price kerak' });
    }

    const db = getDB();
    const seller = await db.collection('sellers').findOne({ id: req.seller.id });
    
    const products = seller?.products || [];
    const newProduct = {
      id: Date.now().toString(),
      name,
      emoji,
      price: Number(price),
      desc: desc || '',
      category,
      rating: '0.0',
      badge: 'NEW',
      badgeColor: '#1a7a3a',
      bg: 'linear-gradient(135deg,#ffb3d1,#ffd6e7)',
      liked: false
    };
    
    products.push(newProduct);
    
    await db.collection('sellers').updateOne(
      { id: req.seller.id },
      { $set: { products } }
    );
    
    res.json(newProduct);
  } catch(e) {
    console.error('Add seller product error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', sellerAuth, async (req, res) => {
  try {
    const db = getDB();
    const seller = await db.collection('sellers').findOne({ id: req.seller.id });
    
    const products = seller?.products || [];
    const filteredProducts = products.filter(p => p.id !== req.params.id);
    
    await db.collection('sellers').updateOne(
      { id: req.seller.id },
      { $set: { products: filteredProducts } }
    );
    
    res.json({ ok: true });
  } catch(e) {
    console.error('Delete seller product error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/seller/orders/:orderId/status
router.patch('/orders/:orderId/status', sellerAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.orderId;
    
    const db = getDB();
    const result = await db.collection('orders').updateOne(
      { id: orderId },
      { $set: { status } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }
    
    res.json({ ok: true });
  } catch(e) {
    console.error('Update order status error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
