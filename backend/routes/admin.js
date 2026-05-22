const router = require('express').Router();
const pool = require('../db/pool');
const { genId } = require('../utils/db');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'usmanov009';

function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'Ruxsat yo\'q' });
  next();
}

// GET /api/admin/plans — barcha qandolatchilar va ularning planlari
router.get('/plans', adminAuth, async (req, res) => {
  try {
    const { rows: sellers } = await pool.query(
      `SELECT id, name, shop_name, phone, address, COALESCE(plan_earnings, 0) as plan_earnings, created_at
       FROM sellers WHERE phone != '998902021051' ORDER BY plan_earnings DESC`
    );

    const result = await Promise.all(sellers.map(async s => {
      const { rows: orders } = await pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
                COUNT(*) FILTER (WHERE status = 'pending')   as pending,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                COALESCE(SUM(total) FILTER (WHERE status = 'delivered'), 0) as revenue
         FROM orders WHERE bakery->>'id' = $1`,
        [`seller_${s.id}`]
      );
      const o = orders[0];
      return {
        id: s.id,
        name: s.name,
        shopName: s.shop_name,
        phone: s.phone,
        address: s.address,
        planEarnings: Number(s.plan_earnings),
        createdAt: s.created_at,
        stats: {
          total:     Number(o.total),
          delivered: Number(o.delivered),
          pending:   Number(o.pending),
          confirmed: Number(o.confirmed),
          cancelled: Number(o.cancelled),
          revenue:   Number(o.revenue),
        },
      };
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/sellers/:id/reset-plan — planini nollash va botdan xabar
router.post('/sellers/:id/reset-plan', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, shop_name, telegram_id, COALESCE(plan_earnings, 0) as plan_earnings FROM sellers WHERE id = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sotuvchi topilmadi' });

    const seller = rows[0];
    const planAmount = Number(seller.plan_earnings);
    const collectedAmount = req.body.collectedAmount != null
      ? Number(req.body.collectedAmount)
      : planAmount;
    const now = new Date().toLocaleString('uz-UZ', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent',
    });

    await pool.query('UPDATE sellers SET plan_earnings = 0 WHERE id = $1', [seller.id]);

    if (seller.telegram_id) {
      const { sendTelegramMessage } = require('../utils/telegram');
      sendTelegramMessage(
        seller.telegram_id,
        `💸 <b>Plan to'ldirildi!</b>\n\n` +
        `🏪 Do'kon: <b>${seller.shop_name}</b>\n` +
        `💰 Plan summasi: <b>${planAmount.toLocaleString('ru-RU')} so'm</b>\n` +
        `✅ Olingan summa: <b>${collectedAmount.toLocaleString('ru-RU')} so'm</b>\n` +
        `🕐 Sana: <b>${now}</b>\n\n` +
        `Keyingi oyda ham omad! 🎂`
      );
    }

    res.json({ ok: true, planAmount, collectedAmount, resetAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/users — barcha foydalanuvchilar
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone, username, telegram_id, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Temporary endpoint to delete specific users
router.delete('/cleanup-users', adminAuth, async (req, res) => {
  try {
    const userIds = [
      'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
      'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
      'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
      'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
      'mo35sjwfxjlb'
    ];
    
    console.log('Starting cleanup of test users...');
    
    // Delete related data first
    const birthdayResult = await pool.query(
      `DELETE FROM birthdays WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${birthdayResult.rowCount} birthday records`);
    
    const orderResult = await pool.query(
      `DELETE FROM orders WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${orderResult.rowCount} order records`);
    
    const cardResult = await pool.query(
      `DELETE FROM cards WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${cardResult.rowCount} card records`);
    
    const notificationResult = await pool.query(
      `DELETE FROM notifications WHERE user_id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${notificationResult.rowCount} notification records`);
    
    // Finally delete users
    const userResult = await pool.query(
      `DELETE FROM users WHERE id = ANY($1)`,
      [userIds]
    );
    console.log(`Deleted ${userResult.rowCount} user records`);
    
    res.json({ 
      success: true,
      deleted: {
        users: userResult.rowCount,
        birthdays: birthdayResult.rowCount,
        orders: orderResult.rowCount,
        cards: cardResult.rowCount,
        notifications: notificationResult.rowCount
      }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/delete-all — barcha userlar va admin tashqari barcha sellerlarni o'chirish
router.delete('/delete-all', adminAuth, async (req, res) => {
  try {
    // 1. Barcha userlarni va ularga bog'liq ma'lumotlarni o'chirish
    await pool.query(`DELETE FROM birthdays`);
    await pool.query(`DELETE FROM notifications`);
    await pool.query(`DELETE FROM cards`);
    await pool.query(`DELETE FROM orders`);
    const usersResult = await pool.query(`DELETE FROM users`);

    // 2. Admin tashqari barcha sellerlarni o'chirish
    const ADMIN_PHONE = '998902021051';
    await pool.query(
      `DELETE FROM explore_posts WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)`,
      [ADMIN_PHONE]
    );
    await pool.query(
      `DELETE FROM cake_announcements WHERE seller_id IN (SELECT id FROM sellers WHERE phone != $1)`,
      [ADMIN_PHONE]
    ).catch(() => {});
    const sellersResult = await pool.query(
      `DELETE FROM sellers WHERE phone != $1`,
      [ADMIN_PHONE]
    );

    res.json({
      ok: true,
      deleted: {
        users: usersResult.rowCount,
        sellers: sellersResult.rowCount,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/add-seller/:userId — user ni seller qilish (temporary no auth)
router.post('/add-seller/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const crypto = require('crypto');
    
    // Get user info
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User topilmadi' });
    
    const user = userRes.rows[0];
    
    // Check if seller already exists
    if (user.phone) {
      const sellerRes = await pool.query(
        `SELECT * FROM sellers WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE($1, '[^0-9]', '', 'g')`,
        [user.phone]
      );
      if (sellerRes.rows.length > 0) return res.json({ seller: sellerRes.rows[0] });
    }
    
    // Add seller
    const sellerId = genId();
    const hash = crypto.createHash('sha256').update('sweetmakers_admin' + 'sweetmarket_salt').digest('hex');
    
    await pool.query(
      `INSERT INTO sellers (id, name, shop_name, phone, password, address, region, city, telegram_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [sellerId, user.name || 'User', 'Sweetmakers Shop', user.phone || '998000000000', hash, 'Toshkent', 'Toshkent', 'Toshkent', user.telegram_id || null]
    );
    
    const newSeller = (await pool.query('SELECT * FROM sellers WHERE id = $1', [sellerId])).rows[0];
    res.json({ seller: newSeller });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
