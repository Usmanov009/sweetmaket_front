const router = require('express').Router();
const pool = require('../db/pool');
const { genId } = require('../utils/db');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweetmarket_admin_2024';

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
       FROM sellers ORDER BY plan_earnings DESC`
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
// This should be removed after use!
router.delete('/cleanup-users', async (req, res) => {
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

module.exports = router;
