const router = require('express').Router();
const pool = require('../db/pool');
const { genId } = require('../utils/db');

// GET /api/chat/:orderId
router.get('/:orderId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, sender_id, sender_type, message, image_url, created_at
       FROM chat_messages
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [req.params.orderId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Chat history error:', e.message);
    res.json([]);
  }
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { orderId, senderId, senderType, message, imageUrl } = req.body;
    if (!orderId || !senderId || !senderType) {
      return res.status(400).json({ error: 'orderId, senderId, senderType kerak' });
    }
    if (!message && !imageUrl) {
      return res.status(400).json({ error: 'Xabar yoki rasm kerak' });
    }

    const id = genId();
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (id, order_id, sender_id, sender_type, message, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sender_id, sender_type, message, image_url, created_at`,
      [id, orderId, senderId, senderType, message || '', imageUrl || '']
    );

    // User ga notification (seller xabar yuborganda)
    if (senderType === 'seller') {
      const orderRow = (await pool.query('SELECT user_id FROM orders WHERE id=$1', [orderId])).rows[0];
      if (orderRow?.user_id) {
        const notifId = genId();
        await pool.query(
          'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1,$2,$3,$4,$5)',
          [notifId, orderRow.user_id, 'Yangi xabar 💬', message || '📷 Rasm yuborildi', 'chat_message']
        ).catch(() => {});
      }
    }

    res.json(rows[0]);
  } catch (e) {
    console.error('Send message error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
