const router = require('express').Router();
const { getDB } = require('../db/mongo');

// GET /api/chat/:orderId - chat tarixini olish
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const db = getDB();
    
    const messages = await db.collection('chat_messages')
      .find({ order_id: parseInt(orderId) })
      .sort({ created_at: 1 })
      .toArray();
    
    res.json(messages);
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
    
    const db = getDB();
    const newMessage = {
      order_id: parseInt(orderId),
      sender_id: senderId,
      sender_type: senderType,
      message: message,
      created_at: new Date()
    };
    
    await db.collection('chat_messages').insertOne(newMessage);
    
    // Notification yuborish (agar kerak bo'lsa)
    const order = await db.collection('orders').findOne({ id: orderId });
    
    if (senderType === 'seller' && order) {
      // User ga notification yuborish
      await db.collection('notifications').insertOne({
        id: Date.now().toString(),
        user_id: order.user_id,
        title: 'Yangi xabar',
        message: message,
        type: 'chat_message',
        order_id: orderId,
        created_at: new Date()
      });
    } else if (senderType === 'user' && order) {
      // Seller ga notification yuborish
      await db.collection('notifications').insertOne({
        id: Date.now().toString(),
        user_id: order.seller_id,
        title: 'Yangi xabar',
        message: message,
        type: 'chat_message',
        order_id: orderId,
        created_at: new Date()
      });
    }
    
    res.json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Xabar yuborishda xatolik' });
  }
});

module.exports = router;
