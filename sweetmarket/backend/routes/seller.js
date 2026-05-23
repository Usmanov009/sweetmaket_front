const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../db/pool');
const { genId } = require('../utils/db');
const { sendTelegramMessage } = require('../utils/telegram');
const { m } = require('../utils/i18n');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'sweetmarket_secret_key';

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'sweetmarket_salt').digest('hex');
}

// Normalize phone to digits only (e.g. "+998 90 123 45 67" → "998901234567")
function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
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
    const { name, shopName, phone, password, address, description, region, city } = req.body;
    if (!name || !shopName || !phone || !password)
      return res.status(400).json({ error: m(req, 'requiredFields') });

    const normPhone = normalizePhone(phone);
    const existing = (await pool.query(
      `SELECT id FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [normPhone]
    )).rows[0];
    if (existing) return res.status(400).json({ error: m(req, 'phoneExists') });

    const id = genId();
    const hash = hashPassword(password);
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, description, region, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, name, shopName, normPhone, hash, address||'', description||'', region||'', city||'']
    );
    const row = (await pool.query('SELECT * FROM sellers WHERE id=$1', [id])).rows[0];
    const token = jwt.sign({ id: row.id, phone: row.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, seller: rowToSeller(row) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seller/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password, telegramId } = req.body;
    if (!phone || !password) return res.status(400).json({ error: m(req, 'phonePassRequired') });

    const normPhone = normalizePhone(phone);
    const row = (await pool.query(
      `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
      [normPhone]
    )).rows[0];
    if (!row) return res.status(400).json({ error: m(req, 'sellerNotFound') });
    if (row.password !== hashPassword(password)) return res.status(400).json({ error: m(req, 'wrongPassword') });

    // Telegram orqali kirsa — telegram_id ni bog'lash
    if (telegramId && !row.telegram_id) {
      await pool.query(
        `UPDATE sellers SET telegram_id = $1 WHERE id = $2`,
        [String(telegramId), row.id]
      ).catch(() => {});
    }

    const token = jwt.sign({ id: row.id, phone: row.phone, role: 'seller' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, seller: rowToSeller(row) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/me
router.get('/me', sellerAuth, async (req, res) => {
  try {
    // Try by id first, then fall back to phone (handles old tokens where id may differ)
    let row = (await pool.query('SELECT * FROM sellers WHERE id=$1', [req.seller.id])).rows[0];
    if (!row && req.seller.phone) {
      const norm = normalizePhone(req.seller.phone);
      row = (await pool.query(
        `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
        [norm]
      )).rows[0];
    }
    if (!row) return res.status(404).json({ error: 'Sotuvchi topilmadi' });
    res.json({ seller: rowToSeller(row) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper: user ga notification yuborish
async function notifyUser(userId, title, message, type = 'order') {
  const id = genId();
  await pool.query(
    'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1,$2,$3,$4,$5)',
    [id, userId, title, message, type]
  ).catch(() => {});
}

// PATCH /api/seller/orders/:id/status
router.patch('/orders/:id/status', sellerAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Noto'g'ri status" });

    // Buyurtma ma'lumotlarini olish
    const orderRow = (await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id])).rows[0];

    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);

    if (orderRow) {
      // User ning telegram_id sini olish
      const userTgRow = orderRow.user_id
        ? (await pool.query('SELECT telegram_id FROM users WHERE id=$1', [orderRow.user_id]).catch(() => ({ rows: [] }))).rows[0]
        : null;
      const userTgId = userTgRow?.telegram_id;
      const orderId  = String(orderRow.id).slice(-6).toUpperCase();

      if (status === 'confirmed' && orderRow.user_id) {
        await notifyUser(
          orderRow.user_id,
          'Buyurtmangiz qabul qilindi ✅',
          'Sotuvchi buyurtmangizni qabul qildi va tayyorlamoqda',
          'order_confirmed'
        );
        if (userTgId) sendTelegramMessage(userTgId,
          `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n` +
          `🧾 Buyurtma #${orderId}\n\n` +
          `Qandolatchi buyurtmangizni qabul qildi va tayyorlamoqda. Tayyor bo'lganda xabar beramiz!`
        );
      }

      if (status === 'ready' && orderRow.user_id) {
        const sellerRow = (await pool.query('SELECT address, shop_name FROM sellers WHERE id=$1', [req.seller.id])).rows[0];
        const addr = sellerRow?.address || sellerRow?.shop_name || 'Qandolatchi manzili';
        await notifyUser(
          orderRow.user_id,
          '🎂 Buyurtmangiz tayyor',
          `Buyurtmangiz tayyor. Quyidagi manzilda olib keting: ${addr}`,
          'order_ready'
        );
        if (userTgId) sendTelegramMessage(userTgId,
          `🎂 <b>Buyurtmangiz tayyor!</b>\n` +
          `🧾 Buyurtma #${orderId}\n\n` +
          `📍 Olib ketish manzili:\n<b>${addr}</b>\n\n` +
          `Iltimos, tez orada olib keting!`
        );
      }

      if (status === 'delivered' && orderRow.user_id) {
        const commission = Number(orderRow.total || 0) * 0.1;
        await pool.query(
          'UPDATE sellers SET plan_earnings = COALESCE(plan_earnings, 0) + $1 WHERE id=$2',
          [commission, req.seller.id]
        ).catch(() => {});
        await notifyUser(
          orderRow.user_id,
          'Buyurtma topshirildi 🎉',
          'Buyurtmangiz muvaffaqiyatli topshirildi. Rahmat!',
          'order_delivered'
        );
        if (userTgId) sendTelegramMessage(userTgId,
          `🎉 <b>Buyurtma topshirildi!</b>\n` +
          `🧾 Buyurtma #${orderId}\n\n` +
          `Buyurtmangiz muvaffaqiyatli topshirildi. Rahmat, yana buyurtma bering! 🍰`
        );
      }

      if (status === 'cancelled' && orderRow.user_id) {
        await notifyUser(
          orderRow.user_id,
          '❌ Buyurtma bekor qilindi',
          'Buyurtmangiz bekor qilindi. Iltimos, boshqa qandolatchiga murojaat qiling.',
          'order_cancelled'
        );
        if (userTgId) sendTelegramMessage(userTgId,
          `❌ <b>Buyurtma bekor qilindi</b>\n` +
          `🧾 Buyurtma #${orderId}\n\n` +
          `Afsuski qandolatchi buyurtmangizni bajara olmadi. Boshqa qandolatchiga murojaat qiling.`
        );
      }
    }

    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/plan
router.get('/plan', sellerAuth, async (req, res) => {
  try {
    const sellerRow = (await pool.query(
      'SELECT COALESCE(plan_earnings, 0) as plan_earnings FROM sellers WHERE id=$1', [req.seller.id]
    )).rows[0];

    let deliveredOrders = [];
    try {
      const { rows } = await pool.query(
        `SELECT id, total, address, created_at FROM orders
         WHERE seller_id::TEXT = $1 AND status = 'delivered'
         ORDER BY created_at DESC`,
        [req.seller.id]
      );
      deliveredOrders = rows;
    } catch { /* address column might still be missing on first call */ }

    res.json({
      totalEarnings: Number(sellerRow?.plan_earnings || 0),
      orders: deliveredOrders.map(o => ({
        id: o.id,
        total: Number(o.total),
        commission: Number(o.total) * 0.1,
        address: o.address || '',
        createdAt: o.created_at,
      })),
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/orders
router.get('/orders', sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    if (!sellerId) return res.status(400).json({ error: 'Seller ID topilmadi' });

    // Query by bakery JSON id field — avoids seller_id column type issues entirely
    // CartPage stores bakery.id = 'seller_<sellerId>' for all seller orders
    const { rows: orderRows } = await pool.query(
      `SELECT * FROM orders WHERE bakery->>'id' = $1 ORDER BY created_at DESC LIMIT 100`,
      [`seller_${sellerId}`]
    );

    // Step 2: fetch user info
    const userIds = [...new Set(orderRows.map(o => o.user_id).filter(Boolean))];
    let userMap = {};
    if (userIds.length > 0) {
      try {
        const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
        const { rows: userRows } = await pool.query(
          `SELECT id, name, phone FROM users WHERE id IN (${placeholders})`,
          userIds
        );
        userRows.forEach(u => { userMap[u.id] = u; });
      } catch { /* non-fatal */ }
    }

    const result = orderRows.map(o => ({
      ...o,
      user_name:  userMap[o.user_id]?.name  || '',
      user_phone: userMap[o.user_id]?.phone || '',
    }));

    res.json(result);
  } catch(e) {
    console.error('Seller orders error:', e.message, e.stack);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/diag  — diagnostic endpoint
router.get('/diag', sellerAuth, async (req, res) => {
  const result = { sellerId: req.seller.id, sellerKey: `seller_${req.seller.id}` };
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) as cnt FROM orders`);
    result.totalOrders = rows[0]?.cnt;
  } catch(e) { result.ordersTableError = e.message; }
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as cnt FROM orders WHERE bakery->>'id' = $1`,
      [`seller_${req.seller.id}`]
    );
    result.myOrdersByBakery = rows[0]?.cnt;
  } catch(e) { result.bakeryQueryError = e.message; }
  try {
    const { rows } = await pool.query(`SELECT id, bakery->>'id' as bakery_id FROM orders LIMIT 5`);
    result.sampleOrders = rows;
  } catch(e) { result.sampleError = e.message; }
  res.json(result);
});

// GET /api/seller/products
router.get('/products', sellerAuth, async (req, res) => {
  try {
    // products column may not exist yet — use COALESCE fallback
    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    res.json(rows[0]?.products || []);
  } catch(e) {
    console.error('Get seller products error:', e.message);
    // products column might not exist yet — run migration and return empty
    await pool.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'`).catch(()=>{});
    res.json([]);
  }
});

// POST /api/seller/products
router.post('/products', sellerAuth, async (req, res) => {
  try {
    const { name, emoji, price, desc, category = 'tort', ingredients } = req.body;
    if (!name || !emoji || !price || !ingredients) {
      return res.status(400).json({ error: 'Name, emoji, price va ingredients kerak' });
    }

    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    
    const products = rows[0]?.products || [];
    const newProduct = {
      id: genId(),
      name,
      emoji,
      price: Number(price),
      desc: desc || '',
      category,
      ingredients: ingredients, // Required field
      badge: 'NEW',
      badgeColor: '#1a7a3a',
      bg: 'linear-gradient(135deg,#ffb3d1,#ffd6e7)'
    };
    
    products.push(newProduct);
    
    await pool.query(
      'UPDATE sellers SET products = $1 WHERE id = $2',
      [JSON.stringify(products), req.seller.id]
    );
    
    res.json(newProduct);
  } catch(e) {
    console.error('Add seller product error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(products, '[]'::jsonb) as products FROM sellers WHERE id = $1`,
      [req.seller.id]
    );
    
    const products = rows[0]?.products || [];
    const filteredProducts = products.filter(p => p.id !== req.params.id);
    
    await pool.query(
      'UPDATE sellers SET products = $1 WHERE id = $2',
      [JSON.stringify(filteredProducts), req.seller.id]
    );
    
    res.json({ ok: true });
  } catch(e) {
    console.error('Delete seller product error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/seller/location — region va city saqlash
router.patch('/location', sellerAuth, async (req, res) => {
  try {
    const { region, city } = req.body;
    if (!region || !city) return res.status(400).json({ error: 'Region va city kerak' });
    await pool.query('UPDATE sellers SET region=$1, city=$2 WHERE id=$3', [region, city, req.seller.id]);
    const row = (await pool.query('SELECT * FROM sellers WHERE id=$1', [req.seller.id])).rows[0];
    res.json({ seller: rowToSeller(row) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/seller/publish — explore + home sahifaga mahsulot qo'shish
router.post('/publish', sellerAuth, async (req, res) => {
  try {
    const { name, emoji, bg, price, tags, desc, note } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom kerak' });

    const sellerRow = (await pool.query('SELECT * FROM sellers WHERE id = $1', [req.seller.id])).rows[0];
    if (!sellerRow) return res.status(404).json({ error: 'Sotuvchi topilmadi' });

    const postId = genId();
    const fullDesc = [desc, note].filter(Boolean).join(' — ');

    await pool.query(
      `INSERT INTO explore_posts (id, seller_id, user_name, name, description, emoji, bg, price, tags, public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)`,
      [postId, sellerRow.id, sellerRow.shop_name,
       name, fullDesc, emoji || '🎂', bg || '#fce4ec',
       price || 0, JSON.stringify(Array.isArray(tags) ? tags : [])]
    );

    res.json({ ok: true, postId });
  } catch(e) {
    console.error('Seller publish error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/publish/:postId — o'z postini o'chirish
router.delete('/publish/:postId', sellerAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM explore_posts WHERE id = $1 AND seller_id = $2', [req.params.postId, req.seller.id]);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seller/posts — o'z postlari
router.get('/posts', sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM explore_posts WHERE seller_id = $1 ORDER BY created_at DESC`,
      [req.seller.id]
    );
    res.json(rows.map(r => ({
      id: r.id, name: r.name, desc: r.description, emoji: r.emoji,
      bg: r.bg, price: Number(r.price), tags: r.tags || [], createdAt: r.created_at,
    })));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

function rowToSeller(r) {
  return {
    id: r.id,
    name: r.name,
    shopName: r.shop_name,
    phone: r.phone,
    address: r.address,
    description: r.description,
    region: r.region || '',
    city: r.city || '',
    createdAt: r.created_at,
  };
}

// GET /api/seller/announcements
router.get('/announcements', sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM cake_announcements WHERE seller_id = $1 ORDER BY created_at DESC',
      [req.seller.id]
    );
    res.json(rows);
  } catch(e) {
    console.error('Get seller announcements error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seller/announcements
router.post('/announcements', sellerAuth, async (req, res) => {
  try {
    const { name, emoji, ingredients, price, description, category = 'tort' } = req.body;
    if (!name || !ingredients) {
      return res.status(400).json({ error: 'Name va ingredients kerak' });
    }

    const id = genId();
    await pool.query(
      `INSERT INTO cake_announcements (id, seller_id, name, emoji, ingredients, price, description, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.seller.id, name, emoji || '🎂', ingredients, price || 0, description || '', category]
    );

    const { rows } = await pool.query('SELECT * FROM cake_announcements WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch(e) {
    console.error('Create announcement error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/announcements/:id
router.delete('/announcements/:id', sellerAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cake_announcements WHERE id = $1 AND seller_id = $2', 
      [req.params.id, req.seller.id]);
    res.json({ ok: true });
  } catch(e) {
    console.error('Delete announcement error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
// ─── Filiallar ─────────────────────────────────────────────────────────────

// GET /api/seller/branches
router.get('/branches', sellerAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM seller_branches WHERE seller_id = $1 ORDER BY created_at ASC',
      [req.seller.id]
    );
    res.json(rows);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seller/branches
router.post('/branches', sellerAuth, async (req, res) => {
  try {
    const { name, address, phone, workingHours } = req.body;
    if (!address) return res.status(400).json({ error: 'Manzil kerak' });
    const id = genId();
    await pool.query(
      `INSERT INTO seller_branches (id, seller_id, name, address, phone, working_hours)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, req.seller.id, name || '', address, phone || '', workingHours || '']
    );
    const { rows } = await pool.query('SELECT * FROM seller_branches WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/seller/branches/:id
router.patch('/branches/:id', sellerAuth, async (req, res) => {
  try {
    const { name, address, phone, workingHours } = req.body;
    await pool.query(
      `UPDATE seller_branches SET name=$1, address=$2, phone=$3, working_hours=$4
       WHERE id=$5 AND seller_id=$6`,
      [name || '', address || '', phone || '', workingHours || '', req.params.id, req.seller.id]
    );
    const { rows } = await pool.query('SELECT * FROM seller_branches WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/seller/branches/:id
router.delete('/branches/:id', sellerAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM seller_branches WHERE id = $1 AND seller_id = $2',
      [req.params.id, req.seller.id]);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});
