const router = require('express').Router();
const pool = require('../db/pool');

// GET /api/chat/:orderId - chat tarixini olish
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rows } = await pool.query(`
      SELECT id, sender_id, sender_type, message, created_at
      FROM chat_messages 
      WHERE order_id = $1::INTEGER 
      ORDER BY created_at ASC
    `, [orderId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Chat tarixini olishda xatolik' });
  }
});

// POST /api/chat - yangi xabar yuborish
router.post('/', async (req, res) => {
  try {
    const { orderId, senderId, senderType, message } = req.body;
    
    if (!orderId || !senderId || !senderType || !message) {
      return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
    }
    
    const { rows } = await pool.query(`
      INSERT INTO chat_messages (order_id, sender_id, sender_type, message)
      VALUES ($1::INTEGER, $2, $3, $4)
      RETURNING id, sender_id, sender_type, message, created_at
    `, [orderId, senderId, senderType, message]);
    
    // Notification yuborish (agar kerak bo'lsa)
    if (senderType === 'seller') {
      // User ga notification yuborish
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, order_id)
        SELECT user_id, $1, $2, $3, $4
        FROM orders 
        WHERE id = $5
      `, ['Yangi xabar', message, 'chat_message', orderId, orderId]);
    } else if (senderType === 'user') {
      // Seller ga notification yuborish
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, order_id)
        SELECT seller_id, $1, $2, $3, $4
        FROM orders 
        WHERE id = $5
      `, ['Yangi xabar', message, 'chat_message', orderId, orderId]);
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Xabar yuborishda xatolik' });
  }
});

module.exports = router;
